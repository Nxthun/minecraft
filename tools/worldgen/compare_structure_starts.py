"""Compare structure starts in matched Overworld chunks."""

import argparse
import gzip
import io
import json
import math
import re
import struct
import zlib
from collections import Counter
from pathlib import Path


def number(stream, format_code):
    return struct.unpack(">" + format_code, stream.read(struct.calcsize(format_code)))[0]


def text(stream):
    return stream.read(number(stream, "H")).decode("utf-8", errors="replace")


def read_tag(stream, tag, keep):
    if tag in (1, 2, 3, 4, 5, 6):
        value = number(stream, " bhiqfd"[tag])
        return value if keep else None
    if tag in (7, 11, 12):
        stream.seek(number(stream, "i") * {7: 1, 11: 4, 12: 8}[tag], 1)
        return None
    if tag == 8:
        if keep:
            return text(stream)
        stream.seek(number(stream, "H"), 1)
        return None
    if tag == 9:
        element, size = number(stream, "B"), number(stream, "i")
        for _ in range(size):
            read_tag(stream, element, None)
        return None
    if tag == 10:
        result = {}
        while element := number(stream, "B"):
            name = text(stream)
            selected = keep.get(name, keep.get("*")) if isinstance(keep, dict) else keep
            value = read_tag(stream, element, selected)
            if selected:
                result[name] = value
        return result
    raise ValueError(f"Unsupported NBT tag {tag}")


def chunk_data(payload):
    stream = io.BytesIO(payload)
    if number(stream, "B") != 10:
        raise ValueError("Chunk has no compound root")
    text(stream)
    return read_tag(stream, 10, {
        "xPos": True, "zPos": True, "Status": True,
        "structures": {"starts": {"*": {"id": True}}},
    })


PLACED_STAGES = {
    "structure_starts", "structure_references", "biomes", "noise", "surface", "carvers",
    "features", "initialize_light", "light", "spawn", "full",
}


def read_world(world, include_proto_chunks=False):
    result = {}
    for region in sorted((world / "region").glob("r.*.*.mca")):
        match = re.fullmatch(r"r\.(-?\d+)\.(-?\d+)\.mca", region.name)
        if not match:
            continue
        region_x, region_z = map(int, match.groups())
        with region.open("rb") as stream:
            offsets = stream.read(4096)
            for index in range(0, len(offsets) - 3, 4):
                sector = int.from_bytes(offsets[index:index + 3], "big")
                if not sector:
                    continue
                stream.seek(sector * 4096)
                length, kind = number(stream, "I"), number(stream, "B")
                if kind & 128:
                    cell = index // 4
                    x, z = region_x * 32 + cell % 32, region_z * 32 + cell // 32
                    raw = region.with_name(f"c.{x}.{z}.mcc").read_bytes()
                    kind &= 127
                else:
                    raw = stream.read(length - 1)
                if kind == 1:
                    raw = gzip.decompress(raw)
                elif kind == 2:
                    raw = zlib.decompress(raw)
                elif kind != 3:
                    raise ValueError(f"Unsupported region compression {kind} in {region}")
                chunk = chunk_data(raw)
                stage = chunk.get("Status", "").removeprefix("minecraft:")
                if stage not in (PLACED_STAGES if include_proto_chunks else {"full"}):
                    continue
                starts = chunk.get("structures", {}).get("starts", {})
                result[chunk["xPos"], chunk["zPos"]] = [
                    name for name, metadata in starts.items() if metadata.get("id") not in {None, "INVALID"}
                ]
    return result


def statistics(chunks, footprint, windows):
    counts = Counter(name for pos in footprint for name in chunks[pos])
    areas = []
    for locations in windows.values():
        area = len(locations) * 256 / 1_000_000
        types = {name for pos in locations for name in chunks[pos]}
        areas.append(len(types) / area)
    return {
        "total_starts": sum(counts.values()),
        "distinct_types": len(counts),
        "distinct_types_per_km2": round(len(counts) / (len(footprint) * 256 / 1_000_000), 2),
        "mean_window_distinct_types_per_km2": round(sum(areas) / len(areas), 2),
        "starts_by_type": dict(sorted(counts.items())),
    }


def compare(baseline, trial, origin, radius, include_proto_chunks=False, bounds=None):
    before = read_world(baseline, include_proto_chunks)
    after = read_world(trial, include_proto_chunks)
    ox, oz = origin
    matched = before.keys() & after.keys()
    if bounds:
        min_x, min_z, max_x, max_z = bounds
        if min_x > max_x or min_z > max_z:
            raise ValueError("Minimum bounds must be at or below maximum bounds")
        matched = {pos for pos in matched
                   if min_x <= pos[0] * 16 + 8 <= max_x and min_z <= pos[1] * 16 + 8 <= max_z}
    elif radius:
        matched = {pos for pos in matched if math.hypot(pos[0] * 16 + 8 - ox, pos[1] * 16 + 8 - oz) <= radius}
    if not matched:
        raise ValueError("No shared chunks at the chosen generation stage")
    windows = {}
    for pos in matched:
        x, z = pos[0] * 16 + 8, pos[1] * 16 + 8
        windows.setdefault(((x - ox) // 1000, (z - oz) // 1000), []).append(pos)
    # Tiny slivers at a window edge produce unstable rates.
    substantial = {key: value for key, value in windows.items() if len(value) >= 196}
    return {
        "matched_chunks": len(matched),
        "matched_km2": round(len(matched) * 256 / 1_000_000, 4),
        **({"bounds_blocks": bounds} if bounds else {"radius_blocks": radius}),
        "minimum_chunk_stage": "structure_starts" if include_proto_chunks else "full",
        "windows_with_at_least_196_chunks": len(substantial),
        "baseline": statistics(before, matched, substantial or {None: matched}),
        "trial": statistics(after, matched, substantial or {None: matched}),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("baseline", type=Path)
    parser.add_argument("trial", type=Path)
    parser.add_argument("--origin", type=int, nargs=2, default=(0, 0))
    footprint = parser.add_mutually_exclusive_group()
    footprint.add_argument("--radius", type=int, default=3000)
    footprint.add_argument("--bounds", type=int, nargs=4, metavar=("MIN_X", "MIN_Z", "MAX_X", "MAX_Z"),
                           help="Rectangle in blocks, matched by inclusive chunk center")
    parser.add_argument("--include-proto-chunks", action="store_true",
                        help="Include chunks that saved structure starts before terrain completed")
    args = parser.parse_args()
    print(json.dumps(compare(args.baseline, args.trial, args.origin, args.radius, args.include_proto_chunks,
                             bounds=args.bounds), indent=2))
