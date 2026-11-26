// Create recipes
ServerEvents.recipes(event => {
  const C = event.recipes.create

  // Helpers
  const step = (inter, s) => {
    if (s === 'PRESS') return C.pressing(inter, inter)
    if (s === 'CUT') return C.cutting(inter, inter)
    if (s.charAt(0) === '#') return C.deploying(inter, [inter, Ingredient.of(s)])
    return C.deploying(inter, [inter, s])
  }
  // Each assembly needs a unique base + first step
  const usedStarts = {}
  const reserve = (base, first) => { usedStarts[base + '|' + first] = 'reserved' }
  const isItem = s => s !== 'PRESS' && s !== 'CUT' && s.charAt(0) !== '#'
  const planSequence = (name, base, steps) => {
    var pool = [base].concat(steps)
    for (var b = 0; b < pool.length; b++) {
      if (b > 0 && !isItem(pool[b])) continue
      var rest = pool.slice()
      var newBase = rest.splice(b, 1)[0]
      for (var i = 0; i < rest.length; i++) {
        var key = newBase + '|' + rest[i]
        if (usedStarts[key]) continue
        usedStarts[key] = name
        var first = rest.splice(i, 1)[0]
        rest.unshift(first)
        return { base: newBase, steps: rest }
      }
    }
    console.warn('[createrecipes] ' + name + ': no unique assembly start')
    return { base: base, steps: steps }
  }
  // Max 7 steps per assembly (JEI layout)
  const MAX_STEPS = 7
  const DROP_TIER = s => {
    if (s === 'create:iron_sheet' || s === 'create:copper_sheet' || s === 'create:brass_sheet' ||
      s === 'create:golden_sheet' || s === 'minecraft:iron_nugget' || s === 'create:brass_nugget' ||
      s === 'createaddition:iron_wire' || s === 'createaddition:copper_wire' || s === 'createaddition:iron_rod' ||
      s === 'create:andesite_alloy') return 1
    if (s === 'scguns:gun_grip' || s === 'scguns:wooden_stock') return 2
    if (s === 'PRESS' || s === 'CUT') return 3
    return 4
  }
  const trimSteps = (base, steps, max) => {
    var out = steps.slice()
    for (var i = out.length - 1; i >= 0 && out.length > max; i--) {
      var s = out[i]
      if (s === 'PRESS' || s === 'CUT') continue
      if (s === base || out.indexOf(s) < i) out.splice(i, 1)
    }
    for (var tier = 1; tier <= 4 && out.length > max; tier++) {
      for (var j = out.length - 1; j >= 0 && out.length > max; j--) {
        if (DROP_TIER(out[j]) === tier) out.splice(j, 1)
      }
    }
    return out
  }
  const assemble = (result, base, steps, blueprint, idPrefix) => {
    const name = result.split(':')[1]
    const inter = 'kubejs:incomplete_' + name
    steps = trimSteps(base, steps, MAX_STEPS - (blueprint ? 1 : 0))
    const plan = planSequence(name, base, steps)
    const seq = plan.steps.map(s => step(inter, s))
    if (blueprint) seq.push(C.deploying(inter, [inter, blueprint]).keepHeldItem())
    C.sequenced_assembly(result, plan.base, seq)
      .transitionalItem(inter)
      .loops(1)
      .id('kubejs:' + idPrefix + '/' + name)
  }
  const charge = (input, output, energy, id) => event.custom({
    type: 'createaddition:charging', energy: energy, max_charge_rate: 400,
    ingredients: [{ item: input }],
    results: [{ id: output }]
  }).id('kubejs:' + id)

  // ---- Scorched Guns ----
  const SG = id => 'scguns:' + id
  const removeAll = ids => ids.forEach(id => event.remove({ output: SG(id) }))

  const antiqueGuns = ['musket', 'flintlock_pistol', 'handcannon', 'blunderbuss', 'doublet', 'repeating_musket',
    'fencer_carabine', 'fencer_thumper', 'longarm', 'laser_musket', 'plasmabuss', 'teslock_rifle']
  const copperGuns = ['scrapper', 'rusty_gnat', 'umax_pistol', 'makeshift_rifle', 'boomstick', 'bruiser',
    'llr_director', 'birdfeeder', 'blooper', 'arc_worker', 'whistler']
  const frontierGuns = ['pax', 'winnie', 'winnie_millend', 'callwell', 'callwell_conversion', 'callwell_terminal',
    'saketini', 'saketini_ironport', 'red_raydar', 'kiln_gun', 'big_bore']
  const ironGuns = ['defender_pistol', 'trenchur', 'greaser_smg', 'm3_carabine', 'm3_marksman', 'combat_shotgun',
    'venturi', 'iron_javelin', 'iron_spear', 'auvtomag', 'pulsar', 'gyrojet_pistol', 'brawler', 'crusader',
    'mk43_rifle', 'triquetra', 'rocket_rifle', 'ultra_knight_hawk']
  const oceanGuns = ['floundergat', 'marlin', 'bomb_lance', 'hullbreaker', 'sequoia', 'hyperbaria', 'spirulida']
  const wreckerGuns = ['basker', 'homemaker', 'kalaskah', 'killer_23', 'mak_mkii', 'mokova', 'railworker', 'stigg', 'stiletto', 'tl_runner', 'turnpike', 'whizzbanger']
  const diamondSteelGuns = ['cyclone', 'drill_conversion', 'drill', 'inertial', 'inquisitor', 'krauser', 'lockewood', 'mas_55', 'mas_peddler', 'micina', 'minksy', 'nailer', 'plasgun', 'prush_gun', 'rg_jigsaw', 'shard_culler', 'soul_drummer', 'truant', 'uppercut', 'valora', 'zilk_45']
  const treatedBrassGuns = ['cogloader', 'cr4k_mining_laser', 'dozier_rl', 'gale', 'gattaler', 'gauss_rifle', 'grandle', 'grandle_og', 'hammer_gl', 'howler_conversion', 'howler', 'jackhammer', 'jr_wristbreaker', 'libertas', 'm22_waltz', 'niami', 'osgood_50', 'scratches', 'spitfire', 'thunderhead', 'waltz_conversion']
  const piglinGuns = ['empty_blasphemy', 'super_shotgun', 'freyr', 'mangalitsa', 'pyroclastic_flow', 'trotters', 'vulcanic_repeater']
  const deepDarkGuns = ['echoes_2', 'forlorn_hope', 'sculk_resonator', 'whispers']
  const endGuns = ['carapice', 'dark_matter', 'lone_wonder', 'raygun', 'shellurker', 'weevil']
  const scorchedGuns = ['astella', 'earths_corpse', 'flayed_god', 'locust', 'nervepinch', 'newborn_cyst', 'prima_materia', 'rat_king_and_queen', 'sterilizer', 'terra_incognita']
  const sgParts = ['stone_gun_barrel', 'wooden_stock', 'firing_unit', 'rapid_firing_unit', 'gun_magazine',
    'gun_parts', 'heavy_gun_parts', 'gun_grip', 'gun_barrel', 'heavy_gun_barrel', 'copper_gun_frame',
    'empty_tank', 'iron_gun_frame', 'iron_bayonet', 'treated_iron_gun_frame', 'treated_brass_gun_frame',
    'diamond_steel_gun_frame', 'scorched_gun_frame', 'advanced_silencer', 'vertical_grip', 'blank_mold', 'empty_core', 'energy_core', 'plasma_core', 'charged_amethyst_shard', 'copper_disc']

  removeAll(antiqueGuns)
  removeAll(copperGuns)
  removeAll(frontierGuns)
  removeAll(ironGuns)
  removeAll(oceanGuns)
  removeAll(wreckerGuns)
  removeAll(diamondSteelGuns)
  removeAll(treatedBrassGuns)
  removeAll(piglinGuns)
  removeAll(deepDarkGuns)
  removeAll(endGuns)
  removeAll(scorchedGuns)
  removeAll(sgParts)
  // Blueprints are loot-only (see loot.js)
  removeAll(['antique_blueprint', 'copper_blueprint', 'frontier_blueprint', 'iron_blueprint', 'ocean_blueprint',
    'wrecker_blueprint', 'diamond_steel_blueprint', 'treated_brass_blueprint', 'piglin_blueprint',
    'deep_dark_blueprint', 'end_blueprint', 'scorched_blueprint'])

  // Old alloy recipes
  event.remove({ output: SG('treated_iron_blend') })
  event.remove({ output: SG('diamond_steel_blend') })
  event.remove({ id: 'scguns:create/diamond_steel_ingot_from_mixing' })
  event.remove({ output: SG('scorched_blend') })

  // Scorched Guns machine recipes
  const sgMachines = ['scguns:macerating', 'scguns:powered_macerating', 'scguns:mechanical_pressing',
    'scguns:powered_mechanical_pressing', 'scguns:lightning_battery']
  const sgMaterials = sgParts.concat(['treated_iron_blend', 'treated_iron_ingot', 'treated_iron_nugget', 'treated_iron_block',
    'treated_brass_blend', 'treated_brass_ingot', 'treated_brass_block', 'diamond_steel_blend', 'diamond_steel_ingot',
    'depleted_diamond_steel_ingot', 'diamond_steel_block', 'scorched_blend', 'scorched_ingot', 'scorched_block',
    'nether_star_fragment', 'depleted_energy_core'])
  sgMachines.forEach(type => sgMaterials.forEach(id => event.remove({ type: type, output: SG(id) })))
  sgMachines.forEach(type => event.remove({ type: type }))

  // Reserved assembly starts
  reserve('create:iron_sheet', 'create:andesite_alloy') // blank_mold
  reserve('minecraft:stick', 'create:iron_sheet')       // vertical_grip
  reserve('create:iron_sheet', 'minecraft:glistering_melon_slice') // syringe
  reserve('createaddition:iron_rod', 'CUT')             // flechette
  reserve('scguns:treated_iron_ingot', 'CUT')           // shotball
  reserve('minecraft:gravel', 'PRESS')                  // pebbles
  reserve('scguns:blank_mold', 'CUT')                   // molds
  reserve('create:iron_sheet', 'create:iron_sheet')     // powergrid transformer_core

  // Parts
  assemble(SG('stone_gun_barrel'), 'minecraft:smooth_stone',
    ['CUT', 'createaddition:iron_rod', 'create:andesite_alloy', 'PRESS'], null, 'scguns')

  C.deploying(SG('wooden_stock'), [Ingredient.of('#c:stripped_logs'), 'create:iron_sheet'])
    .id('kubejs:scguns/wooden_stock')

  assemble(SG('gun_grip'), '#minecraft:planks',
    ['CUT', 'minecraft:leather', 'minecraft:iron_nugget'], null, 'scguns')

  assemble(SG('gun_parts'), 'create:iron_sheet',
    ['CUT', 'minecraft:iron_nugget', 'create:andesite_alloy', 'PRESS'], null, 'scguns')

  assemble(SG('heavy_gun_parts'), SG('gun_parts'),
    ['create:iron_sheet', 'create:copper_sheet', 'PRESS'], null, 'scguns')

  assemble(SG('firing_unit'), 'create:iron_sheet',
    ['minecraft:flint', 'createaddition:iron_wire', 'minecraft:iron_nugget', 'PRESS'], null, 'scguns')

  assemble(SG('rapid_firing_unit'), SG('firing_unit'),
    ['create:cogwheel', 'createaddition:iron_wire', 'create:copper_sheet', 'PRESS'], null, 'scguns')

  assemble(SG('gun_magazine'), 'create:iron_sheet',
    ['PRESS', 'create:iron_sheet', 'createaddition:iron_wire', 'PRESS'], null, 'scguns')

  assemble(SG('gun_barrel'), 'create:iron_sheet',
    ['createaddition:iron_rod', 'PRESS', 'CUT'], null, 'scguns')

  assemble(SG('heavy_gun_barrel'), SG('gun_barrel'),
    ['create:iron_sheet', 'create:iron_sheet', 'PRESS'], null, 'scguns')

  assemble(SG('copper_gun_frame'), 'create:copper_sheet',
    ['create:copper_sheet', 'minecraft:copper_ingot', 'PRESS', 'CUT'], null, 'scguns')

  assemble(SG('empty_tank'), 'create:copper_sheet',
    ['PRESS', 'create:copper_sheet', 'create:fluid_pipe', 'PRESS'], null, 'scguns')

  assemble(SG('iron_gun_frame'), 'create:iron_sheet',
    ['create:iron_sheet', 'minecraft:iron_ingot', 'PRESS', 'CUT'], null, 'scguns')

  assemble(SG('iron_bayonet'), 'create:iron_sheet',
    ['minecraft:stick', 'CUT', 'CUT'], null, 'scguns')

  // Alloys
  C.mixing([Item.of(SG('treated_iron_blend'), 3)],
    ['minecraft:iron_ingot', 'minecraft:charcoal', 'minecraft:flint', 'minecraft:redstone'])
    .heated().id('kubejs:scguns/treated_iron_blend')
  C.mixing([Item.of(SG('diamond_steel_blend'), 4)],
    ['minecraft:diamond', SG('treated_iron_ingot'), 'minecraft:lapis_lazuli', 'create:powdered_obsidian'])
    .superheated().id('kubejs:scguns/diamond_steel_blend')
  C.mixing([Item.of(SG('scorched_blend'), 4)],
    [SG('nether_star_fragment'), 'minecraft:netherite_ingot', 'minecraft:dragon_breath', 'minecraft:blaze_rod'])
    .superheated().id('kubejs:scguns/scorched_blend')

  // Frames
  assemble(SG('treated_iron_gun_frame'), SG('treated_iron_ingot'),
    ['PRESS', SG('treated_iron_ingot'), 'PRESS', 'CUT'], null, 'scguns')
  assemble(SG('treated_brass_gun_frame'), SG('treated_brass_ingot'),
    ['PRESS', SG('treated_brass_ingot'), 'PRESS', 'CUT'], null, 'scguns')
  assemble(SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'),
    ['PRESS', SG('diamond_steel_ingot'), 'PRESS', 'CUT'], null, 'scguns')
  assemble(SG('scorched_gun_frame'), SG('scorched_ingot'),
    ['PRESS', SG('scorched_ingot'), 'PRESS', 'CUT'], null, 'scguns')

  // Scorched Blueprint
  C.mechanical_crafting(SG('scorched_blueprint'), [
    'ABCD',
    'EXFG',
    'HIJK'
  ], {
    A: SG('antique_blueprint'), B: SG('copper_blueprint'), C: SG('frontier_blueprint'), D: SG('iron_blueprint'),
    E: SG('ocean_blueprint'), F: SG('wrecker_blueprint'), G: SG('diamond_steel_blueprint'), H: SG('treated_brass_blueprint'),
    I: SG('piglin_blueprint'), J: SG('deep_dark_blueprint'), K: SG('end_blueprint'), X: 'minecraft:nether_star'
  }).id('kubejs:scguns/scorched_blueprint')

  // Misc parts
  assemble(SG('advanced_silencer'), 'create:iron_sheet',
    ['minecraft:sponge', 'PRESS', 'create:iron_sheet', 'PRESS'], null, 'scguns')
  C.deploying(SG('vertical_grip'), ['minecraft:stick', 'create:iron_sheet']).id('kubejs:scguns/vertical_grip')
  C.deploying(SG('blank_mold'), ['create:iron_sheet', 'create:andesite_alloy']).id('kubejs:scguns/blank_mold')
  C.cutting([Item.of(SG('large_iron_casing'), 2)], 'minecraft:iron_ingot').id('kubejs:scguns/large_iron_casing')

  // Cores
  assemble(SG('empty_core'), 'create:copper_sheet',
    ['minecraft:glass_pane', 'PRESS', 'createaddition:copper_wire', 'PRESS'], null, 'scguns')

  assemble(SG('energy_core'), SG('empty_core'),
    ['minecraft:redstone_block', SG('charged_amethyst_shard'), 'createaddition:capacitor', 'PRESS'], null, 'scguns')

  C.cutting(Item.of(SG('copper_disc'), 2), 'minecraft:copper_block').id('kubejs:scguns/copper_disc')

  // Tesla Coil charging
  charge('minecraft:amethyst_shard', SG('charged_amethyst_shard'), 3200, 'scguns/charged_amethyst_shard')
  charge(SG('energy_core'), SG('plasma_core'), 16000, 'scguns/plasma_core')
  charge(SG('depleted_energy_core'), SG('energy_core'), 4800, 'scguns/recharge_energy_core')

  // Antique
  const A = (gun, base, steps) => assemble(SG(gun), base, steps, SG('antique_blueprint'), 'scguns/antique')
  const sBarrel = SG('stone_gun_barrel')

  A('flintlock_pistol', sBarrel, ['minecraft:flint', 'create:andesite_alloy', SG('gun_grip')])
  A('musket', sBarrel, [sBarrel, 'minecraft:flint', 'create:andesite_alloy', 'createaddition:iron_rod', SG('wooden_stock')])
  A('handcannon', sBarrel, ['minecraft:smooth_stone', 'create:andesite_alloy', 'minecraft:flint', SG('gun_grip')])
  A('blunderbuss', sBarrel, ['create:copper_sheet', 'create:copper_sheet', 'minecraft:flint', SG('wooden_stock')])
  A('doublet', sBarrel, [sBarrel, 'create:andesite_alloy', 'minecraft:flint', 'minecraft:flint', SG('wooden_stock')])
  A('repeating_musket', sBarrel, [sBarrel, 'create:cogwheel', SG('firing_unit'), SG('gun_parts'), SG('wooden_stock')])
  A('fencer_carabine', sBarrel, [sBarrel, SG('firing_unit'), SG('gun_parts'), SG('wooden_stock')])
  A('fencer_thumper', sBarrel, [sBarrel, SG('firing_unit'), SG('gun_magazine'), SG('gun_parts'), SG('gun_grip')])
  A('longarm', sBarrel, ['createaddition:iron_rod', SG('firing_unit'), SG('gun_magazine'), SG('gun_parts'), SG('gun_grip')])
  A('laser_musket', sBarrel, [sBarrel, 'create:polished_rose_quartz', SG('energy_core'), 'createaddition:copper_wire', SG('gun_grip')])
  A('plasmabuss', sBarrel, [sBarrel, 'create:copper_sheet', SG('plasma_core'), 'createaddition:copper_wire', SG('gun_grip')])
  A('teslock_rifle', sBarrel, [SG('copper_disc'), 'createaddition:copper_spool', 'createaddition:capacitor', SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])

  // Copper
  const K = (gun, base, steps) => assemble(SG(gun), base, steps, SG('copper_blueprint'), 'scguns/copper')
  const barrel = SG('gun_barrel')
  const heavy = SG('heavy_gun_barrel')

  K('scrapper', barrel, [SG('firing_unit'), SG('gun_parts'), 'create:copper_sheet', SG('gun_magazine'), SG('gun_grip')])
  K('rusty_gnat', barrel, [SG('copper_gun_frame'), SG('rapid_firing_unit'), SG('gun_parts'), SG('gun_magazine'), SG('gun_grip')])
  K('umax_pistol', barrel, [SG('firing_unit'), SG('gun_parts'), SG('empty_tank'), 'create:copper_sheet', SG('gun_grip')])
  K('makeshift_rifle', barrel, [SG('copper_gun_frame'), SG('firing_unit'), SG('gun_parts'), SG('gun_magazine'), SG('wooden_stock')])
  K('boomstick', barrel, [barrel, 'create:copper_sheet', SG('firing_unit'), SG('gun_parts'), SG('gun_grip')])
  K('bruiser', barrel, [SG('heavy_gun_parts'), SG('firing_unit'), 'create:copper_sheet', 'create:copper_sheet', SG('gun_grip')])
  K('llr_director', barrel, [barrel, SG('copper_gun_frame'), SG('firing_unit'), SG('gun_parts'), SG('wooden_stock')])
  K('birdfeeder', heavy, [barrel, SG('copper_gun_frame'), SG('rapid_firing_unit'), SG('gun_parts'), SG('wooden_stock')])
  K('blooper', heavy, [SG('copper_gun_frame'), SG('heavy_gun_parts'), SG('firing_unit'), 'create:copper_sheet', SG('gun_grip')])
  K('arc_worker', SG('copper_disc'), [SG('copper_gun_frame'), 'createaddition:copper_spool', 'createaddition:capacitor', 'minecraft:redstone', SG('firing_unit'), SG('gun_parts'), SG('gun_grip')])
  K('whistler', heavy, [barrel, SG('copper_gun_frame'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_grip')])

  // Frontier
  const F = (gun, base, steps) => assemble(SG(gun), base, steps, SG('frontier_blueprint'), 'scguns/frontier')

  F('pax', barrel, [SG('firing_unit'), SG('gun_magazine'), 'create:shaft', SG('gun_parts'), SG('gun_grip')])
  F('winnie', barrel, ['createaddition:iron_rod', SG('firing_unit'), SG('gun_parts'), 'create:iron_sheet', SG('wooden_stock')])
  F('winnie_millend', barrel, [barrel, 'createaddition:iron_rod', SG('firing_unit'), SG('gun_parts'), 'create:brass_nugget', SG('wooden_stock')])
  F('callwell', barrel, [barrel, barrel, barrel, 'create:iron_sheet', SG('firing_unit'), SG('gun_parts'), SG('gun_grip')])
  F('callwell_conversion', heavy, [SG('firing_unit'), SG('gun_parts'), SG('gun_magazine'), 'create:iron_sheet', SG('gun_grip')])
  F('callwell_terminal', heavy, [barrel, SG('firing_unit'), SG('gun_parts'), SG('gun_magazine'), 'create:iron_sheet', SG('gun_grip')])
  F('saketini', barrel, [barrel, SG('firing_unit'), SG('gun_parts'), 'minecraft:leather', SG('gun_grip')])
  F('saketini_ironport', barrel, [barrel, SG('gun_magazine'), SG('firing_unit'), SG('gun_parts'), 'create:iron_sheet', SG('gun_grip')])
  F('red_raydar', barrel, [SG('empty_tank'), 'create:polished_rose_quartz', 'createaddition:copper_wire', SG('gun_parts'), SG('wooden_stock')])
  F('kiln_gun', heavy, [heavy, 'create:cogwheel', 'create:shaft', SG('rapid_firing_unit'), SG('heavy_gun_parts'), SG('gun_grip')])
  F('big_bore', heavy, [heavy, SG('heavy_gun_parts'), SG('firing_unit'), 'create:iron_sheet', SG('wooden_stock')])

  // Iron
  const I = (gun, base, steps) => assemble(SG(gun), base, steps, SG('iron_blueprint'), 'scguns/iron')
  const frame = SG('iron_gun_frame')

  I('defender_pistol', barrel, [frame, SG('firing_unit'), SG('gun_parts'), SG('gun_magazine'), SG('gun_grip')])
  I('trenchur', barrel, [SG('gun_magazine'), SG('firing_unit'), SG('gun_parts'), 'create:brass_sheet', SG('gun_grip')])
  I('greaser_smg', barrel, [frame, SG('rapid_firing_unit'), SG('gun_parts'), SG('gun_magazine'), SG('gun_grip')])
  I('m3_carabine', barrel, [barrel, frame, SG('firing_unit'), SG('gun_parts'), SG('gun_magazine'), SG('wooden_stock')])
  I('m3_marksman', heavy, [frame, SG('firing_unit'), SG('gun_parts'), SG('gun_magazine'), 'minecraft:spyglass', SG('wooden_stock')])
  I('combat_shotgun', heavy, [frame, SG('firing_unit'), SG('gun_parts'), SG('gun_magazine'), SG('gun_grip')])
  I('venturi', barrel, [frame, SG('empty_tank'), SG('firing_unit'), SG('gun_parts'), SG('gun_grip')])
  I('iron_javelin', barrel, [barrel, frame, SG('firing_unit'), SG('gun_parts'), SG('iron_bayonet'), SG('wooden_stock')])
  I('iron_spear', heavy, [barrel, frame, SG('heavy_gun_parts'), SG('firing_unit'), SG('iron_bayonet'), SG('wooden_stock')])
  I('auvtomag', heavy, [SG('heavy_gun_parts'), SG('firing_unit'), 'create:brass_sheet', SG('gun_magazine'), SG('gun_grip')])
  I('pulsar', barrel, [SG('firing_unit'), SG('gun_parts'), 'create:electron_tube', 'minecraft:redstone', SG('gun_grip')])
  I('gyrojet_pistol', heavy, [SG('heavy_gun_parts'), SG('firing_unit'), 'create:brass_sheet', SG('gun_magazine'), SG('gun_grip')])
  I('brawler', heavy, [heavy, SG('heavy_gun_parts'), SG('firing_unit'), 'create:brass_sheet', SG('gun_grip')])
  I('crusader', 'minecraft:crossbow', [frame, SG('gun_parts'), 'create:cogwheel', SG('gun_grip')])
  I('mk43_rifle', heavy, [frame, SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), 'create:precision_mechanism', SG('wooden_stock')])
  I('triquetra', heavy, [heavy, frame, SG('heavy_gun_parts'), SG('firing_unit'), SG('empty_tank'), SG('gun_grip')])
  I('rocket_rifle', heavy, [heavy, frame, SG('firing_unit'), SG('gun_parts'), 'create:precision_mechanism', SG('gun_grip')])
  I('ultra_knight_hawk', heavy, [heavy, 'minecraft:iron_block', SG('heavy_gun_parts'), SG('firing_unit'), 'create:precision_mechanism', SG('gun_grip')])

  // Ocean
  const O = (gun, base, steps) => assemble(SG(gun), base, steps, SG('ocean_blueprint'), 'scguns/ocean')

  O('floundergat', heavy, [heavy, heavy, heavy, 'minecraft:heart_of_the_sea', 'create:cogwheel', SG('gun_parts'), SG('gun_grip')])
  O('marlin', barrel, [barrel, frame, SG('firing_unit'), 'minecraft:heart_of_the_sea', 'minecraft:prismarine_shard', 'create:brass_sheet', SG('gun_grip')])
  O('bomb_lance', frame, [barrel, SG('firing_unit'), SG('iron_bayonet'), SG('iron_bayonet'), SG('iron_bayonet'), SG('wooden_stock')])
  O('hullbreaker', heavy, [heavy, frame, SG('heavy_gun_parts'), SG('firing_unit'), 'minecraft:iron_block', 'minecraft:nautilus_shell', SG('gun_grip')])
  O('sequoia', barrel, [barrel, SG('gun_magazine'), SG('heavy_gun_parts'), SG('firing_unit'), 'create:brass_sheet', 'minecraft:prismarine_crystals', SG('gun_grip')])
  O('hyperbaria', barrel, [SG('firing_unit'), SG('heavy_gun_parts'), SG('gun_magazine'), 'create:brass_sheet', 'minecraft:nautilus_shell', SG('gun_grip')])
  O('spirulida', barrel, [barrel, barrel, barrel, 'minecraft:heart_of_the_sea', SG('heavy_gun_parts'), SG('gun_magazine'), SG('gun_grip')])

  // Wrecker
  const W = (gun, base, steps) => assemble(SG(gun), base, steps, SG('wrecker_blueprint'), 'scguns/wrecker')
  W('basker', SG('gun_barrel'), [SG('treated_iron_gun_frame'), SG('treated_iron_ingot'), SG('gun_parts'), SG('rapid_firing_unit'), SG('empty_tank'), 'minecraft:flint_and_steel', SG('gun_grip')])
  W('homemaker', SG('heavy_gun_barrel'), [SG('treated_iron_gun_frame'), SG('treated_iron_ingot'), SG('gun_parts'), SG('firing_unit'), SG('wooden_stock'), SG('gun_grip')])
  W('kalaskah', SG('gun_barrel'), [SG('treated_iron_gun_frame'), 'create:iron_sheet', SG('gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  W('killer_23', SG('heavy_gun_barrel'), [SG('treated_iron_gun_frame'), SG('treated_iron_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('wooden_stock'), SG('gun_grip')])
  W('mak_mkii', SG('gun_barrel'), [SG('treated_iron_gun_frame'), 'create:iron_sheet', SG('gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  W('mokova', SG('gun_barrel'), [SG('treated_iron_ingot'), SG('gun_parts'), SG('firing_unit'), 'minecraft:white_wool', SG('gun_magazine'), SG('gun_grip')])
  W('railworker', SG('gun_barrel'), [SG('treated_iron_ingot'), SG('treated_iron_ingot'), SG('gun_parts'), SG('firing_unit'), SG('empty_tank'), SG('gun_magazine'), SG('gun_grip')])
  W('stigg', SG('heavy_gun_barrel'), [SG('treated_iron_gun_frame'), SG('treated_iron_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  W('stiletto', SG('heavy_gun_barrel'), [SG('treated_iron_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_grip')])
  W('tl_runner', SG('gun_barrel'), [SG('treated_iron_ingot'), SG('gun_parts'), SG('plasma_core'), SG('wooden_stock'), SG('gun_grip')])
  W('turnpike', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('treated_iron_gun_frame'), SG('treated_iron_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('wooden_stock'), SG('gun_grip')])
  W('whizzbanger', SG('treated_iron_ingot'), [SG('firing_unit'), SG('large_iron_casing'), 'minecraft:stick', SG('vertical_grip')])

  // Diamond Steel
  const D = (gun, base, steps) => assemble(SG(gun), base, steps, SG('diamond_steel_blueprint'), 'scguns/diamond_steel')
  D('cyclone', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), SG('diamond_steel_gun_frame'), SG('diamond_steel_gun_frame'), SG('diamond_steel_gun_frame'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_grip')])
  D('drill_conversion', SG('gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('gun_parts'), SG('firing_unit'), SG('wooden_stock'), SG('gun_grip')])
  D('drill', SG('gun_barrel'), [SG('gun_barrel'), SG('gun_barrel'), SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('gun_parts'), SG('firing_unit'), SG('wooden_stock'), SG('gun_grip')])
  D('inertial', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('wooden_stock'), SG('gun_grip')])
  D('inquisitor', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('empty_tank'), SG('wooden_stock'), SG('gun_grip')])
  D('krauser', SG('gun_barrel'), [SG('diamond_steel_ingot'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  D('lockewood', SG('gun_barrel'), [SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  D('mas_55', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  D('mas_peddler', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  D('micina', SG('gun_barrel'), [SG('diamond_steel_ingot'), SG('diamond_steel_ingot'), SG('gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  D('minksy', SG('gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('energy_core'), SG('wooden_stock'), SG('gun_grip')])
  D('nailer', SG('gun_barrel'), [SG('diamond_steel_ingot'), SG('diamond_steel_ingot'), SG('gun_parts'), SG('rapid_firing_unit'), SG('empty_tank'), SG('gun_magazine'), SG('gun_grip')])
  D('plasgun', SG('gun_barrel'), [SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('plasma_core'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  D('prush_gun', SG('gun_barrel'), [SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  D('rg_jigsaw', SG('heavy_gun_barrel'), [SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  D('shard_culler', SG('gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('diamond_steel_gun_frame'), SG('diamond_steel_gun_frame'), SG('heavy_gun_parts'), SG('energy_core'), 'minecraft:amethyst_shard', SG('gun_grip')])
  D('soul_drummer', SG('gun_barrel'), [SG('diamond_steel_ingot'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  D('truant', SG('heavy_gun_barrel'), [SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  D('uppercut', SG('heavy_gun_barrel'), [SG('diamond_steel_gun_frame'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  D('valora', SG('gun_barrel'), [SG('diamond_steel_ingot'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('advanced_silencer'), SG('gun_magazine'), SG('gun_grip')])
  D('zilk_45', SG('gun_barrel'), [SG('diamond_steel_gun_frame'), SG('treated_iron_ingot'), SG('diamond_steel_ingot'), SG('diamond_steel_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])

  // Treated Brass
  const T = (gun, base, steps) => assemble(SG(gun), base, steps, SG('treated_brass_blueprint'), 'scguns/treated_brass')
  T('cogloader', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  T('cr4k_mining_laser', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_gun_frame'), 'create:precision_mechanism', SG('heavy_gun_parts'), SG('energy_core'), SG('gun_grip')])
  T('dozier_rl', SG('heavy_gun_barrel'), [SG('treated_brass_gun_frame'), SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  T('gale', SG('gun_barrel'), [SG('gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('gun_parts'), SG('firing_unit'), SG('empty_tank'), SG('gun_grip')])
  T('gattaler', SG('gun_barrel'), [SG('gun_barrel'), SG('gun_barrel'), SG('gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_gun_frame'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  T('gauss_rifle', SG('gun_barrel'), [SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('plasma_core'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  T('grandle', SG('gun_barrel'), [SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  T('grandle_og', SG('gun_barrel'), [SG('gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('gun_parts'), SG('rapid_firing_unit'), SG('wooden_stock'), SG('gun_grip')])
  T('hammer_gl', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  T('howler_conversion', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  T('howler', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  T('jackhammer', SG('heavy_gun_barrel'), [SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  T('jr_wristbreaker', SG('heavy_gun_barrel'), [SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  T('libertas', SG('heavy_gun_barrel'), [SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('plasma_core'), SG('plasma_core'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  T('m22_waltz', SG('gun_barrel'), [SG('treated_brass_ingot'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  T('niami', SG('gun_barrel'), [SG('treated_brass_gun_frame'), SG('treated_brass_ingot'), SG('treated_brass_ingot'), SG('gun_parts'), SG('firing_unit'), SG('empty_tank'), SG('gun_grip')])
  T('osgood_50', SG('heavy_gun_barrel'), [SG('treated_brass_ingot'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  T('scratches', SG('gun_barrel'), [SG('gun_barrel'), SG('gun_barrel'), SG('gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_gun_frame'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('empty_tank'), SG('gun_grip')])
  T('spitfire', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_gun_frame'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('empty_tank'), SG('gun_grip')])
  T('thunderhead', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), SG('heavy_gun_barrel'), SG('heavy_gun_barrel'), SG('treated_brass_gun_frame'), SG('treated_brass_gun_frame'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  T('waltz_conversion', SG('gun_barrel'), [SG('treated_brass_ingot'), SG('treated_brass_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('energy_core'), SG('gun_magazine'), SG('gun_grip')])

  // Piglin
  const G = (gun, base, steps) => assemble(SG(gun), base, steps, SG('piglin_blueprint'), 'scguns/piglin')
  G('empty_blasphemy', SG('gun_barrel'), ['create:golden_sheet', 'create:golden_sheet', 'create:iron_sheet', 'minecraft:white_wool', SG('heavy_gun_parts')])
  G('super_shotgun', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), 'create:golden_sheet', 'create:golden_sheet', SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_grip')])
  G('freyr', SG('gun_barrel'), ['create:golden_sheet', 'minecraft:crimson_planks', 'minecraft:crimson_planks', SG('heavy_gun_parts'), SG('rapid_firing_unit'), 'minecraft:blaze_rod', SG('gun_magazine'), SG('gun_grip')])
  G('mangalitsa', SG('heavy_gun_barrel'), ['create:golden_sheet', 'minecraft:crimson_planks', 'minecraft:crimson_planks', SG('heavy_gun_parts'), SG('firing_unit'), 'minecraft:blaze_rod', SG('gun_magazine'), SG('gun_grip')])
  G('pyroclastic_flow', SG('gun_barrel'), ['create:golden_sheet', 'minecraft:crimson_planks', SG('heavy_gun_parts'), 'minecraft:blaze_rod', SG('gun_magazine'), SG('gun_grip')])
  G('trotters', SG('heavy_gun_barrel'), [SG('gun_barrel'), 'create:golden_sheet', 'create:golden_sheet', 'minecraft:crimson_planks', SG('heavy_gun_parts'), SG('firing_unit'), 'minecraft:blaze_rod', SG('gun_grip')])
  G('vulcanic_repeater', SG('gun_barrel'), [SG('gun_barrel'), 'create:golden_sheet', 'minecraft:crimson_planks', SG('heavy_gun_parts'), SG('firing_unit'), 'minecraft:blaze_rod', SG('gun_magazine'), SG('gun_grip')])

  // Deep Dark
  const Q = (gun, base, steps) => assemble(SG(gun), base, steps, SG('deep_dark_blueprint'), 'scguns/deep_dark')
  Q('echoes_2', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), SG('gun_barrel'), SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('firing_unit'), 'minecraft:echo_shard', 'minecraft:sculk_sensor', SG('wooden_stock'), SG('gun_grip')])
  Q('forlorn_hope', SG('gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('firing_unit'), 'minecraft:echo_shard', 'minecraft:sculk_sensor', SG('wooden_stock'), SG('gun_grip')])
  Q('sculk_resonator', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('plasma_core'), 'minecraft:echo_shard', 'minecraft:sculk_sensor', SG('wooden_stock'), SG('gun_grip')])
  Q('whispers', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('rapid_firing_unit'), 'minecraft:echo_shard', 'minecraft:sculk_sensor', SG('gun_magazine'), SG('gun_grip')])

  // End
  const E = (gun, base, steps) => assemble(SG(gun), base, steps, SG('end_blueprint'), 'scguns/end')
  E('carapice', SG('heavy_gun_barrel'), [SG('diamond_steel_gun_frame'), SG('diamond_steel_gun_frame'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), 'minecraft:shulker_shell', 'minecraft:shulker_shell', SG('gun_grip')])
  E('dark_matter', SG('gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('rapid_firing_unit'), 'minecraft:shulker_shell', 'minecraft:shulker_shell', SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  E('lone_wonder', SG('heavy_gun_barrel'), [SG('treated_brass_gun_frame'), SG('treated_brass_gun_frame'), 'create:precision_mechanism', SG('heavy_gun_parts'), SG('rapid_firing_unit'), 'minecraft:redstone', SG('wooden_stock'), SG('gun_grip')])
  E('raygun', SG('gun_barrel'), ['create:precision_mechanism', SG('heavy_gun_parts'), SG('plasma_core'), SG('gun_grip')])
  E('shellurker', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('diamond_steel_gun_frame'), SG('diamond_steel_gun_frame'), SG('heavy_gun_parts'), SG('firing_unit'), 'minecraft:shulker_shell', 'minecraft:shulker_shell', 'minecraft:shulker_shell', SG('gun_grip')])
  E('weevil', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), SG('diamond_steel_gun_frame'), SG('diamond_steel_gun_frame'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), 'minecraft:shulker_shell', 'minecraft:shulker_shell', 'minecraft:shulker_shell', SG('gun_grip')])

  // Scorched
  const X = (gun, base, steps) => assemble(SG(gun), base, steps, SG('scorched_blueprint'), 'scguns/scorched')
  X('astella', SG('gun_barrel'), [SG('gun_barrel'), SG('scorched_gun_frame'), SG('scorched_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  X('earths_corpse', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('scorched_gun_frame'), SG('scorched_ingot'), SG('scorched_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  X('flayed_god', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('scorched_gun_frame'), SG('scorched_ingot'), SG('scorched_ingot'), SG('heavy_gun_parts'), SG('energy_core'), SG('nether_star_fragment'), SG('gun_grip')])
  X('locust', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('scorched_gun_frame'), SG('scorched_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  X('nervepinch', SG('heavy_gun_barrel'), [SG('gun_barrel'), SG('scorched_gun_frame'), SG('scorched_ingot'), SG('heavy_gun_parts'), SG('empty_tank'), SG('gun_magazine'), SG('gun_grip')])
  X('newborn_cyst', SG('heavy_gun_barrel'), [SG('scorched_gun_frame'), SG('scorched_ingot'), SG('heavy_gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  X('prima_materia', SG('gun_barrel'), [SG('scorched_ingot'), SG('scorched_ingot'), SG('gun_parts'), SG('firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  X('rat_king_and_queen', SG('gun_barrel'), [SG('scorched_gun_frame'), SG('scorched_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_magazine'), SG('gun_grip')])
  X('sterilizer', SG('heavy_gun_barrel'), [SG('scorched_gun_frame'), SG('scorched_ingot'), SG('heavy_gun_parts'), SG('plasma_core'), SG('gun_magazine'), SG('wooden_stock'), SG('gun_grip')])
  X('terra_incognita', SG('heavy_gun_barrel'), [SG('heavy_gun_barrel'), SG('heavy_gun_barrel'), SG('heavy_gun_barrel'), SG('scorched_gun_frame'), SG('scorched_ingot'), SG('scorched_ingot'), SG('heavy_gun_parts'), SG('rapid_firing_unit'), SG('gun_grip')])

  // ---- Scorched Guns attachments ----
  removeAll(['reflex_sight', 'laser_sight', 'medium_scope', 'long_scope', 'light_stock', 'weighted_stock',
    'bump_stock', 'silencer', 'muzzle_brake', 'extended_barrel', 'light_grip', 'extended_mag', 'speed_mag',
    'plus_p_mag', 'anthralite_bayonet', 'diamond_bayonet', 'netherite_bayonet'])
  const ATT = (id, base, steps) => assemble(SG(id), base, steps, null, 'scguns/attachments')

  // Sights
  ATT('reflex_sight', 'create:iron_sheet', ['minecraft:glass_pane', 'minecraft:redstone', 'create:brass_nugget', 'PRESS'])
  ATT('laser_sight', 'create:brass_sheet', ['createaddition:copper_wire', 'minecraft:redstone', 'create:polished_rose_quartz', 'PRESS'])
  ATT('medium_scope', 'minecraft:spyglass', ['create:brass_sheet', 'minecraft:glass_pane', 'create:brass_nugget', 'PRESS'])
  ATT('long_scope', SG('medium_scope'), ['minecraft:spyglass', 'create:brass_sheet', 'minecraft:glass', 'PRESS'])

  // Stocks
  ATT('light_stock', SG('wooden_stock'), ['CUT', 'create:andesite_alloy', 'CUT'])
  ATT('weighted_stock', SG('wooden_stock'), ['create:iron_sheet', 'minecraft:iron_ingot', 'create:iron_sheet', 'PRESS'])
  ATT('bump_stock', SG('wooden_stock'), [SG('heavy_gun_parts'), 'createaddition:iron_wire', 'create:cogwheel', 'PRESS'])

  // Muzzle
  ATT('silencer', 'create:iron_sheet', ['#minecraft:wool', 'PRESS', 'create:iron_sheet', 'PRESS'])
  ATT('muzzle_brake', 'create:iron_sheet', ['minecraft:iron_nugget', 'CUT', 'CUT', 'PRESS'])
  ATT('extended_barrel', SG('gun_barrel'), ['createaddition:iron_rod', 'create:iron_sheet', 'PRESS', 'CUT'])

  // Grips
  ATT('light_grip', 'minecraft:stick', ['minecraft:leather', 'minecraft:iron_nugget', 'create:brass_nugget'])

  // Magazines
  ATT('extended_mag', SG('gun_magazine'), [SG('gun_magazine'), 'create:iron_sheet', 'createaddition:iron_wire', 'PRESS'])
  ATT('speed_mag', SG('gun_magazine'), ['minecraft:leather', 'createaddition:iron_wire', 'create:brass_nugget', 'PRESS'])
  ATT('plus_p_mag', SG('gun_magazine'), [SG('treated_iron_ingot'), 'createaddition:iron_wire', 'createaddition:iron_wire', 'PRESS'])

  // Bayonets
  ATT('anthralite_bayonet', SG('iron_bayonet'), [SG('treated_iron_ingot'), 'PRESS', 'CUT'])
  ATT('diamond_bayonet', SG('anthralite_bayonet'), ['minecraft:diamond', 'minecraft:diamond', 'CUT'])
  ATT('netherite_bayonet', SG('diamond_bayonet'), ['minecraft:netherite_ingot', 'PRESS', 'CUT'])

  // ---- Scorched Guns ammo ----
  const ammoItems = ['powder_and_ball', 'grapeshot', 'compact_copper_round', 'standard_copper_round', 'compact_advanced_round',
    'advanced_round', 'krahg_round', 'beowulf_round', 'gibbs_round', 'hog_round', 'ramrod_round', 'osborne_slug',
    'shotgun_shell', 'bearpack_shell', 'buckshot', 'nitro_buckshot', 'shotball', 'microjet', 'rocket', 'he_grenade_round',
    'shatter_round', 'shulkshot', 'frog_dart', 'needle', 'syringe', 'energy_cell', 'shock_cell', 'sculk_cell', 'blaze_fuel',
    'standard_bullet', 'hardened_bullet']
  const ammoParts = ['small_copper_casing', 'medium_copper_casing', 'small_brass_casing', 'medium_brass_casing',
    'large_brass_casing', 'small_iron_casing', 'small_diamond_steel_casing', 'medium_diamond_steel_casing',
    'shulker_casing', 'empty_cell', 'gunpowder_dust', 'nitro_powder', 'nitro_powder_dust', 'sheol', 'sheol_dust',
    'peal', 'peal_dust', 'plasma', 'plasma_nugget', 'flechette', 'pebbles', 'bullet_mold', 'small_casing_mold',
    'medium_casing_mold', 'large_casing_mold']
  const nonCreateTypes = sgMachines.concat(['minecraft:crafting_shaped', 'minecraft:crafting_shapeless',
    'minecraft:stonecutting', 'immersiveengineering:metal_press'])
  ammoItems.concat(ammoParts).forEach(id => nonCreateTypes.forEach(type => event.remove({ type: type, output: SG(id) })))
  // Old ore-based ammo recipes
  ;['create/sequenced_assembly/krahg_round', 'create/sheol_from_mixing', 'create/peal_from_mixing',
    'create/nitro_buckshot_from_mixing', 'create/nitro_powder_mixing', 'create/nitro_powder_from_mixing',
    'create/charging/plasma', 'create/charging/shock_cell']
    .forEach(id => event.remove({ id: 'scguns:' + id }))

  // Powder and charges
  C.mixing([Item.of(SG('sheol'), 10), CreateItem.of(Item.of(SG('sheol_dust')), 0.5)],
    ['create:cinder_flour', 'minecraft:blaze_powder', 'minecraft:gunpowder', 'minecraft:glowstone_dust'])
    .id('kubejs:scguns/ammo/sheol')
  C.mixing([Item.of(SG('peal'), 10), CreateItem.of(Item.of(SG('peal_dust')), 0.5)],
    ['create:cinder_flour', 'minecraft:sculk', 'minecraft:glowstone_dust', 'minecraft:charcoal'])
    .id('kubejs:scguns/ammo/peal')
  C.mixing([Item.of(SG('nitro_powder'), 10)],
    ['minecraft:gunpowder', SG('sheol'), SG('peal'), 'minecraft:netherite_scrap'])
    .heated().id('kubejs:scguns/ammo/nitro_powder')
  C.milling([Item.of(SG('nitro_powder_dust'), 3)], SG('nitro_powder')).id('kubejs:scguns/ammo/nitro_powder_dust')
  C.mixing([Item.of(SG('nitro_buckshot'), 5)],
    [SG('nitro_powder_dust'), SG('buckshot'), SG('buckshot'), 'create:cinder_flour'])
    .id('kubejs:scguns/ammo/nitro_buckshot')

  // Projectiles
  C.pressing([Item.of(SG('pebbles'), 4)], 'minecraft:gravel').id('kubejs:scguns/ammo/pebbles')
  C.mixing([Item.of(SG('powder_and_ball'), 2)], [SG('gunpowder_dust'), SG('pebbles'), 'minecraft:paper'])
    .id('kubejs:scguns/ammo/powder_and_ball')
  C.mixing([Item.of(SG('grapeshot'), 2)], [SG('gunpowder_dust'), SG('pebbles'), 'minecraft:stick'])
    .id('kubejs:scguns/ammo/grapeshot')
  C.cutting([Item.of(SG('shotball'), 3)], SG('treated_iron_ingot')).id('kubejs:scguns/ammo/shotball')
  C.cutting([Item.of(SG('flechette'), 4)], 'createaddition:iron_rod').id('kubejs:scguns/ammo/flechette')
  C.pressing([Item.of(SG('needle'), 9)], SG('flechette')).id('kubejs:scguns/ammo/needle')
  C.deploying([Item.of(SG('syringe'), 3)], ['create:iron_sheet', 'minecraft:glistering_melon_slice'])
    .id('kubejs:scguns/ammo/syringe')
  C.mixing(SG('blaze_fuel'), [SG('empty_tank'), 'minecraft:blaze_powder', 'minecraft:blaze_powder',
    'minecraft:blaze_powder', 'minecraft:blaze_powder']).id('kubejs:scguns/ammo/blaze_fuel')

  // Molds
  ;['bullet_mold', 'small_casing_mold', 'medium_casing_mold', 'large_casing_mold']
    .forEach(m => C.cutting(SG(m), SG('blank_mold')).id('kubejs:scguns/ammo/' + m))

  // KRAHG round
  const krahg = SG('unfinished_krahg_round')
  C.sequenced_assembly(SG('krahg_round'), SG('large_brass_casing'), [
    C.deploying(krahg, [krahg, SG('nitro_powder_dust')]),
    C.deploying(krahg, [krahg, Ingredient.of('#scguns:advanced_bullet_tips')]),
    C.pressing(krahg, krahg)
  ]).transitionalItem(krahg).loops(1).id('kubejs:scguns/ammo/krahg_round')

  // Tesla Coil charging
  charge('minecraft:redstone', SG('plasma'), 3200, 'scguns/ammo/plasma')
  charge(SG('empty_cell'), SG('shock_cell'), 1600, 'scguns/ammo/shock_cell')

  // ---- Boss gear helpers ----
  const CAT = id => 'cataclysm:' + id
  const LMO = id => 'legendary_monsters:' + id
  const mech = (result, pattern, key, prefix) =>
    C.mechanical_crafting(result, pattern, key).id('kubejs:' + prefix + '/' + result.split(':')[1])
  const swap = ids => ids.forEach(id => event.remove({ output: id }))
  const UPG = {
    helmet: ['SIS', 'SNS', ' T '],
    chestplate: ['SIS', 'XNX', 'STS'],
    leggings: ['SIS', 'SNS', 'STS'],
    boots: [' I ', 'SNS', 'STS'],
    tool: ['SIS', 'SNS', ' T ']
  }
  const upgrade = (result, base, slot, mat, sheet, extra, template, prefix) => {
    const pat = UPG[slot] || UPG.tool
    const key = { S: sheet, I: mat, N: base, T: template }
    if (pat.join('').indexOf('X') >= 0) key.X = extra || sheet
    mech(result, pat, key, prefix)
  }

  // ---- L_Ender's Cataclysm ----
  swap(['ancient_spear', 'black_steel_sword', 'black_steel_targe', 'azure_sea_shield', 'astrape', 'ceraunus',
    'bulwark_of_the_flame', 'blazing_grips', 'the_incinerator', 'soul_render', 'the_annihilator', 'cursed_bow',
    'laser_gatling', 'meat_shredder', 'wither_assault_shoulder_weapon', 'mechanical_fusion_anvil',
    'bone_reptile_helmet', 'bone_reptile_chestplate', 'bloom_stone_pauldrons', 'monstrous_helm',
    'ignitium_helmet', 'ignitium_chestplate', 'ignitium_leggings', 'ignitium_boots',
    'cursium_helmet', 'cursium_chestplate', 'cursium_leggings', 'cursium_boots'].map(CAT))

  // Ancient metal
  mech(CAT('ancient_spear'), [
    '  RR',
    ' ARR',
    ' SA ',
    'S   '
  ], { R: CAT('ancient_metal_ingot'), A: 'create:andesite_alloy', S: 'createaddition:iron_rod' }, 'cataclysm')

  mech(CAT('bone_reptile_helmet'), [
    'RAR',
    'NKN',
    'I I'
  ], { R: CAT('ancient_metal_ingot'), A: 'create:andesite_alloy', N: CAT('koboleton_bone'),
    K: CAT('kobolediator_skull'), I: 'create:iron_sheet' }, 'cataclysm')

  mech(CAT('bone_reptile_chestplate'), [
    'R   R',
    'INNNI',
    'RIAIR',
    ' INI '
  ], { R: CAT('ancient_metal_ingot'), N: CAT('koboleton_bone'), A: 'create:andesite_alloy',
    I: 'create:iron_sheet' }, 'cataclysm')

  // Black steel
  mech(CAT('black_steel_sword'), [
    ' B ',
    ' B ',
    'NIN',
    ' S '
  ], { B: CAT('black_steel_ingot'), N: CAT('black_steel_nugget'), I: 'create:iron_sheet',
    S: 'createaddition:iron_rod' }, 'cataclysm')

  mech(CAT('black_steel_targe'), [
    ' PIP ',
    'NABAN',
    ' PIP '
  ], { P: '#minecraft:planks', I: 'create:iron_sheet', N: CAT('black_steel_nugget'),
    A: 'create:andesite_alloy', B: CAT('black_steel_ingot') }, 'cataclysm')

  // Amethyst crab
  mech(CAT('bloom_stone_pauldrons'), [
    'S   S',
    'SCQCS',
    'SSQSS'
  ], { S: CAT('amethyst_crab_shell'), C: 'create:copper_sheet', Q: 'create:polished_rose_quartz' }, 'cataclysm')

  // Scylla
  mech(CAT('azure_sea_shield'), [
    'NGLGN',
    'LPXPL',
    'NGLGN'
  ], { N: 'minecraft:gold_nugget', G: 'create:golden_sheet', L: CAT('lacrima'),
    P: 'minecraft:prismarine_crystals', X: 'minecraft:gold_ingot' }, 'cataclysm')

  mech(CAT('astrape'), [
    '   LE',
    '  ECL',
    '  WL ',
    ' W   ',
    'R    '
  ], { L: CAT('lacrima'), E: CAT('essence_of_the_storm'), C: 'createaddition:capacitor',
    W: 'createaddition:copper_wire', R: 'createaddition:brass_rod' }, 'cataclysm')

  mech(CAT('ceraunus'), [
    'E L E',
    ' LCL ',
    '  W  ',
    '  R  ',
    '  R  '
  ], { E: CAT('essence_of_the_storm'), L: CAT('lacrima'), C: 'createaddition:capacitor',
    W: 'createaddition:copper_spool', R: 'createaddition:brass_rod' }, 'cataclysm')

  // Ignis
  mech(CAT('bulwark_of_the_flame'), [
    'NHQHN',
    'RTSTR',
    'NHQHN'
  ], { N: 'minecraft:nether_brick', H: 'create:brass_sheet', Q: CAT('ignitium_ingot'),
    R: 'minecraft:blaze_rod', T: 'create:sturdy_sheet', S: 'minecraft:shield' }, 'cataclysm')

  mech(CAT('blazing_grips'), [
    'NBN',
    'HQH',
    'NBN'
  ], { N: 'minecraft:nether_brick', B: 'minecraft:blaze_powder', H: 'create:brass_hand',
    Q: CAT('ignitium_ingot') }, 'cataclysm')

  mech(CAT('the_incinerator'), [
    '   BQ',
    '  BQB',
    ' TSB ',
    ' HT  ',
    'R    '
  ], { B: 'minecraft:blaze_rod', Q: CAT('ignitium_ingot'), T: 'create:sturdy_sheet',
    S: 'minecraft:netherite_sword', H: 'create:blaze_cake', R: 'createaddition:brass_rod' }, 'cataclysm')

  // Maledictus
  mech(CAT('soul_render'), [
    ' CCC',
    'T PB',
    ' TB ',
    '  S '
  ], { C: CAT('cursium_ingot'), T: 'create:sturdy_sheet', P: 'create:precision_mechanism',
    B: CAT('black_steel_ingot'), S: 'createaddition:iron_rod' }, 'cataclysm')

  mech(CAT('the_annihilator'), [
    'TCT',
    'TPT',
    ' C ',
    ' B ',
    ' S '
  ], { T: 'create:sturdy_sheet', C: CAT('cursium_ingot'), P: 'create:precision_mechanism',
    B: CAT('black_steel_ingot'), S: 'createaddition:iron_rod' }, 'cataclysm')

  mech(CAT('cursed_bow'), [
    ' TW',
    'C W',
    'BPW',
    'C W',
    ' TW'
  ], { T: 'create:sturdy_sheet', W: 'minecraft:string', C: CAT('cursium_ingot'),
    B: CAT('black_steel_ingot'), P: 'create:precision_mechanism' }, 'cataclysm')

  // Harbinger
  mech(CAT('laser_gatling'), [
    'IIIW ',
    'EPBCH',
    'IIIW ',
    '   S '
  ], { I: 'createaddition:iron_rod', W: CAT('witherite_ingot'), E: 'create:electron_tube',
    P: 'create:precision_mechanism', B: 'minecraft:redstone_block', C: 'createaddition:capacitor',
    H: 'create:sturdy_sheet', S: 'createaddition:brass_rod' }, 'cataclysm')

  mech(CAT('meat_shredder'), [
    '   SX',
    '  SIS',
    ' WPS ',
    'WH   '
  ], { S: 'create:sturdy_sheet', X: 'create:mechanical_saw', I: 'minecraft:iron_block',
    W: CAT('witherite_ingot'), P: 'create:precision_mechanism', H: 'createaddition:brass_rod' }, 'cataclysm')

  mech(CAT('wither_assault_shoulder_weapon'), [
    'WIIII',
    'GPBEG',
    'WIIII',
    '   H '
  ], { W: CAT('witherite_ingot'), I: 'create:iron_sheet', G: 'minecraft:gunpowder',
    P: 'create:precision_mechanism', B: 'minecraft:redstone_block', E: 'create:electron_tube',
    H: 'createaddition:brass_rod' }, 'cataclysm')

  mech(CAT('mechanical_fusion_anvil'), [
    'WWSWW',
    'BPAPB',
    'WCCCW'
  ], { W: CAT('witherite_ingot'), S: 'create:sturdy_sheet', B: 'minecraft:redstone_block',
    P: 'create:precision_mechanism', A: 'minecraft:anvil', C: 'create:brass_casing' }, 'cataclysm')

  // Armor upgrades
  ;['helmet', 'chestplate', 'leggings', 'boots'].forEach(p => {
    upgrade(CAT('ignitium_' + p), 'minecraft:netherite_' + p, p, CAT('ignitium_ingot'), 'create:brass_sheet',
      'create:blaze_cake', CAT('ignitium_upgrade_smithing_template'), 'cataclysm')
    upgrade(CAT('cursium_' + p), 'minecraft:netherite_' + p, p, CAT('cursium_ingot'), 'create:sturdy_sheet',
      'create:precision_mechanism', CAT('cursium_upgrade_smithing_template'), 'cataclysm')
  })
  upgrade(CAT('monstrous_helm'), 'minecraft:netherite_helmet', 'helmet', CAT('monstrous_horn'), 'create:sturdy_sheet',
    null, 'minecraft:netherite_upgrade_smithing_template', 'cataclysm')

  // ---- Legendary Monsters ----
  swap(['axe_of_lightning', 'wand_of_clouds', 'atmospheric_boots', 'golden_halbert', 'knights_sword',
    'dinosaur_bone_club', 'dinosaur_bone_shield', 'resurrected_javelin', 'shattered_greatsword', 'monstrous_anchor',
    'mossy_hammer', 'mossy_chestplate', 'the_great_frost', 'frostbitten_shield', 'chorus_blade', 'chorus_mask',
    'chorus_cannon', 'sand_cannon', 'blastproof_helmet', 'fiery_boots', 'fiery_jaw', 'withered_ribcage',
    'withered_scythe', 'void_sword', 'spiky_shield', 'shulker_helmet', 'shulker_shield',
    'enderitium_sword', 'enderitium_axe', 'enderitium_pickaxe', 'enderitium_shovel', 'enderitium_hoe',
    'annihilator_helmet', 'annihilator_chestplate', 'annihilator_leggings', 'annihilator_boots',
    'buckler_of_annihilation', 'the_tesseract', 'atom_splitter', 'ender_anchor'].map(LMO))

  // Knights
  mech(LMO('knights_sword'), [
    ' B ',
    ' B ',
    'NIN',
    ' S ',
    ' L '
  ], { B: LMO('knights_sword_blade_half'), N: 'minecraft:iron_nugget', I: 'create:iron_sheet',
    S: 'createaddition:iron_rod', L: 'minecraft:leather' }, 'legendary_monsters')

  mech(LMO('golden_halbert'), [
    ' GBG',
    '  LG',
    ' L  ',
    'H   '
  ], { G: 'create:golden_sheet', B: 'minecraft:gold_block', L: LMO('long_stick_half'),
    H: 'createaddition:gold_rod' }, 'legendary_monsters')

  mech(LMO('resurrected_javelin'), [
    '  NM',
    ' AMN',
    ' SA ',
    'S   '
  ], { N: 'minecraft:iron_nugget', M: LMO('metal_debris'), A: 'create:andesite_alloy',
    S: 'createaddition:iron_rod' }, 'legendary_monsters')

  mech(LMO('shattered_greatsword'), [
    ' M ',
    ' M ',
    'NIN',
    ' S ',
    ' L '
  ], { M: LMO('metal_debris'), N: 'minecraft:iron_nugget', I: 'create:iron_sheet',
    S: 'createaddition:iron_rod', L: 'minecraft:leather' }, 'legendary_monsters')

  // Skeletosaurus
  mech(LMO('dinosaur_bone_club'), [
    ' D ',
    'NDN',
    ' S ',
    ' L '
  ], { D: LMO('dinosaur_bone'), N: 'create:andesite_alloy', S: 'createaddition:iron_rod',
    L: 'minecraft:leather' }, 'legendary_monsters')

  mech(LMO('dinosaur_bone_shield'), [
    'IDI',
    'ADA',
    'IAI',
    ' I '
  ], { I: 'create:iron_sheet', D: LMO('dinosaur_bone'), A: 'create:andesite_alloy' }, 'legendary_monsters')

  // Ancient Guardian
  mech(LMO('monstrous_anchor'), [
    ' C ',
    ' H ',
    'ABA',
    'I I'
  ], { C: 'minecraft:chain', H: LMO('anchor_handle'), A: 'create:andesite_alloy',
    B: 'minecraft:iron_block', I: 'create:iron_sheet' }, 'legendary_monsters')

  // Ambusher / Spiky Worm
  mech(LMO('spiky_shield'), [
    'NAN',
    'MSC',
    'NIN'
  ], { N: 'create:andesite_alloy', A: LMO('ancient_spike'), M: LMO('molten_metal_ingot'),
    S: 'minecraft:shield', C: LMO('chiseled_ancient_dripstone_shard'), I: 'create:iron_sheet' }, 'legendary_monsters')

  // Overgrown Colossus
  mech(LMO('mossy_hammer'), [
    'KMK',
    'KEK',
    'ASA',
    ' S '
  ], { K: 'minecraft:chiseled_stone_bricks', M: 'minecraft:moss_block', E: LMO('nature_crystal'),
    A: 'create:andesite_alloy', S: 'createaddition:iron_rod' }, 'legendary_monsters')

  mech(LMO('mossy_chestplate'), [
    'M M',
    'KEK',
    'ABA',
    'KIK'
  ], { M: 'minecraft:moss_block', K: 'minecraft:chiseled_stone_bricks', E: LMO('nature_crystal'),
    A: 'create:andesite_alloy', B: 'minecraft:iron_block', I: 'create:iron_sheet' }, 'legendary_monsters')

  // Cloud Golem
  mech(LMO('axe_of_lightning'), [
    'IA ',
    'IWI',
    ' S ',
    ' S '
  ], { I: 'create:iron_sheet', A: LMO('air_rune'), W: 'createaddition:copper_spool',
    S: 'createaddition:iron_rod' }, 'legendary_monsters')

  mech(LMO('wand_of_clouds'), [
    ' A ',
    'GRG',
    ' S ',
    ' I '
  ], { A: LMO('air_rune'), G: 'create:golden_sheet', R: LMO('cloud_rod'),
    S: 'createaddition:gold_rod', I: 'minecraft:iron_ingot' }, 'legendary_monsters')

  mech(LMO('atmospheric_boots'), [
    'DAD',
    'C C',
    'P P'
  ], { D: 'minecraft:diamond', A: LMO('air_rune'), C: LMO('cloud_rod'), P: 'create:propeller' }, 'legendary_monsters')

  // Frostbitten Golem
  mech(LMO('the_great_frost'), [
    ' B ',
    'PRP',
    'ISI',
    ' T '
  ], { B: 'minecraft:blue_ice', P: LMO('primal_ice_shard'), R: LMO('frozen_rune'),
    I: 'create:iron_sheet', S: 'minecraft:iron_sword', T: 'createaddition:iron_rod' }, 'legendary_monsters')

  mech(LMO('frostbitten_shield'), [
    'BRB',
    'PSP',
    'IBI'
  ], { B: 'minecraft:blue_ice', R: LMO('frozen_rune'), P: LMO('primal_ice_shard'),
    S: 'minecraft:shield', I: 'create:iron_sheet' }, 'legendary_monsters')

  // Dune Sentinel / Bomber
  mech(LMO('sand_cannon'), [
    'ISSIG',
    'ACPAG',
    'ISSIG',
    '   R '
  ], { I: 'create:iron_sheet', S: LMO('ancient_sandstone_shard'), G: 'minecraft:gunpowder',
    A: 'create:andesite_alloy', C: LMO('crystal_of_sandstorm'), P: 'create:precision_mechanism',
    R: 'createaddition:iron_rod' }, 'legendary_monsters')

  mech(LMO('blastproof_helmet'), [
    'STS',
    'SCS',
    'G G'
  ], { S: LMO('ancient_sandstone_shard'), T: 'create:sturdy_sheet', C: LMO('crystal_of_sandstorm'),
    G: 'create:golden_sheet' }, 'legendary_monsters')

  // Chorusent / Choruslings
  mech(LMO('chorus_blade'), [
    ' C ',
    'FPF',
    'ISI',
    ' T '
  ], { C: LMO('chorus_crystal'), F: LMO('infected_chorus_fruit'), P: 'minecraft:ender_pearl',
    I: 'create:iron_sheet', S: 'minecraft:iron_sword', T: 'createaddition:iron_rod' }, 'legendary_monsters')

  mech(LMO('chorus_mask'), [
    'FIF',
    'GCG',
    'F F'
  ], { F: 'minecraft:chorus_fruit', I: LMO('infected_chorus_fruit'), G: 'create:golden_sheet',
    C: LMO('chorus_crystal') }, 'legendary_monsters')

  mech(LMO('chorus_cannon'), [
    '  C',
    'FBF',
    'GP '
  ], { C: LMO('chorus_crystal'), F: LMO('infected_chorus_fruit'), B: LMO('sand_cannon'),
    G: 'minecraft:gold_ingot', P: 'create:precision_mechanism' }, 'legendary_monsters')

  // Lava Eater
  mech(LMO('fiery_boots'), [
    'L L',
    'B B',
    'M M'
  ], { L: LMO('lava_eaters_skin'), B: 'create:brass_sheet', M: 'minecraft:magma_cream' }, 'legendary_monsters')

  mech(LMO('fiery_jaw'), [
    'KKK',
    'LCL',
    'HMH',
    ' L '
  ], { K: 'minecraft:blackstone', L: LMO('lava_eaters_skin'), C: 'create:blaze_cake',
    H: 'create:brass_sheet', M: 'minecraft:magma_block' }, 'legendary_monsters')

  // Withered Abomination
  mech(LMO('withered_ribcage'), [
    'H H',
    'IBI',
    'IBI'
  ], { H: LMO('withered_horn'), I: 'create:iron_sheet', B: LMO('withered_bone') }, 'legendary_monsters')

  mech(LMO('withered_scythe'), [
    ' HHT',
    'GP  ',
    ' B  ',
    ' B  '
  ], { H: LMO('withered_horn'), T: 'create:golden_sheet', G: 'minecraft:gold_block',
    P: 'create:precision_mechanism', B: LMO('withered_bone') }, 'legendary_monsters')

  mech(LMO('void_sword'), [
    ' G ',
    'TGT',
    ' B '
  ], { G: LMO('void_gem'), T: 'create:sturdy_sheet', B: LMO('withered_bone') }, 'legendary_monsters')

  // Shulker Mimic
  mech(LMO('shulker_helmet'), [
    'DTD',
    'DSD',
    'B B'
  ], { D: 'minecraft:diamond', T: 'create:sturdy_sheet', S: LMO('large_shulker_shell'),
    B: 'create:brass_sheet' }, 'legendary_monsters')

  mech(LMO('shulker_shield'), [
    'ESE',
    'IPI',
    'EIE',
    ' E '
  ], { E: 'minecraft:end_stone', S: LMO('large_shulker_shell'), I: 'create:iron_sheet',
    P: 'minecraft:shulker_shell' }, 'legendary_monsters')

  // Enderitium tools
  const END = LMO('enderitium_ingot')
  ;['sword', 'axe', 'pickaxe', 'shovel', 'hoe'].forEach(t =>
    upgrade(LMO('enderitium_' + t), 'minecraft:diamond_' + t, 'tool', END, 'create:sturdy_sheet',
      null, LMO('enderitium_upgrade_smithing_template'), 'legendary_monsters'))

  // Obliterator / Annihilation Pursuer
  const PSH = LMO('portal_shard')
  ;['helmet', 'chestplate', 'leggings', 'boots'].forEach(p =>
    upgrade(LMO('annihilator_' + p), 'minecraft:netherite_' + p, p, PSH, 'create:sturdy_sheet',
      LMO('enderitium_gem'), LMO('annihilator_upgrade_smithing_template'), 'legendary_monsters'))
  mech(LMO('buckler_of_annihilation'), [
    ' GTG ',
    'GNCNG',
    ' GTG '
  ], { G: LMO('enderitium_gem'), T: 'create:sturdy_sheet', N: 'minecraft:end_stone',
    C: LMO('eye_crystal') }, 'legendary_monsters')

  mech(LMO('the_tesseract'), [
    ' G ',
    'PEP',
    'TCT',
    ' E '
  ], { G: LMO('bottle_of_annihilation'), P: PSH, E: END, T: 'create:sturdy_sheet',
    C: 'create:precision_mechanism' }, 'legendary_monsters')

  mech(LMO('atom_splitter'), [
    '  GG ',
    'RPPCT',
    '  EH '
  ], { G: LMO('bottle_of_annihilation'), R: 'minecraft:end_rod', P: PSH, C: 'create:precision_mechanism',
    T: 'create:sturdy_sheet', E: END, H: 'createaddition:brass_rod' }, 'legendary_monsters')

  mech(LMO('ender_anchor'), [
    'GEG',
    'iPi',
    'iOi',
    ' O '
  ], { G: LMO('bottle_of_annihilation'), E: 'minecraft:ender_eye', i: END, P: 'create:sturdy_sheet',
    O: 'minecraft:end_stone' }, 'legendary_monsters')

  // ---- Advanced Netherite ----
  const ADN = id => 'advancednetherite:' + id
  const anTiers = [
    { t: 'iron', prev: 'minecraft:netherite_ingot', mat: 'minecraft:iron_ingot', add: 'create:cinder_flour', heat: 'heated', sheet: 'create:iron_sheet', extra: 'create:iron_sheet' },
    { t: 'gold', prev: ADN('netherite_iron_ingot'), mat: 'minecraft:gold_ingot', add: 'minecraft:blaze_powder', heat: 'heated', sheet: 'create:golden_sheet', extra: 'create:golden_sheet' },
    { t: 'emerald', prev: ADN('netherite_gold_ingot'), mat: 'minecraft:emerald', add: 'create:powdered_obsidian', heat: 'superheated', sheet: 'create:brass_sheet', extra: 'create:precision_mechanism' },
    { t: 'diamond', prev: ADN('netherite_emerald_ingot'), mat: 'minecraft:diamond', add: 'createaddition:diamond_grit', heat: 'superheated', sheet: 'create:sturdy_sheet', extra: 'create:precision_mechanism' }
  ]
  const anParts = ['helmet', 'chestplate', 'leggings', 'boots', 'sword', 'pickaxe', 'axe', 'shovel', 'hoe']
  const anArmor = ['helmet', 'chestplate', 'leggings', 'boots']
  const NTP = 'minecraft:netherite_upgrade_smithing_template'

  anTiers.forEach((tier, i) => {
    const ingot = ADN('netherite_' + tier.t + '_ingot')
    event.remove({ id: ingot })

    // Ingot
    const mix = C.mixing(ingot, [tier.prev, tier.mat, tier.mat, tier.mat, tier.mat, tier.add])
    ;(tier.heat === 'superheated' ? mix.superheated() : mix.heated()).id('kubejs:advancednetherite/' + tier.t + '_ingot')

    // Gear
    anParts.forEach(p => {
      event.remove({ id: ADN('netherite_' + tier.t + '_' + p + '_smithing') })
      const base = i === 0 ? 'minecraft:netherite_' + p : ADN('netherite_' + anTiers[i - 1].t + '_' + p)
      upgrade(ADN('netherite_' + tier.t + '_' + p), base, anArmor.indexOf(p) >= 0 ? p : 'tool',
        ingot, tier.sheet, tier.extra, NTP, 'advancednetherite')
    })
  })

  // ---- Ad Astra ----
  const AA = id => 'ad_astra:' + id
  swap(['tier_1_rocket', 'tier_2_rocket', 'tier_3_rocket', 'tier_4_rocket', 'nasa_workbench', 'rocket_nose_cone',
    'steel_engine', 'desh_engine', 'ostrum_engine', 'calorite_engine', 'steel_tank', 'desh_tank', 'ostrum_tank', 'calorite_tank',
    'space_helmet', 'space_suit', 'space_pants', 'space_boots',
    'netherite_space_helmet', 'netherite_space_suit', 'netherite_space_pants', 'netherite_space_boots',
    'jet_suit_helmet', 'jet_suit', 'jet_suit_pants', 'jet_suit_boots',
    'tier_1_rover', 'launch_pad', 'compressor', 'fuel_refinery', 'oxygen_loader'].map(AA))
  event.remove({ type: 'ad_astra:nasa_workbench' })

  // Steel
  C.mixing(AA('steel_ingot'), ['minecraft:iron_ingot', '#minecraft:coals']).heated().id('kubejs:ad_astra/steel_ingot')

  // Rocket parts
  mech(AA('rocket_nose_cone'), [
    '  L  ',
    ' SES ',
    'SSTSS'
  ], { L: 'minecraft:lightning_rod', S: AA('steel_plate'), E: 'create:electron_tube', T: 'create:sturdy_sheet' }, 'ad_astra')

  const aaTiers = [
    { t: 'steel', engine: AA('engine_frame'), tank: AA('gas_tank') },
    { t: 'desh', engine: AA('steel_engine'), tank: AA('steel_tank') },
    { t: 'ostrum', engine: AA('desh_engine'), tank: AA('desh_tank') },
    { t: 'calorite', engine: AA('ostrum_engine'), tank: AA('ostrum_tank') }
  ]
  aaTiers.forEach((tier, i) => {
    const plate = AA(tier.t + '_plate')

    mech(AA(tier.t + '_engine'), [
      'PPPPP',
      'PMEMP',
      'PCFCP',
      ' N N '
    ], { P: plate, M: 'create:precision_mechanism', E: tier.engine, C: 'create:fluid_pipe',
      F: AA('fan'), N: 'create:nozzle' }, 'ad_astra')

    mech(AA(tier.t + '_tank'), [
      'PRP',
      'PTP',
      'PKP'
    ], { P: plate, R: AA('steel_rod'), T: tier.tank, K: 'create:fluid_tank' }, 'ad_astra')

    mech(AA('tier_' + (i + 1) + '_rocket'), [
      '  N  ',
      ' BMB ',
      ' BTB ',
      'FBTBF',
      'F E F'
    ], { N: AA('rocket_nose_cone'), B: AA(tier.t + '_block'), M: 'create:precision_mechanism',
      T: AA(tier.t + '_tank'), F: AA('rocket_fin'), E: AA(tier.t + '_engine') }, 'ad_astra')
  })

  // Space suit
  mech(AA('space_helmet'), [
    'SSS',
    'SGS',
    'C C'
  ], { S: AA('steel_plate'), G: 'minecraft:glass_pane', C: 'create:copper_sheet' }, 'ad_astra')
  mech(AA('space_suit'), [
    'S S',
    'TOT',
    'SKS',
    'WWW'
  ], { S: AA('steel_plate'), T: AA('gas_tank'), O: AA('oxygen_gear'), K: 'create:copper_backtank',
    W: '#minecraft:wool' }, 'ad_astra')
  mech(AA('space_pants'), [
    'SSS',
    'WCW',
    'S S'
  ], { S: AA('steel_plate'), W: '#minecraft:wool', C: 'create:copper_sheet' }, 'ad_astra')
  mech(AA('space_boots'), [
    'W W',
    'S S',
    'C C'
  ], { W: '#minecraft:wool', S: AA('steel_plate'), C: 'create:copper_sheet' }, 'ad_astra')

  // Netherite space suit
  mech(AA('netherite_space_helmet'), [
    'OOO',
    'ONO',
    'DGD'
  ], { O: AA('ostrum_plate'), N: 'minecraft:netherite_helmet', D: AA('desh_plate'), G: 'minecraft:glass' }, 'ad_astra')
  mech(AA('netherite_space_suit'), [
    'O O',
    'TGT',
    'ONO',
    'DKD'
  ], { O: AA('ostrum_plate'), T: AA('large_gas_tank'), G: AA('oxygen_gear'), N: 'minecraft:netherite_chestplate',
    D: AA('desh_plate'), K: 'create:netherite_backtank' }, 'ad_astra')
  mech(AA('netherite_space_pants'), [
    'ONO',
    'DTD',
    'O O'
  ], { O: AA('ostrum_plate'), N: 'minecraft:netherite_leggings', D: AA('desh_plate'), T: 'create:sturdy_sheet' }, 'ad_astra')
  mech(AA('netherite_space_boots'), [
    'ONO',
    'D D',
    'T T'
  ], { O: AA('ostrum_plate'), N: 'minecraft:netherite_boots', D: AA('desh_plate'), T: 'create:sturdy_sheet' }, 'ad_astra')

  // Jet suit
  mech(AA('jet_suit_helmet'), [
    'CNC',
    'CGC',
    'E E'
  ], { C: AA('calorite_plate'), N: AA('netherite_space_helmet'), G: 'minecraft:tinted_glass',
    E: 'create:electron_tube' }, 'ad_astra')
  mech(AA('jet_suit'), [
    'CPC',
    'TNT',
    'KEK',
    'C C'
  ], { C: AA('calorite_plate'), P: 'create:precision_mechanism', T: AA('calorite_tank'),
    N: AA('netherite_space_suit'), K: AA('etrionic_capacitor'), E: AA('calorite_engine') }, 'ad_astra')
  mech(AA('jet_suit_pants'), [
    'BNB',
    'CPC',
    'C C'
  ], { B: AA('calorite_block'), N: AA('netherite_space_pants'), C: AA('calorite_plate'),
    P: 'create:precision_mechanism' }, 'ad_astra')
  mech(AA('jet_suit_boots'), [
    ' N ',
    'CPC',
    'B B'
  ], { N: AA('netherite_space_boots'), C: AA('calorite_plate'), P: 'create:precision_mechanism',
    B: AA('calorite_block') }, 'ad_astra')

  // Rover
  mech(AA('tier_1_rover'), [
    'R  D ',
    'SHEGS',
    'WPPPW'
  ], { R: AA('steel_rod'), D: AA('desh_block'), S: 'create:sturdy_sheet', H: AA('radio'), E: AA('desh_engine'),
    G: AA('large_gas_tank'), W: AA('wheel'), P: AA('desh_plate') }, 'ad_astra')

  // Machines
  mech(AA('launch_pad'), [
    'SRS',
    'RCR',
    'SRS'
  ], { S: AA('steel_plate'), R: AA('steel_rod'), C: 'create:railway_casing' }, 'ad_astra')
  mech(AA('compressor'), [
    'ISI',
    'PKP',
    'ICI'
  ], { I: 'create:iron_sheet', S: 'create:shaft', P: 'minecraft:piston', K: 'create:mechanical_press',
    C: 'create:andesite_casing' }, 'ad_astra')
  mech(AA('fuel_refinery'), [
    'SPS',
    'TBT',
    'SCS'
  ], { S: AA('steel_plate'), P: 'create:mechanical_pump', T: 'create:fluid_tank', B: 'create:blaze_burner',
    C: 'create:copper_casing' }, 'ad_astra')
  mech(AA('oxygen_loader'), [
    'SFS',
    'GLG',
    'SPS',
    ' R '
  ], { S: AA('steel_plate'), F: AA('fan'), G: AA('gas_tank'), L: 'minecraft:lightning_rod',
    P: 'create:mechanical_pump', R: 'minecraft:redstone_block' }, 'ad_astra')

  // ---- Refined Storage ----
  event.remove({ id: 'refinedstorage:controller' })
  mech('refinedstorage:controller', [
    ' EBE ',
    'EPAPE',
    'SSMSS',
    'EPAPE',
    ' EBE '
  ], { E: 'refinedstorage:quartz_enriched_iron', B: 'create:brass_casing', P: 'create:precision_mechanism',
    A: 'refinedstorage:advanced_processor', S: 'refinedstorage:silicon', M: 'refinedstorage:machine_casing' }, 'refinedstorage')

  // ---- Create Crafts & Additions ----
  event.remove({ id: 'createaddition:mechanical_crafting/electric_motor' })
  event.remove({ id: 'createaddition:mechanical_crafting/alternator' })
  mech('createaddition:electric_motor', [
    '  E  ',
    ' BSB ',
    'BSRSB',
    ' BCB '
  ], { E: 'create:electron_tube', B: '#c:plates/brass', S: 'createaddition:copper_spool', R: '#c:rods/iron',
    C: 'createaddition:capacitor' }, 'createaddition')
  mech('createaddition:alternator', [
    '  A  ',
    ' ISI ',
    'ISRSI',
    ' ISI ',
    '  C  '
  ], { A: 'create:andesite_alloy', I: '#c:plates/iron', S: 'createaddition:copper_spool', R: '#c:rods/iron',
    C: 'createaddition:capacitor' }, 'createaddition')
  // ---- Deeper and Darker ----
  const DD = id => 'deeperdarker:' + id
  const cfx = (type, id, ingredients, results, extra) => {
    const json = { type: 'create:' + type, ingredients: ingredients, results: results }
    if (extra) Object.keys(extra).forEach(k => { json[k] = extra[k] })
    event.custom(json).id('kubejs:deeperdarker/' + id)
  }
  const out = (id, count, chance) => {
    const o = { id: id }
    if (count && count > 1) o.count = count
    if (chance) o.chance = chance
    return o
  }

  // Ore crushing
  const ORES = {
    coal: ['minecraft:coal', 2, 0.25, 1],
    copper: ['create:crushed_raw_copper', 7, 0.25, 1],
    iron: ['create:crushed_raw_iron', 2, 0.25, 1],
    gold: ['create:crushed_raw_gold', 2, 0.25, 2],
    redstone: ['minecraft:redstone', 7, 0.5, 1],
    lapis: ['minecraft:lapis_lazuli', 12, 0.5, 1],
    diamond: ['minecraft:diamond', 2, 0.25, 1],
    emerald: ['minecraft:emerald', 2, 0.25, 1]
  }
  Object.keys(ORES).forEach(ore => {
    const o = ORES[ore]
    ;[['sculk_stone', DD('cobbled_sculk_stone')], ['gloomslate', DD('cobbled_gloomslate')]].forEach(st => {
      const res = [out(o[0], o[1]), out(o[0], 1, o[2]), out('create:experience_nugget', o[3], 0.75), out(st[1], 1, 0.125)]
      if (st[0] === 'sculk_stone') res.push(out('create_deep_dark:sculk_flour', 1, 0.1))
      cfx('crushing', st[0] + '_' + ore + '_ore', [{ item: DD(st[0] + '_' + ore + '_ore') }], res,
        { processing_time: ore === 'diamond' || ore === 'emerald' ? 450 : 350 })
    })
  })

  // Stone crushing
  cfx('crushing', 'cobbled_sculk_stone', [{ item: DD('cobbled_sculk_stone') }],
    [out('minecraft:gravel'), out('create_deep_dark:sculk_flour', 1, 0.25), out('create:experience_nugget', 1, 0.1)],
    { processing_time: 250 })
  cfx('crushing', 'cobbled_gloomslate', [{ item: DD('cobbled_gloomslate') }],
    [out('minecraft:gravel'), out('minecraft:flint', 1, 0.1), out('create:experience_nugget', 1, 0.1)],
    { processing_time: 250 })

  // Sawing
  ;[['echo_log', 'stripped_echo_log'], ['echo_wood', 'stripped_echo_wood'],
    ['blooming_stem', 'stripped_blooming_stem']].forEach(w => {
    cfx('cutting', w[0], [{ item: DD(w[0]) }], [out(DD(w[1]))], { processing_time: 50 })
  })
  ;[['stripped_echo_log', 'echo_planks'], ['stripped_echo_wood', 'echo_planks'],
    ['stripped_blooming_stem', 'bloom_planks']].forEach(w => {
    cfx('cutting', w[0], [{ item: DD(w[0]) }], [out(DD(w[1]), 6)], { processing_time: 50 })
  })

  // Soul dust
  cfx('milling', 'soul_dust', [{ item: DD('soul_crystal') }],
    [out(DD('soul_dust'), 3), out(DD('soul_dust'), 1, 0.25)], { processing_time: 150 })

  // Reinforced echo shard
  event.remove({ id: DD('reinforced_echo_shard') })
  cfx('mixing', 'reinforced_echo_shard', [
    { item: 'minecraft:echo_shard' },
    { item: DD('warden_carapace') }, { item: DD('warden_carapace') },
    { item: 'minecraft:phantom_membrane' }, { item: 'minecraft:phantom_membrane' },
    { type: 'neoforge:single', amount: 100, fluid: 'create_deep_dark:molten_echo' }
  ], [out(DD('reinforced_echo_shard'))], { heat_requirement: 'heated' })

  // Warden gear
  const DDARMOR = ['helmet', 'chestplate', 'leggings', 'boots']
  const DDTOOLS = ['sword', 'pickaxe', 'axe', 'shovel', 'hoe']
  swap(DDARMOR.concat(DDTOOLS).map(p => DD('warden_' + p)))
  swap(DDARMOR.concat(DDTOOLS).map(p => DD('resonarium_' + p)))
  DDARMOR.concat(DDTOOLS).forEach(p => {
    const slot = DDARMOR.indexOf(p) >= 0 ? p : 'tool'
    if (slot === 'tool') upgrade(DD('warden_' + p), 'minecraft:netherite_' + p, slot, DD('reinforced_echo_shard'),
      'create_deep_dark:echo_ingot', DD('warden_carapace'), DD('warden_upgrade_smithing_template'), 'deeperdarker')
    upgrade(DD('resonarium_' + p), 'minecraft:diamond_' + p, slot, DD('resonarium_plate'),
      'create:sturdy_sheet', DD('resonarium'), DD('resonarium_upgrade_smithing_template'), 'deeperdarker')
  })

  // Warden armor
  const WKEY = n => ({
    N: 'minecraft:netherite_' + n, C: DD('warden_carapace'), R: DD('reinforced_echo_shard'),
    E: 'create_deep_dark:echo_ingot', S: 'create:sturdy_sheet', A: 'minecraft:echo_shard',
    T: DD('warden_upgrade_smithing_template'), K: 'minecraft:sculk_catalyst',
    H: DD('heart_of_the_deep'), P: 'create:precision_mechanism'
  })
  const WPAT = {
    helmet: [
      ' CRC ',
      'SENES',
      'A T A'
    ],
    chestplate: [
      'SC CS',
      'EKHKE',
      'SRNRS',
      ' ATA '
    ],
    leggings: [
      'SERES',
      'C N C',
      'P T P'
    ],
    boots: [
      '  N  ',
      'SCRCS',
      'E T E'
    ]
  }
  DDARMOR.forEach(p => {
    const key = WKEY(p)
    const used = {}
    WPAT[p].join('').split('').forEach(ch => { if (ch !== ' ') used[ch] = key[ch] })
    mech(DD('warden_' + p), WPAT[p], used, 'deeperdarker')
  })

  // Otherside gear
  swap([DD('sonorous_staff'), DD('soul_elytra')])
  mech(DD('sonorous_staff'), [
    '  CH',
    ' BEC',
    ' B  ',
    'B   '
  ], { C: DD('soul_crystal'), H: DD('heart_of_the_deep'), B: DD('sculk_bone'),
    E: 'create_deep_dark:echo_ingot' }, 'deeperdarker')
  mech(DD('soul_elytra'), [
    'D C D',
    'BBLBB',
    ' P P '
  ], { D: DD('soul_dust'), C: DD('soul_crystal'), B: DD('sculk_bone'), L: 'minecraft:elytra',
    P: 'minecraft:phantom_membrane' }, 'deeperdarker')

  // ---- Darker Magic ----
  const DM = id => 'darkermagic:' + id
  const ECHO = 'create_deep_dark:echo_ingot'
  const RES = 'deeperdarker:reinforced_echo_shard'
  const WUT = 'deeperdarker:warden_upgrade_smithing_template'
  swap(['warden_mage_helmet', 'warden_mage_chestplate', 'warden_mage_leggings', 'warden_mage_boots',
    'volume_of_the_deep', 'warden_stick', 'whisper_staff'].map(DM))

  ;['helmet', 'chestplate', 'leggings', 'boots'].forEach(p => {
    upgrade(DM('warden_mage_' + p), 'irons_spellbooks:netherite_mage_' + p, p, RES, ECHO,
      'deeperdarker:warden_carapace', WUT, 'darkermagic')
  })
  upgrade(DM('volume_of_the_deep'), 'irons_spellbooks:netherite_spell_book', 'tool', RES, ECHO,
    null, WUT, 'darkermagic')

  mech(DM('warden_stick'), [
    '  C',
    ' E ',
    'E  '
  ], { C: 'deeperdarker:warden_carapace', E: ECHO }, 'darkermagic')

  mech(DM('whisper_staff'), [
    '   KR',
    '  KCK',
    '  EK ',
    ' W   ',
    'P    '
  ], { R: RES, K: 'minecraft:echo_shard', C: 'minecraft:sculk_catalyst', E: ECHO,
    W: DM('warden_stick'), P: 'irons_spellbooks:weapon_parts' }, 'darkermagic')
})
