# NxTerra worldgen proposal for approval

Audit baseline: published pack commit `8518846`, archived main server build, and vanilla Minecraft 1.21.1. Worktree: `worldgen/nxterra`. The rates below are proposals for the first copied-server trial.

## Loot tiers

Count each distinct structure start once. Density targets are total starts in each listed adventure tier per square kilometre of generated Overworld, averaged across test seeds. Count settlements, village outposts that are outside the selected adventure tiers, and fixed progression structures separately.

| Tier | Structures | Target per km² | Base chest pool |
| --- | --- | ---: | --- |
| Common | Small ruins, camps, roadside shelters and small wrecks | 0.60–1.20 | Food, torches, basic materials, arrows and small amounts of copper or iron |
| Uncommon | Towers, small dungeons and selected ruins with encounters | 0.25–0.50 | Iron or utility supplies, Create andesite alloy or zinc, modest emeralds, low-level enchantments |
| Rare | Large dungeons, biome temples, jungle fortress and large hostile hideouts | 0.12–0.25 | Create brass components, limited diamonds or repair supplies, measured chances of mid-game Arsenal materials |
| Epic | Large castles, major city complexes and existing high-risk boss sites | 0.04–0.09 | Completion chests with scarce Arsenal crafting materials and a high-value roll. Ice and Fire and Cataclysm boss ingredients stay on their existing gated paths. |

The target for Rare and Epic together is 0.16–0.34 starts/km², about one start per 3–6 km² on average. After recording the baseline on several seeds, aim for 30–50% more large adventure starts per square kilometre across those same seeds. Revisit the absolute bands if both targets cannot be met. Use the lower end for castles near village-heavy areas, and keep new hostile epic sites at least 1,500 Overworld blocks from spawn. Keep existing stronghold, portal and boss access requirements.

| Chest distance from Overworld spawn | Bonus on top of its structure tier |
| --- | --- |
| Under 1,500 blocks | Base pool only |
| 1,500–3,999 blocks | One roll at 20% for extra supplies or tier-appropriate crafting materials |
| 4,000–7,999 blocks | One roll at 35%, with a better materials pool for Rare and Epic chests |
| 8,000+ blocks | One roll at 50%, with the strongest bonus restricted to Rare and Epic completion chests |

Use the chest's horizontal distance from the world's spawn. Apply these bands to the Overworld. Keep dimension-specific chest loot on its own progression rules. Leave the welcome camp at starter strength and keep Lootr's per-player rolls. Distance improves the secondary pool within the base tier. It does not grant late-game equipment through small ruins or turn boss rewards into chest drops. Leave keys, vault requirements, and fixed progression items alone. Use explicitly identified chest tables or structure-aware routing before changing tables shared by multiple structures.

## Approved structure-container pools

Apply both additions to loot in chests, barrels, and other loot-bearing containers placed by structures, including shulkers and non-archaeological pots where the structure uses them. Keep mob drops, fishing, trades, archaeology, quests, recipes, and Dice roll rewards outside this change. Preserve progression keys and functional trap inventories.

Use one guaranteed key reward in each revised ordinary loot container, plus two to four small themed support stacks. Replace filler slots with food, ammo, ingots, potions or repair supplies. Add at most one distance bonus. Use the approved Overworld bonus chances of 0%, 20%, 35%, and 50% by distance. In a dedicated completion container, the base pool can include strong items for its tier. A Golden Bloom Dice, map, or enchanted book can occupy an eligible key-reward slot. The support stacks come from a separate structure-specific pool. Keep Lootr's per-player state and check the odds with and without extra Luck, which should leave the new fixed probabilities unchanged.

| Tier | Dice placements | Examples of distinct guaranteed pools |
| --- | --- | --- |
| Common | Bloom Petals and one themed creature Pod. Forest and grove caches favor Mossling and Acornling. Fire caches favor Cindernewt or Emberkit. Place one Collection Book in the guaranteed Welcome Camp chest at spawn. | Welcome Camp keeps its starter supplies and existing Bloom Dice. An Explorify campsite offers food, torches, or Bloom Petals. A birch supply cache offers copper, repair supplies, or a Mossling Pod. A Nether camp offers fire-resistance supplies, hardy food, or an Emberkit Pod. |
| Uncommon | Bloom Dice, Dice Cup, Collection Book, Four-Leaf Charm, and Dewdrop Ring. Put Cups in watchtower supply chests, Charms in woodland caches, and Rings in damp or riverside containers. | An Explorify watchtower offers arrows, iron, a Dice Cup, or a scout map. A small dungeon offers repair materials, modest Create andesite alloy or zinc, Bloom Dice, or a curated book. |
| Rare | Moonpetal Petals and occasional Moonpetal Dice in moon-themed completion chests. Match Saddle Seeds to biomes. Put Bramble Cleavers, Pollen Rapiers, and Mossstep Boots in selected Rare completion chests. Use individual drops with low weights and one featured completion container per structure start. | A Graveyard crypt offers amethyst, Moonpetal Petals, or a moon-themed reward. An Illager Hideout offers arrows, iron or brass components, and a tactical book. A forest temple offers a Bramblebuck Saddle Seed or one piece of Dice gear. Incendium's Sanctum favors fire-resistance supplies, Ember/Cinder Pods, or a Cinderback Saddle Seed. |
| Epic | Elderheart Petals and occasional Elderheart Dice in castle or major-city completion chests. Elderheart Dice is the Epic chase, at 1.0%, 1.5%, 2.0% or 3.0% by distance on eligible completion rolls. | Castle Shift's keep can offer Elderheart materials, a scarce Arsenal crafting ingredient, or a curated defensive book. A major city can emphasize salvage materials and a different Elderheart weighting. Preserve boss drops, vault keys and loot progression. |

Use structure and container roles for routing. Explorify's campsite and watchtower currently reuse village tables, so use structure-specific routing rather than globally replacing their shared table IDs. Forest and grove rewards favor Bloom and Moss items. Moon-themed ruins and crypts favor Moonpetal Petals and, at Rare completion, Moonpetal Dice. Nether and fire sites use the installed Cindernewt and Emberkit Pods and Rare Cinderback Saddle Seeds. Use the site's tier for dimension-specific loot and apply Overworld distance rules only in the Overworld.

The Welcome Camp already ships three Bloom Dice and an FTB Quests book. Add one Dice Collection Book there as the requested starter exception. The shipped Dice 2.3.1 chain includes Bloom, Golden Bloom, Moonpetal, Starbloom and Elderheart. Three Golden Bloom Dice with four amethyst shards and an Eye of Ender craft one Moonpetal. Three Moonpetal and one Nether Star craft one Starbloom. The custom 20-petal recipe creates the matching tier, including Elderheart. Starbloom stays on its crafting path for this trial. Golden Bloom appears in existing quests and gets a new exploration path through the table below.

### Golden Bloom completion rates

| Tier | Under 1,500 | 1,500–3,999 | 4,000–7,999 | 8,000+ |
| --- | ---: | ---: | ---: | ---: |
| Uncommon | 5% | 7% | 9% | 10% |
| Rare | 8% | 10% | 12% | 15% |

These are probabilities per eligible completion roll. Three drops average 20 to 60 such rolls at the ends of that range. The rates are independent of the distance bonus and extra Luck. Non-Overworld tiers use the first column. A direct Moonpetal remains a 2.5% alternative in eligible Rare moon-themed completion rolls.

### Explorer maps

Put occasional maps in selected Uncommon scout chests leading to a Rare dungeon or temple, and in selected Rare completion chests leading to an Epic castle or major city. The destination must be in the chest's dimension. Offer maps as meaningful main-roll alternatives even in the first distance band. Use structure tags backed by installed targets, a bounded search, and a tier-appropriate item fallback when the map cannot resolve. Map rolls leave locked or gated progression routes intact. Check first-open cost on the server copy.

### Curated enchanted books

Use books only in structures where the enchantments fit the cache. Dark crypts can carry Smite or Protection, watchtowers Power, workshops Efficiency, and fire sites Fire Protection. Use vanilla level caps. The table gives the trial level targets for the four Overworld bands. Other dimensions use the base tier level.

| Tier | Under 1,500 | 1,500–3,999 | 4,000–7,999 | 8,000+ |
| --- | --- | --- | --- | --- |
| Common | Supplies and Dice materials | Same tier | Same tier | Same tier |
| Uncommon | I | I | II | II |
| Rare | II | II | III | IV |
| Epic | II | III | IV | IV |

Keep early Create loot to bulk ingredients or low-stage parts. Reserve modest brass for Rare. Epic completion can yield scarce crafting materials, with finished endgame gear and Ice and Fire boss ingredients staying on their existing progression paths.

### Copied-server checks

Check that every revised ordinary container yields a useful item across sampled rolls, every themed structure has its own reward pool, and both Lootr players get independent results. Test 1,499/1,500, 3,999/4,000, and 7,999/8,000, including zero Golden Bloom results outside eligible Uncommon and Rare completion containers and zero Elderheart Dice outside Epic completion containers. Confirm the Welcome Camp book, map destinations and fallback, expected book levels, and untouched out-of-scope loot.

## Mod list

| Proposed addition | Phase-one scope |
| --- | --- |
| Castle Shift 0.3.0, LGPL-3.0-only | Use its four-floor castle as the primary new landmark. Exempt the set from the global density multiplier. Restrict placements to suitable foothills and flatter biomes, keep the village exclusion, and sample mountain borders. Its shipped set is 32/8 with a 10-chunk village exclusion, while the shipped biome list includes stony peaks. Start the trial at 72/24 with a 0.35 placement frequency, plus the spawn buffer and footprint check. |
| Repurposed Structures 7.5.22 for NeoForge 1.21.1, LGPL-3.0-only | Allowlist land ruins, badlands and snowy pyramids, taiga temples, and jungle fortresses. Keep its village, mineshaft, stronghold, and other overlapping sets disabled for this trial. |
| LootJS 3.7.0 for NeoForge 1.21.1, LGPL-3.0-only | Approve as a server-side candidate to implement the chest-distance rolls. The archive's KubeJS build 381 and NeoForge 21.1.266 satisfy the declared minimums. Keep it in the build only if two test players get independent Lootr rolls at the expected distance tier. |

The first trial keeps Lithosphere 1.9, its two KubeJS density overrides, and the existing biome stack. Tune biome tags, terrain adaptation and footprint checks in individual structures. Tectonic supplies an Overworld noise override that would compete with the current pack's Lithosphere and Still Life resources. When Dungeons Arise 2.1.68, 2.1.67 and 2.1.64 declare a required Minecraft range of `[1.21,1.21.1)` in their NeoForge metadata. Integrated Dungeons and Structures would add Quark and Integrated API to the existing pack, with Zeta a declared Quark dependency, so it is outside this shortlist.

Hands-On Vanilla 1.2.0 stays. Its installed config exposes a crafting-table on/off switch. Plan to verify a client-side shortcut that opens the ordinary crafting screen for EMI while normal interaction keeps the in-world table. See whether the existing client hook can do it before adding a companion mod.

## Approval and verification

The owner approved the original tiers, distance bands, three mod candidates and revised container pools, with Golden Bloom and support-stack changes recorded above. The additional candidate audit and the distribution comparison are linked in the trial report. After approval, use a separate folder and port for the Altair copy. First record its active registry and compare the same seeds and radius with the revised build, sampling outer distance bands separately. Spot-check mountains, Lootr rolls, EMI transfer, tick time and memory, and player migration. Present seed candidates before launch. The live-world switch, push, and publish each require owner approval.

## Sources

- [Castle Shift author page](https://modrinth.com/mod/castle-shift)
- [Repurposed Structures release](https://modrinth.com/mod/repurposed-structures-forge/version/8duZuWci)
- [NeoForge 1.21.1 exploration map and enchantment functions](https://docs.neoforged.net/docs/1.21.1/resources/server/loottables/lootfunctions/)
- [LootJS release](https://modrinth.com/mod/lootjs/version/5AZDyUSn) and [chest-position context](https://docs.almostreliable.com/lootjs/api/loot-context.html)
- [Lithosphere compatibility](https://modrinth.com/datapack/lithosphere) and [Tectonic compatibility](https://modrinth.com/project/tectonic)
- [When Dungeons Arise listing](https://modrinth.com/mod/when-dungeons-arise/version/XIRJSFQ0) and [Integrated Dungeons and Structures dependency list](https://modrinth.com/mod/idas)
- [Hands-On Vanilla config source](https://github.com/Pocky-l/handson-vanilla/blob/main/common/src/main/java/com/pockyl/handson_vanilla/client/VanillaConfig.java)
