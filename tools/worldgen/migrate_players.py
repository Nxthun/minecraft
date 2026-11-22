"""Copy player progress between two stopped, disposable Minecraft worlds."""

import argparse
import os
import shutil
import tempfile
from contextlib import ExitStack, contextmanager
from pathlib import Path
from uuid import UUID

import nbtlib
from nbtlib import Byte, Double, Float, Int, List, String

PROGRESS_PATHS = (
    Path("playerdata"), Path("advancements"), Path("stats"),
    Path("ftbquests"), Path("ftbteams"), Path("data/sophisticatedbackpacks.dat"),
)
RESET_TAGS = (
    "RootVehicle", "enteredNetherPosition", "LastDeathLocation", "last_death_location",
    "sleeping_pos", "SleepingX", "SleepingY", "SleepingZ", "SpawnDimension", "SpawnX",
    "SpawnY", "SpawnZ", "SpawnAngle", "SpawnForced",
)


def validate_copy(path):
    path = path.resolve(strict=True)
    production = Path("/srv/nxterra/server").resolve()
    if path == production or production in path.parents:
        raise ValueError("Use a stopped copy of the world")
    if not (path / "level.dat").is_file():
        raise ValueError(f"No level.dat in {path}")
    return path


def has_symlink(path):
    return path.is_symlink() or (path.is_dir() and any(item.is_symlink() for item in path.rglob("*")))


def new_spawn(world):
    data = nbtlib.load(world / "level.dat")["Data"]
    return int(data["SpawnX"]), int(data["SpawnY"]), int(data["SpawnZ"]), float(data.get("SpawnAngle", 0))


def reset_player(path, spawn):
    player = nbtlib.load(path)
    for name in RESET_TAGS:
        player.pop(name, None)
    x, y, z, angle = spawn
    player["Dimension"] = String("minecraft:overworld")
    player["Pos"] = List[Double]([x + 0.5, y, z + 0.5])
    player["Motion"] = List[Double]([0, 0, 0])
    player["Rotation"] = List[Float]([angle, 0])
    player["FallDistance"] = Float(0)
    player["OnGround"] = Byte(0)
    player["PortalCooldown"] = Int(0)
    # With no personal respawn point Minecraft uses the new world's shared spawn.
    player.save()


@contextmanager
def stopped_world(path):
    lock_path = path / "session.lock"
    if not lock_path.exists():
        yield
        return
    with lock_path.open("r+b") as lock:
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.lockf(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as exc:
            raise ValueError(f"World is active: {path}") from exc
        yield


def migrate(source, destination, apply):
    source, destination = validate_copy(source), validate_copy(destination)
    if source == destination or source in destination.parents or destination in source.parents:
        raise ValueError("Source and destination must be separate world directories")
    with ExitStack() as locks:
        for path in sorted((source, destination)):
            locks.enter_context(stopped_world(path))
        copy_progress(source, destination, apply)


def copy_progress(source, destination, apply):
    available = [path for path in PROGRESS_PATHS if (source / path).exists()]
    if Path("playerdata") not in available:
        raise ValueError("Source playerdata directory is missing")
    for path in available:
        old, new = source / path, destination / path
        if has_symlink(old) or has_symlink(new) or new.parent.is_symlink():
            raise ValueError(f"Symlinks are not allowed in migration paths: {path}")
        if new.exists() and (not new.is_dir() or any(new.iterdir())):
            raise ValueError(f"Destination already has progress at {path}")
    spawn = new_spawn(destination)
    players = sorted((source / "playerdata").glob("*.dat"))
    for file in players:
        UUID(file.stem)
    print(f"{'Apply' if apply else 'Dry run'}: {len(players)} player file(s), "
          f"{len(available)} progress paths, shared spawn {spawn[:3]}")
    if not apply:
        return

    with tempfile.TemporaryDirectory(prefix=".nxterra-migration-", dir=destination) as staging:
        staged = Path(staging)
        for path in available:
            old, new = source / path, staged / path
            new.parent.mkdir(parents=True, exist_ok=True)
            if old.is_dir():
                shutil.copytree(old, new, ignore=shutil.ignore_patterns("*.dat_old") if path == Path("playerdata") else None)
            else:
                shutil.copy2(old, new)
        for player in players:
            reset_player(staged / "playerdata" / player.name, spawn)

        installed = []
        try:
            for path in available:
                target = destination / path
                target.parent.mkdir(parents=True, exist_ok=True)
                # rename can replace an existing empty directory on Linux. On
                # Windows it first needs to be removed.
                had_empty_directory = target.is_dir()
                if had_empty_directory:
                    target.rmdir()
                try:
                    (staged / path).rename(target)
                except Exception:
                    if had_empty_directory:
                        target.mkdir()
                    raise
                installed.append((path, had_empty_directory))
        except Exception:
            for path, had_empty_directory in reversed(installed):
                (destination / path).rename(staged / path)
                if had_empty_directory:
                    (destination / path).mkdir()
            raise
    print("Migration copied and spawn reset")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Stopped copy or archive of the old world")
    parser.add_argument("destination", type=Path, help="Stopped new world copy, generated once")
    parser.add_argument("--apply", action="store_true", help="Apply after reviewing the dry run")
    args = parser.parse_args()
    try:
        migrate(args.source, args.destination, args.apply)
    except (ValueError, OSError, KeyError) as exc:
        parser.exit(1, f"Migration stopped: {exc}\n")


if __name__ == "__main__":
    main()
