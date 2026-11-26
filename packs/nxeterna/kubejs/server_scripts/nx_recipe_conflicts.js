// nx_recipe_conflicts.js
// Fixes crafting recipes that had exactly the same inputs but different outputs
// (only one of them could ever be crafted, and autocrafting cannot use Polymorph).
// Every recipe keeps its original id so quest/JEI references stay valid; every
// affected output stays craftable. Details: reports/recipe-conflicts.md
//
// Intentionally NOT touched: refinedstorage fortune_1/2/3 + silk_touch upgrades
// (special recipe type that reads the enchantment on the book; not a real conflict).

ServerEvents.recipes(event => {

  // ---- Copper armour: create_sa:copper_* vs iceandfire:armor_copper_metal_* (identical copper-ingot armour shapes).
  // Ice and Fire keeps ingots; Create Stuff 'N Additions armour is made from Create copper sheets (same metal cost).
  const csaArmour = {
    helmet: ['SSS', 'S S'],
    chestplate: ['S S', 'SSS', 'SSS'],
    leggings: ['SSS', 'S S', 'S S'],
    boots: ['S S', 'S S']
  }
  Object.keys(csaArmour).forEach(piece => {
    const id = 'create_sa:copper_' + piece + '_recipe'
    event.remove({ id: id })
    event.shaped('create_sa:copper_' + piece, csaArmour[piece], { S: 'create:copper_sheet' }).id(id)
  })

  // ---- copper nugget: create:copper_nugget vs twilightforest:copper_nugget vs iceandfire:copper_nugget (all 1 copper ingot -> 9).
  // Create keeps the crafting recipe; the other two nuggets become a 1:1 stonecutter swap from the Create nugget (all three are in c:nuggets/copper).
  event.remove({ id: 'twilightforest:copper_ingot_to_nuggets' })
  event.remove({ id: 'iceandfire:copper_ingot_to_nuggets' })
  event.stonecutting('twilightforest:copper_nugget', 'create:copper_nugget').id('nx:stonecutting/twilightforest_copper_nugget')
  event.stonecutting('iceandfire:copper_nugget', 'create:copper_nugget').id('nx:stonecutting/iceandfire_copper_nugget')

  // ---- powergrid:pins vs iceandfire:copper_pile (both 2 copper nuggets shapeless).
  // Pins also need an iron nugget; the pile keeps the plain 2-nugget recipe like silver_pile.
  event.remove({ id: 'powergrid:crafting/pins' })
  event.shapeless('powergrid:pins', ['#c:nuggets/copper', '#c:nuggets/iron']).id('powergrid:crafting/pins')

  // ---- minecraft:copper_trapdoor vs createdeco:copper_bars (recipe id minecraft:copper_bars; both 3x2 copper ingots).
  // Vanilla trapdoor untouched; copper bars become two columns of ingots (3x3), still 6 ingots for 16 bars.
  event.remove({ id: 'minecraft:copper_bars' })
  event.shaped('16x createdeco:copper_bars', ['B B', 'B B', 'B B'], { B: 'minecraft:copper_ingot' }).id('minecraft:copper_bars')

  // ---- createdeco:iron_support vs aether:iron_ring (both a diamond of 4 iron ingots).
  // Support gets an iron sheet in the middle (the Aether accessory keeps its ring shape).
  event.remove({ id: 'createdeco:iron_support' })
  event.shaped('4x createdeco:iron_support', [' B ', 'BSB', ' B '], { B: 'minecraft:iron_ingot', S: 'create:iron_sheet' }).id('createdeco:iron_support')

  // ---- create_connected:crank_wheel vs dndesires:cog_crank (hand crank + cogwheel).
  // DnDesires version also needs andesite alloy.
  event.remove({ id: 'dndesires:crafting/cog_crank' })
  event.shapeless('dndesires:cog_crank', ['create:hand_crank', 'create:cogwheel', 'create:andesite_alloy']).id('dndesires:crafting/cog_crank')

  // ---- create_connected:large_crank_wheel vs dndesires:large_cog_crank (hand crank + large cogwheel).
  event.remove({ id: 'dndesires:crafting/large_cog_crank' })
  event.shapeless('dndesires:large_cog_crank', ['create:hand_crank', 'create:large_cogwheel', 'create:andesite_alloy']).id('dndesires:crafting/large_cog_crank')

  // ---- create_sa:vault_component vs create_connected:item_silo (both 1 item vault).
  // The silo conversion (the silo has its own crafting recipe) moves to the stonecutter, same 1:1 cost.
  event.remove({ id: 'create_connected:crafting/kinetics/item_silo_from_conversion' })
  event.stonecutting('create_connected:item_silo', 'create:item_vault').id('nx:stonecutting/item_silo_from_vault')

  // ---- create_sa:small_filling_tank vs create_connected:fluid_vessel (both 1 fluid tank).
  event.remove({ id: 'create_connected:crafting/kinetics/fluid_vessel_from_conversion' })
  event.stonecutting('create_connected:fluid_vessel', 'create:fluid_tank').id('nx:stonecutting/fluid_vessel_from_tank')

  // ---- copycats:copycat_vertical_step vs create:copycat_step (both 1 create_connected:copycat_vertical_step; Copycats+ already converts to the step itself).
  // The conversion to the Copycats+ vertical step moves to the stonecutter.
  event.remove({ id: 'create_connected:crafting/palettes/copycat_vertical_step_compat' })
  event.stonecutting('copycats:copycat_vertical_step', 'create_connected:copycat_vertical_step').id('nx:stonecutting/copycats_vertical_step_from_cc')

  // ---- create:portable_fluid_interface vs createcasing:copper_portable_storage_interface (both copper casing + chute).
  // The Create Encased storage variant also takes a chest (it is the storage interface).
  event.remove({ id: 'createcasing:crafting/portable_storage_interface/copper' })
  event.shapeless('createcasing:copper_portable_storage_interface', ['create:copper_casing', 'create:chute', 'minecraft:chest']).id('createcasing:crafting/portable_storage_interface/copper')

  // ---- railways:portable_fuel_interface vs createcasing:railway_portable_storage_interface (both railway casing + chute).
  event.remove({ id: 'createcasing:crafting/portable_storage_interface/railway' })
  event.shapeless('createcasing:railway_portable_storage_interface', ['create:railway_casing', 'create:chute', 'minecraft:chest']).id('createcasing:crafting/portable_storage_interface/railway')

  // ---- stone tiles: cataclysm:stone_tiles vs supplementaries:stone_tile vs crystal_chronicles:polished_stone_bricks (all 2x2 stone bricks -> 4).
  // Cataclysm keeps the crafting recipe; the other two become 1:1 stonecutter recipes from stone bricks.
  event.remove({ id: 'supplementaries:stone_tile' })
  event.remove({ id: 'crystal_chronicles:polished_stone_bricks' })
  event.stonecutting('supplementaries:stone_tile', 'minecraft:stone_bricks').id('nx:stonecutting/supplementaries_stone_tile')
  event.stonecutting('crystal_chronicles:polished_stone_bricks', 'minecraft:stone_bricks').id('nx:stonecutting/crystal_polished_stone_bricks')

  // ---- dustydecorations:sandstone_quoin vs dustydecorations:red_sandstone_quoin (same mod; both used the c:sandstone/blocks tag).
  // Each quoin now uses its own smooth sandstone, like the other quoins use polished/smooth stone.
  event.remove({ id: 'dustydecorations:quote_recipe_2' })
  event.remove({ id: 'dustydecorations:quote_recipe_3' })
  event.shaped('4x dustydecorations:sandstone_quoin', ['aaa', ' a '], { a: 'minecraft:smooth_sandstone' }).id('dustydecorations:quote_recipe_2')
  event.shaped('4x dustydecorations:red_sandstone_quoin', ['aaa', ' a '], { a: 'minecraft:smooth_red_sandstone' }).id('dustydecorations:quote_recipe_3')

  // ---- farmersdelight crates vs farm_and_charm bags (3x3 of carrot / beetroot / potato).
  // Farmer's Delight crates stay; the Farm & Charm bags are tied with its own rope in the middle (8 crops + rope).
  const bags = { carrot: 'minecraft:carrot', beetroot: 'minecraft:beetroot', potato: 'minecraft:potato' }
  Object.keys(bags).forEach(crop => {
    const id = 'farm_and_charm:' + crop + '_bag'
    event.remove({ id: id })
    event.shaped('farm_and_charm:' + crop + '_bag', ['###', '#R#', '###'], { '#': bags[crop], R: 'farm_and_charm:rope' }).id(id)
  })

  // ---- irons_spellbooks:book_stack vs dustydecorations:bookstack (3 books in a column; a row of 3 is already dustydecorations:books).
  // The Dusty Decorations stack is made from a 2x2 block of books (4 books -> 3 stacks, about the old 3 -> 2 ratio).
  event.remove({ id: 'dustydecorations:book_stack_recipe' })
  event.shaped('3x dustydecorations:bookstack', ['aa', 'aa'], { a: 'minecraft:book' }).id('dustydecorations:book_stack_recipe')

  // ---- mcwwindows:bamboo_shutter vs supplementaries:flute (3 bamboo in a column).
  // The flute is a pipe lying flat: three bamboo in a row. The shutter family keeps its vertical shape.
  event.remove({ id: 'supplementaries:flute' })
  event.shaped('supplementaries:flute', ['BBB'], { B: 'minecraft:bamboo' }).id('supplementaries:flute')

  // ---- minecraft:cartography_table vs fossilslegacy:archaeology_workbench (2 paper over 4 planks).
  // Vanilla untouched; the workbench takes a brush (the archaeology tool) in place of one paper.
  event.remove({ id: 'fossilslegacy:archaeology_workbench' })
  event.shaped('fossilslegacy:archaeology_workbench', ['PB', '##', '##'], { P: 'minecraft:paper', B: 'minecraft:brush', '#': '#minecraft:planks' }).id('fossilslegacy:archaeology_workbench')

  // ---- minecraft:end_stone_brick_wall vs betterend:end_stone_brick_cracked_wall vs betterend:end_stone_brick_weathered_wall (all 6 plain end stone bricks).
  // Better End bug: its cracked/weathered walls must use its own cracked/weathered bricks, like its slabs and stairs do.
  event.remove({ id: 'betterend:end_stone_brick_cracked_wall' })
  event.remove({ id: 'betterend:end_stone_brick_weathered_wall' })
  event.shaped('6x betterend:end_stone_brick_cracked_wall', ['###', '###'], { '#': 'betterend:end_stone_brick_cracked' }).id('betterend:end_stone_brick_cracked_wall')
  event.shaped('6x betterend:end_stone_brick_weathered_wall', ['###', '###'], { '#': 'betterend:end_stone_brick_weathered' }).id('betterend:end_stone_brick_weathered_wall')

  // ---- natures_spirit:paper_lantern vs mcwlights:white_paper_lamp (8 paper around a torch).
  // The white paper lamp is the root of the 16 dyed lamps, so the lantern takes a candle instead of a torch.
  event.remove({ id: 'natures_spirit:paper_lantern' })
  event.shaped('natures_spirit:paper_lantern', ['###', '#a#', '###'], { '#': 'minecraft:paper', a: 'minecraft:candle' }).id('natures_spirit:paper_lantern')
})
