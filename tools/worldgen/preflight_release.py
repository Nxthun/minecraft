"""Check a staged NxTerra pack and its copied-server startup before publishing."""

import argparse
from collections import Counter
from pathlib import Path
import re
import tomllib

from stage_trial_pack import digest


def pack_paths(root):
    pack = tomllib.loads((root / "pack.toml").read_text(encoding="utf-8"))
    metadata = pack["index"]
    if metadata["hash-format"] != "sha256":
        raise ValueError("Expected a SHA-256 pack index")
    index = checked_path(root, metadata["file"])
    if digest(index) != metadata["hash"]:
        raise ValueError("Pack index hash mismatch")
    contents = tomllib.loads(index.read_text(encoding="utf-8"))
    if contents["hash-format"] != "sha256":
        raise ValueError("Expected SHA-256 pack entries")

    paths = {}
    for entry in contents["files"]:
        path = checked_path(root, entry["file"])
        if path in paths:
            raise ValueError(f"Duplicate pack entry: {entry['file']}")
        if digest(path) != entry["hash"]:
            raise ValueError(f"Pack file hash mismatch: {entry['file']}")
        paths[path] = entry.get("metafile", False)
    return paths


def checked_path(root, relative):
    path = (root / relative).resolve(strict=True)
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError(f"Invalid pack path: {relative}")
    return path


def server_hashes(manifest):
    hashes = {}
    for line in manifest.read_text(encoding="utf-8-sig").splitlines():
        checksum, name = line.split("  ./", 1)
        if not re.fullmatch(r"[0-9a-f]{64}", checksum) or Path(name).name != name or name in hashes:
            raise ValueError(f"Invalid server manifest entry: {name}")
        hashes[name] = checksum
    if not hashes:
        raise ValueError("Server mod manifest is empty")
    return hashes


def check_shared_mods(root, paths, client_mods, server_mods):
    checked = 0
    failures = []
    declared_mods = set()
    for path, metafile in paths.items():
        if path.parent != root / "mods":
            continue
        if metafile:
            metadata = tomllib.loads(path.read_text(encoding="utf-8"))
            name = metadata["filename"]
            side = metadata.get("side", "both")
            declared_mods.add(name)
            if side == "server" and name not in server_mods:
                failures.append(f"Server mod missing: {name}")
            if side != "both":
                continue
        elif path.suffix == ".jar":
            name = path.name
            client = client_mods / name
            if not client.is_file() or digest(client) != digest(path):
                failures.append(f"Packaged JAR is missing or differs on the client: {name}")
            if name not in server_mods:
                continue
            declared_mods.add(name)
        else:
            continue
        client = client_mods / name
        if not client.is_file() or name not in server_mods:
            failures.append(f"Shared mod missing on at least one side: {name}")
        elif digest(client) != server_mods[name]:
            failures.append(f"Shared mod contents differ: {name}")
        checked += 1

    if not checked:
        raise ValueError("Pack contains no shared mod metafiles")
    failures.extend(f"Server mod absent from the pack: {name}" for name in sorted(server_mods.keys() - declared_mods))
    print(f"Checked {checked} shared mod files")
    return failures


def startup_errors(path):
    errors = Counter()
    with path.open(encoding="utf-8", errors="replace") as log:
        for line in log:
            line = re.sub(r"\x1b\[[0-9;]*m", "", line)
            if re.search(r"\[minecraft/DedicatedServer\]: Done \([\d.]+s\)!", line):
                return errors
            match = re.search(r"/(?:ERROR|FATAL)\]\s+\[([^]]+)\]:\s*(.+)", line)
            if match:
                errors[match.groups()] += 1
    raise ValueError(f"Startup completion marker missing: {path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pack", type=Path)
    parser.add_argument("client_mods", type=Path)
    parser.add_argument("server_manifest", type=Path, help="Output of sha256sum ./*.jar from the server mods directory")
    parser.add_argument("baseline_log", type=Path)
    parser.add_argument("candidate_log", type=Path)
    parser.add_argument("--rollback-archive", type=Path, help="Locally accessible rollback archive to record")
    args = parser.parse_args()
    try:
        root = args.pack.resolve(strict=True)
        paths = pack_paths(root)
        print(f"Verified {len(paths)} packwiz entries")
        failures = check_shared_mods(root, paths, args.client_mods, server_hashes(args.server_manifest))
        baseline, candidate = map(startup_errors, (args.baseline_log, args.candidate_log))
        print(f"Startup error lines: {sum(baseline.values())} baseline, {sum(candidate.values())} candidate")
        failures.extend(f"New startup error in {logger} ({count}): {message}"
                        for (logger, message), count in (candidate - baseline).items())
        if args.rollback_archive:
            archive = args.rollback_archive.resolve(strict=True)
            if not archive.is_file() or not archive.stat().st_size:
                raise ValueError("Rollback archive is empty or is not a file")
            print(f"Rollback archive: {archive}")
        if failures:
            raise ValueError("\n".join(failures))
    except (KeyError, OSError, ValueError) as error:
        parser.exit(1, f"Preflight failed: {error}\n")


if __name__ == "__main__":
    main()
