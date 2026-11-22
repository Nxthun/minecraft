
let nxLootParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')
const nxBlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const nxRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const nxResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const nxTagKey = Java.loadClass('net.minecraft.tags.TagKey')
const nxExplorationMap = Java.loadClass('net.minecraft.world.level.storage.loot.functions.ExplorationMapFunction')
const nxContainer = Java.loadClass('net.minecraft.world.level.block.entity.RandomizableContainerBlockEntity')
const nxBuiltIn = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const nxDecoratedPot = Java.loadClass('net.minecraft.world.level.block.entity.DecoratedPotBlockEntity')

// One profile per structure and container role. Shared vanilla tables are only
// replaced inside the specific structure piece that supplies that profile.
const nxProfiles = [
  {
    structure: 'graveyard:ruins', tier: 0,
    tables: ['graveyard:chests/bone_loot', 'graveyard:chests/flesh_loot', 'graveyard:chests/medium_loot', 'graveyard:chests/small_loot'],
    main: ['nxterra:gloom_spore', 'nxterra:hollowl_pod', 'minecraft:amethyst_shard|3'],
    support: ['minecraft:baked_potato|2', 'minecraft:torch|4', 'minecraft:arrow|3', 'minecraft:iron_ingot']
  },
  {
    structure: 'nova_structures:creeping_crypt', tier: 2, completion: true, moon: true, map: 'epic', book: 'smite',
    tables: ['nova_structures:chests/creeping_crypt/crypt_grave'],
    main: ['nxterra:moonpetal_petals|3', 'nxterra:hollowl_pod', 'minecraft:amethyst_shard|5'],
    support: ['minecraft:bread|3', 'minecraft:spectral_arrow|4', 'minecraft:iron_ingot|2', 'minecraft:gold_ingot']
  },
  {
    structure: 'nova_structures:creeping_crypt', tier: 2, book: 'smite',
    tables: ['nova_structures:chests/creeping_crypt/crypt_hallway', 'nova_structures:pots/pot_creeping_crypt'],
    main: ['nxterra:moonpetal_petals|2', 'minecraft:amethyst_shard|4', 'minecraft:spectral_arrow|6'],
    support: ['minecraft:baked_potato|2', 'minecraft:torch|4', 'minecraft:gold_ingot', 'minecraft:iron_ingot|2']
  },
  {
    structure: 'nova_structures:undead_crypt', tier: 2, completion: true, moon: true, map: 'epic', book: 'smite',
    tables: ['nova_structures:chests/undead_crypts_grave'],
    main: ['nxterra:moonpetal_petals|2', 'nxterra:lumoth_pod', 'minecraft:amethyst_shard|5'],
    support: ['minecraft:cooked_chicken|2', 'minecraft:spectral_arrow|4', 'minecraft:gold_ingot|2', 'minecraft:iron_ingot']
  },
  {
    structure: 'nova_structures:stray_fort', tier: 2, completion: true, map: 'epic', book: 'power',
    tables: ['nova_structures:chests/stray_fort_tresure'],
    main: ['nxterra:moonpetal_petals|2', 'minecraft:spectral_arrow|10', 'minecraft:diamond', 'create:brass_ingot|2'],
    support: ['minecraft:cooked_mutton|3', 'minecraft:arrow|5', 'minecraft:iron_ingot|3', 'minecraft:bread|2']
  },
  {
    structure: 'nova_structures:stray_fort', tier: 2,
    tables: ['nova_structures:chests/stray_fort_archer', 'nova_structures:chests/stray_fort_loot_generic', 'nova_structures:pots/pot_stray_fort'],
    main: ['minecraft:arrow|10', 'minecraft:iron_ingot|3', 'nxterra:moonpetal_petals'],
    support: ['minecraft:cooked_mutton|2', 'minecraft:torch|5', 'minecraft:bread|3', 'minecraft:copper_ingot|2']
  },
  {
    structure: 'nova_structures:conduit_ruin', tier: 2, completion: true, map: 'epic', book: 'respiration',
    tables: ['nova_structures:chests/conduit_ruin/conduit_ruin_main', 'nova_structures:chests/conduit_ruin/conduit_ruin_big'],
    main: ['nxterra:pondhopper_seed', 'minecraft:nautilus_shell', 'minecraft:prismarine_crystals|4'],
    support: ['minecraft:cooked_cod|3', 'minecraft:iron_ingot|2', 'minecraft:gold_ingot', 'minecraft:prismarine_shard|3']
  },
  {
    structure: 'bosses_of_mass_destruction:lich_tower', tier: 3, completion: true, book: 'protection',
    tables: ['bosses_of_mass_destruction:chests/lich_tower'],
    main: ['nxterra:elderheart_petals|2', 'minecraft:amethyst_shard|7', 'minecraft:diamond'],
    support: ['minecraft:cooked_beef|3', 'minecraft:spectral_arrow|6', 'minecraft:iron_ingot|3', 'minecraft:gold_ingot|2']
  },
  {
    structure: 'explorify:campsite', tier: 0,
    tables: ['minecraft:chests/village/village_taiga_house'],
    main: ['nxterra:bloom_petals|2', 'nxterra:acornling_pod', 'minecraft:cooked_beef|3'],
    support: ['minecraft:bread|2', 'minecraft:torch|4', 'minecraft:arrow|4', 'minecraft:copper_ingot|2']
  },
  {
    structure: 'explorify:supply_cache/birch', tier: 0,
    tables: ['explorify:chest/supply_cache'],
    main: ['nxterra:mossling_pod', 'nxterra:bloom_petals|2', 'minecraft:copper_ingot|4'],
    support: ['minecraft:cooked_salmon|2', 'minecraft:leather|2', 'minecraft:iron_ingot', 'minecraft:torch|4']
  },
  {
    structure: 'explorify:ruins', tier: 0,
    tables: ['minecraft:chests/jungle_temple', 'minecraft:chests/simple_dungeon'],
    main: ['nxterra:bloom_petals|3', 'nxterra:mossling_pod', 'minecraft:iron_ingot|2'],
    support: ['minecraft:baked_potato|3', 'minecraft:copper_ingot|2', 'minecraft:torch|4', 'minecraft:arrow|3']
  },
  {
    structure: 'nova_structures:skeleton_camp_crimson', tier: 0,
    tables: ['nova_structures:chests/nether_skeleton_tower/skeleton_tower_camp'],
    main: ['nxterra:emberkit_pod', 'nxterra:cindernewt_pod', 'minecraft:gold_ingot|2'],
    support: ['minecraft:cooked_porkchop|2', 'minecraft:arrow|4', 'minecraft:gold_nugget|6', 'minecraft:quartz|3']
  },
  {
    structure: 'explorify:watchtower/plains', tier: 1, completion: true, map: 'rare', book: 'power',
    tables: ['minecraft:chests/village/village_plains_house'],
    main: ['nxterra:dice_cup', 'nxterra:bloom_dice', 'minecraft:arrow|10'],
    support: ['minecraft:cooked_chicken|2', 'minecraft:iron_ingot|2', 'minecraft:torch|5', 'minecraft:bread|3']
  },
  {
    structure: 'explorify:mangrove_hut', tier: 1, completion: true, book: 'respiration',
    tables: ['minecraft:chests/village/village_fisher', 'minecraft:chests/village/village_tannery', 'minecraft:chests/village/village_taiga_house'],
    main: ['nxterra:dewdrop_ring', 'nxterra:bloom_dice', 'nxterra:collection_book'],
    support: ['minecraft:cooked_cod|3', 'minecraft:gold_nugget|6', 'minecraft:iron_ingot', 'minecraft:arrow|4']
  },
  {
    structure: 'explorify:dark_forest_settlement', tier: 1, completion: true, map: 'rare',
    tables: ['explorify:chest/dark_forest_settlement'],
    main: ['nxterra:four_leaf_charm', 'nxterra:collection_book', 'nxterra:bloom_dice'],
    support: ['minecraft:bread|3', 'minecraft:leather|2', 'minecraft:iron_ingot|2', 'minecraft:arrow|4']
  },
  {
    structure: 'betterdungeons:small_dungeon', tier: 1, completion: true, book: 'unbreaking',
    tables: ['minecraft:chests/simple_dungeon', 'betterdungeons:chests/small_dungeon'],
    main: ['nxterra:bloom_dice', 'nxterra:four_leaf_charm', 'create:andesite_alloy|2', 'create:zinc_ingot|3'],
    support: ['minecraft:cooked_beef|2', 'minecraft:arrow|5', 'minecraft:iron_ingot|2', 'minecraft:torch|4']
  },
  {
    structure: 'graveyard:crypt', tier: 2, completion: true, moon: true, map: 'epic', book: 'smite',
    tables: ['graveyard:chests/great_crypt_loot'],
    main: ['nxterra:moonpetal_petals|3', 'nxterra:lumoth_pod', 'nxterra:hollowl_pod', 'minecraft:amethyst_shard|5'],
    support: ['minecraft:baked_potato|3', 'minecraft:spectral_arrow|4', 'minecraft:gold_ingot|2', 'minecraft:iron_ingot|2']
  },
  {
    structure: 'graveyard:crypt', tier: 2, book: 'smite',
    tables: ['graveyard:chests/crypt_loot', 'graveyard:chests/crypt_urn_loot', 'graveyard:chests/brewing_loot',
      'graveyard:chests/misc_loot', 'graveyard:chests/ore_loot'],
    main: ['nxterra:moonpetal_petals|2', 'minecraft:amethyst_shard|4', 'minecraft:spectral_arrow|6'],
    support: ['minecraft:baked_potato|2', 'minecraft:torch|5', 'minecraft:gold_ingot', 'minecraft:iron_ingot|2']
  },
  {
    structure: 'nova_structures:illager_hideout', tier: 2, completion: true, map: 'epic', book: 'power',
    tables: ['nova_structures:chests/illager_hideout_heart_loot'],
    gear: ['nxterra:pollen_rapier'],
    main: ['create:brass_ingot|2', 'minecraft:diamond', 'minecraft:emerald|3'],
    support: ['minecraft:cooked_beef|3', 'minecraft:arrow|6', 'minecraft:iron_ingot|3', 'minecraft:bread|2']
  },
  {
    structure: 'nova_structures:illager_hideout', tier: 2, book: 'power',
    tables: ['nova_structures:chests/illager_hideout_brewing', 'nova_structures:chests/illager_hideout_library',
      'nova_structures:chests/illager_hideout_meat', 'nova_structures:chests/illager_hideout_trash',
      'nova_structures:chests/illager_hideout_tresure', 'nova_structures:chests/illager_hideout_utility',
      'nova_structures:chests/illager_hideout_weaponry', 'nova_structures:chests/illager_hideout_vegitarian'],
    main: ['minecraft:arrow|12', 'minecraft:iron_ingot|4', 'minecraft:emerald|2'],
    support: ['minecraft:cooked_beef|2', 'minecraft:torch|5', 'minecraft:bread|3', 'minecraft:copper_ingot|2']
  },
  {
    structure: 'repurposed_structures:temple_taiga', tier: 2, completion: true, map: 'epic', book: 'efficiency',
    tables: ['repurposed_structures:chests/temples/taiga'],
    gear: ['nxterra:bramble_cleaver', 'nxterra:mossstep_boots'],
    main: ['nxterra:bramblebuck_seed', 'nxterra:bloom_petals|4'],
    support: ['minecraft:cooked_salmon|3', 'minecraft:torch|5', 'minecraft:iron_ingot|2', 'minecraft:gold_ingot|2']
  },
  {
    structure: 'incendium:sanctum', tier: 2, completion: true, book: 'fire_protection',
    tables: ['incendium:sanctum/coffin'],
    main: ['nxterra:cinderback_seed', 'nxterra:emberkit_pod', 'minecraft:potion[minecraft:potion_contents={potion:"minecraft:fire_resistance"}]'],
    support: ['minecraft:cooked_porkchop|3', 'minecraft:gold_ingot|2', 'minecraft:arrow|5', 'minecraft:quartz|4']
  },
  {
    structure: 'incendium:sanctum', tier: 2, book: 'fire_protection',
    tables: ['incendium:sanctum/brewery', 'incendium:sanctum/common_loot', 'incendium:sanctum/lower_loot',
      'incendium:sanctum/junk_loot'],
    main: ['nxterra:cindernewt_pod', 'minecraft:gold_ingot|3', 'minecraft:potion[minecraft:potion_contents={potion:"minecraft:fire_resistance"}]'],
    support: ['minecraft:cooked_porkchop|2', 'minecraft:gold_nugget|6', 'minecraft:arrow|4', 'minecraft:quartz|3']
  },
  {
    structure: 'castleshift:castle', tier: 3, completion: true, book: 'protection',
    tables: ['castleshift:castle/barrel'],
    main: ['nxterra:elderheart_petals|2', 'minecraft:diamond', 'minecraft:amethyst_shard|6'],
    support: ['minecraft:cooked_beef|3', 'minecraft:spectral_arrow|5', 'minecraft:iron_ingot|3', 'minecraft:gold_ingot|2']
  },
  {
    structure: 'minecraft:ancient_city', tier: 3, completion: true, book: 'protection',
    tables: ['minecraft:chests/ancient_city'],
    main: ['nxterra:elderheart_petals|2', 'minecraft:echo_shard', 'minecraft:diamond', 'minecraft:amethyst_shard|6'],
    support: ['minecraft:cooked_salmon|3', 'minecraft:spectral_arrow|4', 'minecraft:gold_ingot|2', 'minecraft:iron_ingot|3']
  }
]

let nxProfilesByTable = {}
nxProfiles.forEach(profile => {
  profile.tables.forEach(table => {
    if (!nxProfilesByTable[table]) nxProfilesByTable[table] = []
    nxProfilesByTable[table].push(profile)
  })
})

let nxGoldenOdds = [[0, 0, 0, 0], [0.05, 0.07, 0.09, 0.10], [0.08, 0.10, 0.12, 0.15], [0, 0, 0, 0]]
const nxElderheartOdds = [0.01, 0.015, 0.02, 0.03]
const nxBonusOdds = [0, 0.20, 0.35, 0.50]
const nxBookCaps = { respiration: 3, unbreaking: 3 }
const nxBookLevels = [[0, 0, 0, 0], [1, 1, 2, 2], [2, 2, 3, 4], [2, 3, 4, 4]]

function nxDistanceBand(overworld, x, z, spawnX, spawnZ) {
  if (!overworld) return 0
  let dx = x - spawnX
  let dz = z - spawnZ
  let distanceSquared = dx * dx + dz * dz
  if (distanceSquared >= 64000000) return 3
  if (distanceSquared >= 16000000) return 2
  return distanceSquared >= 2250000 ? 1 : 0
}

function nxStack(spec) {
  let parts = spec.split('|')
  return Item.of(parts[0], parts.length > 1 ? Number(parts[1]) : 1)
}

function nxExplorerMap(context, tier) {
  let target = nxTagKey.create(nxRegistries.STRUCTURE, nxResourceLocation.parse('nxterra:map_' + tier))
  let map = nxExplorationMap.makeExplorationMap().setDestination(target)
    .setSearchRadius(24).setSkipKnownStructures(false).build().apply(Item.of('minecraft:map'), context)
  return String(nxBuiltIn.ITEM.getKey(map.getItem())) === 'minecraft:filled_map' ? map : null
}

function nxMainReward(profile, band, random, makeMap) {
  let completionRoll = profile.completion ? random.nextDouble() : 1
  let goldenOdds = nxGoldenOdds[profile.tier][band]
  if (completionRoll < goldenOdds) return nxStack('nxterra:golden_bloom_dice')
  if (profile.tier === 3 && completionRoll < nxElderheartOdds[band]) return nxStack('nxterra:elderheart_dice')
  if (profile.moon && completionRoll < goldenOdds + 0.025) return nxStack('nxterra:moonpetal_dice')
  if (profile.gear && random.nextDouble() < 0.08) return nxStack(profile.gear[random.nextInt(profile.gear.length)])
  if (profile.map && random.nextDouble() < 0.10) {
    let map = makeMap(profile.map)
    if (map) return map
  }
  if (profile.book && random.nextDouble() < 0.18) {
    let level = Math.min(nxBookLevels[profile.tier][band], nxBookCaps[profile.book] || 5)
    return nxStack('minecraft:enchanted_book[minecraft:stored_enchantments={levels:{"minecraft:' + profile.book + '":' + level + '}}]')
  }
  return nxStack(profile.main[random.nextInt(profile.main.length)])
}

function nxRollContainer(profile, band, random, makeMap) {
  let rewards = [nxMainReward(profile, band, random, makeMap)]
  let support = profile.support.slice()
  let supportCount = 2 + random.nextInt(3)
  for (let i = 0; i < supportCount; i++) {
    rewards.push(nxStack(support.splice(random.nextInt(support.length), 1)[0]))
  }
  if (random.nextDouble() < nxBonusOdds[band]) {
    let materials = ['minecraft:iron_ingot|2', 'minecraft:gold_ingot|2', 'minecraft:amethyst_shard|4', 'nxterra:elderheart_petals|2']
    rewards.push(nxStack(materials[profile.tier]))
  }
  return rewards
}

function nxFindProfile(level, pos, profiles) {
  let blockEntity = level.getBlockEntity(pos)
  if (!blockEntity) return null
  let type = nxBuiltIn.BLOCK_ENTITY_TYPE.getKey(blockEntity.getType())
  // Lootr substitutes its own block entities when a generated container opens.
  if (!(blockEntity instanceof nxContainer) && !(blockEntity instanceof nxDecoratedPot) && (!type || String(type.getNamespace()) !== 'lootr')) return null

  let registry = level.registryAccess().registryOrThrow(nxRegistries.STRUCTURE)
  for (let index = 0; index < profiles.length; index++) {
    let profile = profiles[index]
    let structure = registry.get(nxResourceLocation.parse(profile.structure))
    if (structure && level.structureManager()["getStructureWithPieceAt(net.minecraft.core.BlockPos,net.minecraft.world.level.levelgen.structure.Structure)"](pos, structure).isValid()) return profile
  }
  return null
}

LootJS.modifiers(event => {
  event.addTableModifier(Object.keys(nxProfilesByTable)).customAction((context, loot) => {
    let profiles = nxProfilesByTable[String(context.getQueriedLootTableId())]
    let origin = context.getParamOrNull(nxLootParams.ORIGIN)
    if (!profiles || !origin) return
    let level = context.getLevel()
    let pos = nxBlockPos.containing(origin)
    let profile = nxFindProfile(level, pos, profiles)
    if (!profile) return
    let overworld = String(level.dimension) === 'minecraft:overworld'
    let spawn = level.getSharedSpawnPos()
    let band = nxDistanceBand(overworld, pos.getX(), pos.getZ(), spawn.getX(), spawn.getZ())
    let rewards = nxRollContainer(profile, band, context.getRandom(), tier => overworld ? nxExplorerMap(context, tier) : null)

    // Keep the original table if a configured item or component failed to resolve.
    if (rewards.some(stack => stack.isEmpty())) return
    loot.clear()
    rewards.forEach(stack => loot.addItem(stack))
  })
})
