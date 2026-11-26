// Loot

// Scorched Guns blueprint helpers
const $SGLootContextParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')
const $SGBlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const $SGStructureTags = Java.loadClass('net.minecraft.tags.StructureTags')
const $SGRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const $SGResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')

const sgFindStructure = (ctx, structureId, tag) => {
  try {
    var origin = ctx.getParamOrNull($SGLootContextParams.ORIGIN)
    if (origin == null) return null
    var level = ctx.getLevel()
    var pos = $SGBlockPos.containing(origin)
    let start
    if (tag) {
      start = level.structureManager().getStructureWithPieceAt(pos, tag)
    } else {
      var structure = level.registryAccess().registryOrThrow($SGRegistries.STRUCTURE).get($SGResourceLocation.parse(structureId))
      if (structure == null) return null
      start = level.structureManager().getStructureWithPieceAt(pos, structure)
    }
    return (start != null && start.isValid()) ? start : null
  } catch (e) {
    console.warn('[scguns_loot] structure lookup failed: ' + structureId + ': ' + e)
    return null
  }
}
const sgDim = (ctx) => {
  const d = ctx.getLevel().dimension
  return String(d && d.location ? d.location() : d)
}
const sgStructureKey = (ctx, start) => {
  const cp = start.getChunkPos()
  return sgDim(ctx) + '|' + cp.x + ',' + cp.z
}
const sgMarkOnce = (ctx, storeName, key) => {
  const data = ctx.getLevel().getServer().persistentData
  const store = data.getCompound(storeName)
  if (store.getBoolean(key)) return false
  store.putBoolean(key, true)
  data.put(storeName, store)
  return true
}
const sgChance = (ctx, c) => ctx.getRandom().nextFloat() < c
const sgGive = (loot, id) => loot.addItem(Item.of('scguns:' + id))

LootJS.modifiers((event) => {

  // 1. Coin tiers

  // Ancient City - monety NIE wypadają w żadnej skrzyni z tych tabel
  const ancientCityPrefixes = [
    "minecraft:chests/ancient_city",
    "ancient_cities:",
    "nova_structures:chests/ancient_city"
  ]

  const trialChambers = [
    "minecraft:chests/trial_chambers/corridor",
    "minecraft:chests/trial_chambers/entrance",
    "minecraft:chests/trial_chambers/intersection",
    "minecraft:chests/trial_chambers/intersection_barrel"
  ]

  const magicStructures = [
    "minecraft:chests/pillager_outpost",
    "irons_spellbooks:chests/catacombs/coffin_loot",
    "irons_spellbooks:chests/catacombs/dead_king_vault",
    "irons_spellbooks:chests/catacombs/hidden_trough_treasure",
    "irons_spellbooks:chests/citadel/citadel_vault",
    "irons_spellbooks:chests/citadel/rampart_chest",
    "irons_spellbooks:chests/citadel/citadel_bookshelf",
    "revampedvillages:treasure"
  ]

  const hardPrefixes = [
    "minecraft:chests/stronghold",
    "betterfortresses:chests/",
    "dungeons_arise:chests/"
  ]

  const endCityPrefixes = [
    "minecraft:chests/end_city"
  ]

  const mediumPrefixes = [
    "minecraft:chests/bastion",
    "minecraft:chests/shipwreck",
    "irons_spellbooks:chests/",
    "eternal_starlight:chests/",
    "mns:",
    "formationsnether:",
    "repurposed_structures:chests/",
    "adventuredungeons:chests/"
  ]

  const basicPrefixes = [
    "minecraft:chests/",
    "revampedvillages:",
    "mvs:"
  ]

  const exactTables = trialChambers.concat(magicStructures).map(p => p + "$")

  const tierRegex = (include, exclude) =>
    new RegExp("^(?!(?:" + exclude.join("|") + "))(?:" + include.join("|") + ").*")

  // 2. Coins

  event.addTableModifier(tierRegex(basicPrefixes, hardPrefixes.concat(endCityPrefixes, mediumPrefixes, exactTables, ancientCityPrefixes)))
       .addLoot(LootEntry.of("magic_coins:silver_coin").setCount(1).randomChance(0.02))
       .addLoot(LootEntry.of("magic_coins:gold_coin").setCount(1).randomChance(0.004))

  event.addTableModifier(tierRegex(mediumPrefixes, hardPrefixes.concat(endCityPrefixes, exactTables, ancientCityPrefixes)))
       .addLoot(LootEntry.of("magic_coins:silver_coin").setCount(1).randomChance(0.04))
       .addLoot(LootEntry.of("magic_coins:gold_coin").setCount(1).randomChance(0.01))

  event.addTableModifier(tierRegex(hardPrefixes, endCityPrefixes.concat(exactTables, ancientCityPrefixes)))
       .addLoot(LootEntry.of("magic_coins:gold_coin").setCount(1).randomChance(0.03))

  event.addTableModifier("minecraft:chests/end_city_treasure")
       .addLoot(LootEntry.of("magic_coins:gold_coin").setCount(1).randomChance(0.03))
       .addLoot(LootEntry.of("magic_coins:crystal_coin").setCount(1).randomChance(0.001))

  trialChambers.forEach(path => {
    event.addTableModifier(path)
         .addLoot(LootEntry.of("magic_coins:silver_coin").setCount(1).randomChance(0.02))
         .addLoot(LootEntry.of("magic_coins:gold_coin").setCount(1).randomChance(0.006))
  })

  magicStructures.forEach(path => {
    event.addTableModifier(path)
         .addLoot(LootEntry.of("magic_coins:silver_coin").setCount(1).randomChance(0.03))
         .addLoot(LootEntry.of("magic_coins:gold_coin").setCount(1).randomChance(0.01))
  })

  // 3. Create loot

  event.addTableModifier(/(revampedvillages:.*|minecraft:chests\/(abandoned_mineshaft|desert_pyramid|jungle_temple))/)
       .addLoot(LootEntry.of("create:andesite_alloy").setCount([2, 5]).randomChance(0.35))
       .addLoot(LootEntry.of("create:shaft").setCount([2, 6]).randomChance(0.35))
       .addLoot(LootEntry.of("create:cogwheel").setCount([1, 3]).randomChance(0.25))
       .addLoot(LootEntry.of("create:large_cogwheel").setCount([1, 2]).randomChance(0.20))
       .addLoot(LootEntry.of("create:belt_connector").setCount([1, 3]).randomChance(0.25))
       .addLoot(LootEntry.of("create:windmill_bearing").setCount(1).randomChance(0.08))
       .addLoot(LootEntry.of("create:wrench").setCount(1).randomChance(0.10))

  event.addTableModifier(/(minecraft:chests\/bastion.*|betterfortresses:chests.*|formationsnether:.*)/)
       .addLoot(LootEntry.of("create:brass_ingot").setCount([2, 4]).randomChance(0.30))
       .addLoot(LootEntry.of("create:brass_casing").setCount([1, 2]).randomChance(0.20))
       .addLoot(LootEntry.of("create:mechanical_pump").setCount(1).randomChance(0.15))
       .addLoot(LootEntry.of("create:fluid_pipe").setCount([2, 5]).randomChance(0.25))
       .addLoot(LootEntry.of("create:blaze_burner").setCount(1).randomChance(0.12))

  event.addTableModifier(/(dungeons_arise:chests\/.*|adventuredungeons:chests\/.*|repurposed_structures:chests\/.*|minecraft:chests\/end_city_treasure)/)
       .addLoot(LootEntry.of("create:zinc_ingot").setCount([2, 5]).randomChance(0.25))
       .addLoot(LootEntry.of("create:gearbox").setCount([1, 2]).randomChance(0.18))
       .addLoot(LootEntry.of("create:electron_tube").setCount([1, 3]).randomChance(0.15))
       .addLoot(LootEntry.of("create:precision_mechanism").setCount(1).randomChance(0.08))
       .addLoot(LootEntry.of("create:attribute_filter").setCount(1).randomChance(0.12))
       .addLoot(LootEntry.of("create:display_board").setCount([1, 2]).randomChance(0.15))

  // 4. Celestisynth chest loot removal

  const celestisynthInjectedTables = [
    "minecraft:chests/nether_bridge",
    "minecraft:chests/ruined_portal",
    "minecraft:chests/bastion_bridge",
    "minecraft:chests/bastion_hoglin_stable",
    "minecraft:chests/bastion_other",
    "minecraft:chests/bastion_treasure",
    "minecraft:chests/ancient_city",
    "minecraft:chests/abandoned_mineshaft",
    "betterdungeons:zombie_dungeon/chests/common",
    "betterdungeons:skeleton_dungeon/chests/common",
    "betterdungeons:spider_dungeon/chests/egg_room"
  ]

  celestisynthInjectedTables.forEach(path => {
    event.addTableModifier(path)
         .removeLoot("celestisynth:solar_crystal")
         .removeLoot("celestisynth:lunar_stone")
  })

  // 5. Eyebomination - End Castle

  event.addTableModifier(/nova_structures:chests\/end_castle\/.*/)
       .addLoot(LootEntry.of("celestisynth:eyebomination").setCount(1).randomChance(0.005))

  // 6. Lunar Scrap - Cursed Garden

  event.addTableModifier("eternal_starlight:chests/cursed_garden")
       .addLoot(LootEntry.of("celestisynth:lunar_scrap").setCount(1).randomChance(0.05))

  // 7. Structure drops

  event.addTableModifier("eternal_starlight:chests/golem_forge")
       .addLoot(LootEntry.of("celestisynth:starstruck_scrap").setCount(1).randomChance(0.05))

  event.addTableModifier("cataclysm:chests/frosted_prison_treasure")
       .addLoot(LootEntry.of("celestisynth:wintereis_shard").setCount(1).randomChance(0.05))

  event.addTableModifier(/irons_spellbooks:chests\/mountain_tower\/.*/)
       .addLoot(LootEntry.of("celestisynth:starstruck_feather").setCount(1).randomChance(0.20))

  event.addTableModifier(/block_factorys_bosses:chests\/dragon_tower.*/)
       .addLoot(LootEntry.of("celestisynth:crimson_piece").setCount(1).randomChance(0.08))

  // 8. Other sources removed

  event.addTableModifier("celestisynth:blocks/solar_crystal")
       .removeLoot("celestisynth:solar_crystal")

  event.addTableModifier("celestisynth:blocks/wintereis")
       .removeLoot("celestisynth:wintereis_shard")

  event.addTableModifier("celestisynth:entities/traverser")
       .removeLoot("celestisynth:crimson_piece")

  // 9. Celestisynth armor - Better Fortresses

  event.addTableModifier(/betterfortresses:chests\/.*/)
       .addLoot(LootEntry.of("celestisynth:lunar_stone_helmet").setCount(1).randomChance(0.01))
       .addLoot(LootEntry.of("celestisynth:lunar_stone_chestplate").setCount(1).randomChance(0.01))
       .addLoot(LootEntry.of("celestisynth:lunar_stone_leggings").setCount(1).randomChance(0.01))
       .addLoot(LootEntry.of("celestisynth:lunar_stone_boots").setCount(1).randomChance(0.01))
       .addLoot(LootEntry.of("celestisynth:solar_crystal_helmet").setCount(1).randomChance(0.01))
       .addLoot(LootEntry.of("celestisynth:solar_crystal_chestplate").setCount(1).randomChance(0.01))
       .addLoot(LootEntry.of("celestisynth:solar_crystal_leggings").setCount(1).randomChance(0.01))
       .addLoot(LootEntry.of("celestisynth:solar_crystal_boots").setCount(1).randomChance(0.01))

  // 10. Scorched Guns loot and blueprints

  event.removeGlobalModifiers('@scguns')

  // Safe wrapper
  const sgSafe = (name, fn) => (ctx, loot) => {
    try {
      fn(ctx, loot)
    } catch (e) {
      console.warn('[scguns_loot] ' + name + ' failed: ' + e)
    }
  }

  // Antique
  event.addTableModifier(/^minecraft:chests\/village\/.*/).customAction(sgSafe('antique', (ctx, loot) => {
    if (!sgChance(ctx, 0.05)) return
    var start = sgFindStructure(ctx, 'village', $SGStructureTags.VILLAGE)
    if (start == null) return
    if (sgMarkOnce(ctx, 'antique_blueprint_villages', sgStructureKey(ctx, start))) sgGive(loot, 'antique_blueprint')
  }))

  // Copper
  event.addTableModifier('minecraft:chests/trial_chambers/reward')
    .customAction(sgSafe('copper', (ctx, loot) => { if (sgChance(ctx, 0.10)) sgGive(loot, 'copper_blueprint') }))
  event.addTableModifier('minecraft:chests/trial_chambers/reward_ominous')
    .customAction(sgSafe('copper_ominous', (ctx, loot) => { if (sgChance(ctx, 0.25)) sgGive(loot, 'copper_blueprint') }))

  // Frontier
  event.addTableModifier('minecraft:chests/pillager_outpost').customAction(sgSafe('frontier', (ctx, loot) => {
    var origin = ctx.getParamOrNull($SGLootContextParams.ORIGIN)
    if (origin == null) return
    var start = sgFindStructure(ctx, 'minecraft:pillager_outpost', null)
    var pos = $SGBlockPos.containing(origin)
    var key = start != null ? sgStructureKey(ctx, start)
      : sgDim(ctx) + '|chest|' + pos.x + ',' + pos.y + ',' + pos.z
    if (!sgMarkOnce(ctx, 'frontier_blueprint_outposts', key)) return
    if (sgChance(ctx, 0.07)) sgGive(loot, 'frontier_blueprint')
  }))

  // Iron
  event.addTableModifier(/^betterfortresses:chests\/.*/)
    .customAction(sgSafe('iron_fortress', (ctx, loot) => { if (sgChance(ctx, 0.10)) sgGive(loot, 'iron_blueprint') }))
  event.addTableModifier('minecraft:chests/nether_bridge')
    .customAction(sgSafe('iron_bridge', (ctx, loot) => { if (sgChance(ctx, 0.10)) sgGive(loot, 'iron_blueprint') }))

  // Ocean
  event.addTableModifier(/^minecraft:chests\/(shipwreck_.*|simple_dungeon)$/).customAction(sgSafe('ocean', (ctx, loot) => {
    if (!sgChance(ctx, 0.15)) return
    if (sgFindStructure(ctx, 'cataclysm:sunken_city', null) != null) sgGive(loot, 'ocean_blueprint')
  }))
  event.addTableModifier('cataclysm:entities/the_leviathan')
    .customAction(sgSafe('ocean_boss', (ctx, loot) => sgGive(loot, 'ocean_blueprint')))

  // Bastion (Wrecker + Piglin)
  event.addTableModifier(/^minecraft:chests\/bastion_.*/).customAction(sgSafe('bastion', (ctx, loot) => {
    var start = sgFindStructure(ctx, 'minecraft:bastion_remnant', null)
    if (start == null) return
    var key = sgStructureKey(ctx, start)

    // Wrecker
    if (sgChance(ctx, 0.05) && sgMarkOnce(ctx, 'wrecker_blueprint_bastions', key)) sgGive(loot, 'wrecker_blueprint')

    // Piglin
    if (sgMarkOnce(ctx, 'piglin_blueprint_bastions', key) && sgChance(ctx, 0.02)) sgGive(loot, 'piglin_blueprint')
  }))

  // Diamond Steel / Treated Brass
  event.addTableModifier('cataclysm:entities/maledictus')
    .customAction(sgSafe('maledictus', (ctx, loot) => sgGive(loot, 'diamond_steel_blueprint')))
  event.addTableModifier('cataclysm:entities/ignis')
    .customAction(sgSafe('ignis', (ctx, loot) => sgGive(loot, 'treated_brass_blueprint')))

  // Deep Dark
  event.addTableModifier(/^(minecraft:chests\/ancient_city.*|nova_structures:chests\/ancient_city.*)$/).customAction(sgSafe('deep_dark', (ctx, loot) => {
    if (!sgChance(ctx, 0.01)) return
    var start = sgFindStructure(ctx, 'minecraft:ancient_city', null)
    if (start == null) return
    if (sgMarkOnce(ctx, 'deep_dark_blueprint_cities', sgStructureKey(ctx, start))) sgGive(loot, 'deep_dark_blueprint')
  }))

  // End
  event.addTableModifier('cataclysm:entities/ender_guardian')
    .customAction(sgSafe('ender_guardian', (ctx, loot) => sgGive(loot, 'end_blueprint')))

})