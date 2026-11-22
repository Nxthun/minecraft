"""Assemble an isolated packwiz copy without publishing it."""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tomllib
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def indexed_paths(root):
    index = subprocess.check_output(
        ["git", "diff", "--name-only", "-z", "8518846", "--", "extras/nxterra"],
        cwd=root,
    )
    untracked = subprocess.check_output(
        ["git", "ls-files", "--others", "--exclude-standard", "-z", "--", "extras/nxterra"],
        cwd=root,
    )
    return sorted({
        Path(part.decode("utf-8")).relative_to("extras/nxterra")
        for part in (index + untracked).split(b"\0") if part
    })


def stage(root, output):
    if output.exists():
        raise ValueError(f"Trial destination already exists: {output}")
    changed = indexed_paths(root)
    if not changed:
        raise ValueError("No trial overlays were found")
    shutil.copytree(root / "packs/nxterra", output)
    index_path = output / "index.toml"
    index = tomllib.loads(index_path.read_text(encoding="utf-8"))
    files = {entry["file"]: entry for entry in index["files"]}
    for rel in changed:
        source = root / "extras/nxterra" / rel
        target = output / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        entry = files.setdefault(rel.as_posix(), {"file": rel.as_posix()})
        entry["hash"] = digest(target)
        if rel.name.endswith(".pw.toml"):
            entry["metafile"] = True

    rows = ['hash-format = "sha256"']
    for entry in files.values():
        rows.extend(["", "[[files]]", *(f"{k} = {json.dumps(v)}" for k, v in entry.items())])
    index_path.write_text("\n".join(rows) + "\n", encoding="utf-8", newline="\n")

    pack_path = output / "pack.toml"
    pack = pack_path.read_text(encoding="utf-8")
    index_hash = digest(index_path)
    pack = re.sub(r'^hash = "[0-9a-f]+"$', f'hash = "{index_hash}"', pack, flags=re.M)
    pack = re.sub(r'^version = ".*"$', f'version = "worldgen-trial-{index_hash[:7]}"', pack, flags=re.M)
    pack_path.write_text(pack, encoding="utf-8", newline="\n")
    assert tomllib.loads(pack)["index"]["hash"] == digest(index_path)
    verified = tomllib.loads(index_path.read_text(encoding="utf-8"))["files"]
    for entry in verified:
        if digest(output / entry["file"]) != entry["hash"]:
            raise ValueError(f"Hash mismatch: {entry['file']}")
    print(f"Verified {len(verified)} indexed files at {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    stage(Path(__file__).resolve().parents[2], args.output.resolve())
