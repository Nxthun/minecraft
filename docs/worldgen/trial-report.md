# NxTerra copied-server trial

Trial branch `worldgen/nxterra` starts at `8518846`. Altair trials use private loopback listeners and separate directories under `/srv/nxterra/worldgen-codex-20261121`. The live server, main checkout and theme worktree were outside the trial.

## Distribution

The trial thins 13 decorative sets and tightens nine of the named landmark sets. Aquamirae surface features move from roughly 3 to 22 chunks between placement grid cells, Nyctophobia from 3 to 24, BWG Ironwood Plateau from 4 to 24 and Windswept pine totems from 10 to 25. Wetland Whimsy's decorative variants have lower weights than its arenas and dungeons. The Shrine Tower moves from roughly 480 to 140 chunks, Illager Hideout from 160 to 104 and Lich Prison from 120 to 84. The spacing values govern candidate placements. Biomes, weights, exclusions and successful generation determine the realized starts.

The matched sample uses seed `3126495545519636` and a paired corridor within 3 km of the first test spawn. The table counts the distinct registry IDs in both copies over the same covered chunks. The start-stage row includes chunks that saved structure starts before terrain finished generating. These numbers include underground and decorative structures.

| Coverage | Matched area | Starts before → after | Distinct types before → after | Distinct structure types per km² before → after |
| --- | ---: | ---: | ---: | ---: |
| Fully generated, 946 matched chunks | 0.2422 km² | 34 → 33 | 23 → 22 | **94.97 → 90.84** |
| Structure-start stage or later, 4,896 matched chunks | 1.2534 km² | 172 → 167 | 56 → 54 | **44.68 → 43.08** |

The wider footprint's named repeaters fell from three to zero, two Graveyard ruins and one Windswept pine totem. The nine named landmarks had zero starts in that footprint in both copies. This sample shows less repetition. It does not establish a gain in variety or enough landmark encounters on a typical trip. It needs additional biome and seed coverage before release.

Bulk synchronous `forceload` triggered the watchdog on both copies. Chunky 1.4.23 also conflicted with Distant Horizons at startup. Paired measurements used Chunky with Distant Horizons temporarily excluded from both disposable comparison copies. Both copies ran with the same Java and heap settings. The corridor was paused after saving the matched footprint. The full 3–5 km-radius pregeneration was not completed.

## Loot and progression

The build has 25 curated structure-and-container profiles. Shared loot tables are changed only when the container is inside the matching structure piece. One key reward, two to four themed support stacks and the approved distance bonus are rolled for these ordinary containers. The existing Welcome Camp bundle gains one Dice Collection Book. Files for non-container sources, recipes, quests and biome generation remain outside these changes.

Golden Bloom Dice appears in Uncommon completion containers at **5/7/9/10%** and Rare completion containers at **8/10/12/15%** across the four distance bands. Elderheart is the Epic chase. The shipped petal recipe crafts the same tier with 20 matching petals. The shipped explicit recipes craft Moonpetal from three Golden Bloom Dice, four amethyst shards and an Eye of Ender, and Starbloom from three Moonpetal Dice and a Nether Star. Starbloom stays on the crafting path.

## Mod decisions

The branch keeps Castle Shift for Epic land landmarks, a limited Repurposed Structures allowlist for Common through Rare variety and LootJS for structure-container rewards. [Candidate review](candidate-review.md) lists all 24 follow-up releases, licenses, checked artifacts, dependencies and placement decisions.

Seven Seas 1.0.4 and Structure Layout Optimizer 1.0.13 booted together in a separate copy. In a paired 169-chunk ocean job the branch build took 112 seconds and the candidate build took 114 seconds. Observed process peak RSS was about 8.38 GiB and 5.71 GiB respectively. Each copy had a different prior generation workload, so those peaks do not isolate the mods' memory cost. The fully generated ocean overlap contained three distinct structure IDs on each copy across 0.0292 km² (**102.8 → 102.8 types/km²**). None was a Seven Seas ship. This measures overhead in deep ocean but leaves actual ship placement and generation cost unverified, so both mods stay in the separate trial. Explorer’s Compass’s two listed builds declare a required Minecraft range that excludes 1.21.1. The branch uses the existing next-tier explorer map design.

## Seed scouting

Seed `3126495545519636` is the measured trial seed, with the saved migration fixture’s spawn at `904, 85, -3509`. The running distribution copy reported `916, 85, -3513`. The corridor and ocean jobs use fixed coordinates to make the comparisons independent of those spawn shifts. No second seed has comparable coverage, and this seed has not been submitted for launch selection.

## Other verification

- The packwiz trial installed into a separate Prism instance after verifying its packaged file hashes. The client-only Alt + use mixin compiled against the shipped Hands-On Vanilla 1.2.0 method. An isolated Prism launcher found the fixture but had no account available for an actual client login. EMI interaction and a client join remain unverified.
- The migration tool rehearsed on three archived player files and six progress paths, using saved test spawn `904, 85, -3509`. It verified inventory, ender chest, XP and available attachment tags, and compared auxiliary progress files byte-for-byte. It resets positions and personal respawn points. Actual login with migrated player progress still needs a client.
- The copied server rolled exactly one Collection Book from the Welcome Camp table. At an actual Plains Watchtower structure start, I placed a test Lootr barrel with the shared village-house loot table. Lootr's normal inventory creation skips filling for fake players, so I invoked its real filler on both test inventories. One rolled Golden Bloom Dice with three support stacks and the other rolled an enchanted book with four support stacks. Removing an item from the first inventory left the second unchanged, and reopening the first returned its updated contents. This exercised the server-side fill and storage paths. A two-client check is still outstanding.
- [Loot regression checks](../../tools/worldgen/verify_loot.cjs) cover the 25 configured profiles, including probability thresholds, support counts and map fallback under controlled rolls. The copied-server check did not cover every tier and band. Wider mountain inspections and a multi-seed comparison remain outstanding.

Sources for expected test-tool behavior are the [Chunky command reference](https://github.com/pop4959/Chunky/wiki/Commands) and [NeoForge 1.21.1 loot functions](https://docs.neoforged.net/docs/1.21.1/resources/server/loottables/lootfunctions/).

## Launch preparation and compatibility follow-up

A fresh, private rehearsal generated seed `3126495545519636`, started with the regular set of server mods and saved a safe spawn at `-288, 84, -3133`. The current snapshot of all three players was migrated into a separate copy of that world. All non-position player tags matched, including attachment records, and all five auxiliary progress paths matched byte-for-byte. The pristine world is separate from the migrated-player rehearsal.

CTOV 3.6.4 contributed seven warehouse tables that failed to parse on 1.21.1. The optional Wares mod is absent from the installed NxTerra pack. The seven NxTerra-authored replacement tables give a Common key reward and two to four supplies themed to each warehouse. Each table populated a test barrel on the private server. The isolated Prism installation verified all 1,513 packwiz entries. A clean copied-server boot had 17 startup error lines, down from 24 in the old-pack baseline. The remaining errors are existing invalid block loot entries, missing tags, a legacy advancement, a sample dimension data map and mods looking for client classes during server load.

[Release preflight checker](../../tools/worldgen/preflight_release.py) verifies the staged pack, compares installed shared mod JARs with a server checksum manifest, and flags startup errors absent from the baseline. The private rehearsal matched all 228 shared JARs. The checker can record an accessible rollback archive path. It runs separately from NxHost’s Publish action. A signed-in Prism join, EMI recipe transfer, final stopped-world archive and live cutover are still outstanding.

### Follow-up pregeneration

A second, narrower 2.2 km corridor was fully generated on the baseline and tuned copies. Both used the same heap settings and Chunky 1.4.23, with Distant Horizons excluded from the benchmark copies.

| Metric | Baseline | Tuned |
| --- | ---: | ---: |
| Fully generated matched chunks | 1,251 | 1,251 |
| Elapsed pregen | 9 min 55 sec | 10 min 02 sec |
| Observed peak process RSS | 5.82 GiB | 5.88 GiB |
| Structure starts | 40 | 39 |
| Distinct structure types across 0.3203 km² | 19 | 19 |
| Distinct structure types per km² | 59.33 | 59.33 |

The tuned copy used approximately 40 MiB of additional world storage. Sampled one-minute p95 tick times near the end were 5.2 ms baseline and 3.2 ms tuned at the same wall-clock reading. This was a paired pregen sample with no players on the benchmark servers. None of the nine targeted landmark sets appeared in the corridor. The full spawn-radius pregen and a wider multi-biome comparison remain open.

Both copies initially slowed around the 54th chunk. In both JVMs, a worker was spending most of its sampled CPU time in No Man's Land's Meeting Point biome search. A separate trial widened the structure's preferred biomes and still slowed at the same stage. The biome change stays experimental. [No Man’s Land 1.21.1 Meeting Point search](https://raw.githubusercontent.com/Monad-Modding/No-Mans-Land/1.21.1/src/main/java/com/farcr/nomansland/common/mixin/ChunkGeneratorStructureStateMixin.java)

### Remaining compatibility fixes

- Still Life's kapok substrate tag retains the valid 1.21.1 blocks and makes Pale Moss optional. Both legacy Luminous Overworld boss tags now use the mod's current canonical tag. On the copy, moss matched the kapok tag and a Tree Ent matched both boss tags.
- Three obsolete block loot resources targeted unregistered blocks. Registry probes confirmed all three IDs were absent. The two self-drop tables are gated on their registered items, and the Ecologics table for the absent layer is disabled for the pinned pack. The orphaned Dungeons and Taverns wandering-trader advancement is disabled. Its reward was already unreachable, and the repair keeps the existing scope for trade behavior.
- Blueprint 8.2.0 ships an example dimension entry as data. NeoForge reports it even when a higher-priority data map has empty replacement values. The Moonlight global datapack filters the exact upstream example resource instead. It is enabled in both stopped prepared worlds. Keep the filter paired with the current Blueprint version, and remove it when the upstream example is removed or a real biome-size data map is needed.
- The copied build cold-started with six remaining third-party dedicated-server class-loading errors, down from 24 in the original baseline. These are two client mixin targets in TealLib and No Man's Land and four Rhino reflection errors from Epic Fight's own KubeJS integration. The checked release listings did not show a newer compatible version of those mods. The copied server completed startup with them. The signed-in Prism check is needed to validate player-facing behavior, including crafting and restored progress.

References include [NeoForge load conditions](https://docs.neoforged.net/docs/1.21.1/resources/server/conditions/), [NeoForge tag handling](https://docs.neoforged.net/docs/1.21.1/resources/server/tags/) and [Blueprint's example data map issue](https://github.com/team-abnormals/blueprint/issues/349).

The updated migrated-player rehearsal cold-started in 14 seconds. Final preflight verified 1,521 packwiz entries, 228 shared JARs and the six remaining startup errors against the 24-error baseline. Reloading the whole modpack emits additional errors from third-party runtime hooks. The Exposure configuration contained only valid dye names. Cold starts are the verification path for this release.

### Seed-specific Meeting Point cache trial

The game located this seed's natural Meeting Point at `-24, -1704`. A saved Overworld region confirmed a real `nomansland:meeting_point` start at chunk `-2, -107`. On a separate copy, No Man's Land's own override persisted that same site and returned it after restart. The fixed corridor reached 51 chunks after 121 seconds with the override and after 170 seconds in the unpinned tuned run. The cache run still showed an early slowdown, was stopped after a prefix of the corridor, and ran with different concurrent server workloads. No seed-specific override is included in the staged launch world.
