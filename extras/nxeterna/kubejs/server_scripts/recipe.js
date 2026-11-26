ServerEvents.recipes(event => {

    //mods recipe delete 
    event.remove({ mod: 'endrem' })
    event.remove({ mod: 'armoroftheages' })
    event.remove({ mod: 'yo_hooks' })
    event.remove({ mod: 'clockwork' })
    //explore item recipe delete
    event.remove({ output: 'explorerscompass:explorerscompass' })
    event.remove({ output: 'fantasy_armor:moon_crystal' })
    event.remove({ output: 'fantasy_weapons:blazing_stone' })
    //artifice recipe delete
    event.remove({ output: 'irons_artifice:flintlock' })
    event.remove({ output: 'irons_artifice:musket' })
    event.remove({ output: 'irons_artifice:blunderbuss' })
    event.remove({ output: 'irons_artifice:blackpowder_revolver' })
    event.remove({ output: 'irons_artifice:six_shooter' })
    event.remove({ output: 'irons_artifice:arquebus' })
    //celestisynth recipe delete
    event.remove({ output: 'simplyswords:contained_remnant'})
    event.remove({ output: 'celestisynth:celestial_crafting_table'})
    event.remove({ output: 'celestisynth:starlit_factory'})
    event.remove({ id: 'celestisynth:solar_crystal_helmet' })
    event.remove({ id: 'celestisynth:solar_crystal_chestplate' })
    event.remove({ id: 'celestisynth:solar_crystal_leggings' })
    event.remove({ id: 'celestisynth:solar_crystal_boots' })
    event.remove({ id: 'celestisynth:lunar_stone_helmet' })
    event.remove({ id: 'celestisynth:lunar_stone_chestplate' })
    event.remove({ id: 'celestisynth:lunar_stone_leggings' })
    event.remove({ id: 'celestisynth:lunar_stone_boots' })


    // 1. Explorer's Compass
    event.shaped(
        'explorerscompass:explorerscompass',
        [
            'ABA',
            'BCB',
            'ABA'
        ],
        {
            A: 'minecraft:iron_block',
            B: 'advancednetherite:netherite_iron_ingot',
            C: 'minecraft:compass'
        }
    )

    // 2. Simply Swords
    event.shaped(
        'simplyswords:empowered_remnant',
        [
            'CBC',
            'BAB',
            'CBC'
        ],
        {
            A: 'runes:fire_stone',
            B: 'minecraft:diamond',
            C: 'minecraft:iron_ingot'
        }
    )

    event.shaped(
        'simplyswords:contained_remnant',
        [
            'CAC',
            'BAB',
            'CAC'
        ],
        {
            A: 'simplyswords:empowered_remnant',
            B: 'runes:soul_stone',
            C: 'minecraft:iron_ingot'
        }
    )

    event.shaped(
        'simplyswords:tampered_remnant',
        [
            'CAC',
            'BAB',
            'CAC'
        ],
        {
            A: 'simplyswords:empowered_remnant',
            B: 'runes:lightning_stone',
            C: 'minecraft:diamond'
        }
    )
    event.shaped(
        'simplyswords:brimstone_claymore',
        [
            '  A',
            'CA ',
            'BC '
        ],
        {
            A: 'runes:fire_stone',
            B: 'minecraft:stick',
            C: 'simplyswords:contained_remnant'
        }
    )
    event.shaped(
        'simplyswords:watcher_claymore',
        [
            '  D',
            'CA ',
            'BC '
        ],
        {
            A: 'runes:arcane_stone',
            B: 'minecraft:stick',
            C: 'simplyswords:tampered_remnant',
            D:'hazennstuff:zenalite_ingot'
        }
    )
    event.shaped(
        'simplyswords:storms_edge',
        [
            ' CB',
            'CAC',
            'BC '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'simplyswords:stormbringer',
        [
            '  A',
            'CA ',
            'BC '
        ],
        {
            A: 'simplyswords:tampered_remnant',
            B: 'minecraft:stick',
            C: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'simplyswords:sword_on_a_stick',
        [
            ' C ',              
            ' B ',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'runes:lightning_stone'
        }
    )
    event.shaped(
        'simplyswords:bramblethorn',
        [
            ' C ',            
            ' B ',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'minecraft:string',
            C: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'simplyswords:watching_warglaive',
        [
            ' A ',            
            'B  ',
            ' A '
        ],
        {
            A: 'simplyswords:contained_remnant',
            B: 'runes:arcane_stone'
        }
    )
    event.shaped(
        'simplyswords:toxic_longsword',
        [
            '  D',            
            'BC ',
            'AB '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:contained_remnant',
            C: 'runes:healing_stone',
            D:  'hazennstuff:chlorophyte_ingot'
        }
    )
    event.shaped(
        'simplyswords:emberblade',
        [
            '  D',            
            'BC ',
            'AB '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:contained_remnant',
            C: 'runes:fire_stone',
            D: 'hazennstuff:dreadsteel_ingot'
        }
    )
    event.shaped(
        'simplyswords:hearthflame',
        [
            'CBC',            
            ' A ',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'runes:fire_stone',
            C: 'simplyswords:tampered_remnant'
        }
    )
    event.shaped(
        'simplyswords:soulkeeper',
        [
            'CBC',            
            ' A ',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'runes:soul_stone',
            C: 'simplyswords:tampered_remnant'
        }
    )
    event.shaped(
        'simplyswords:twisted_blade',
        [
            '  D',            
            'BC ',
            'AB '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'runes:lightning_stone',
            D: 'hazennstuff:steel_ingot'
        }
    )
    event.shaped(
        'simplyswords:soulstealer',
        [
            '   ',            
            ' C ',
            'BAB'
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'simplyswords:tampered_remnant'
        }
    )
    event.shaped(
        'simplyswords:soulrender',
        [
            'CCB',            
            ' A ',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'runes:soul_stone',
            C: 'simplyswords:contained_remnant'
        }
    )
     event.shaped(
        'simplyswords:soulpyre',
        [
            'CCB',            
            'CA ',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'runes:soul_stone'
        }
    )
    event.shaped(
        'simplyswords:frostfall',
        [
            'BCB',            
            ' A ',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'runes:frost_stone'
        }
    )
    event.shaped(
        'simplyswords:molten_edge',
        [
            'CCB',            
            'CA ',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'runes:fire_stone'
        }
    )
    event.shaped(
        'simplyswords:livyatan',
        [
            'CCB',            
            'CA ',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'hazennstuff:steel_ingot'
        }
    )
    event.shaped(
        'simplyswords:icewhisper',
        [
            'CCB',            
            'CA ',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'runes:frost_stone'
        }
    )
    event.shaped(
        'simplyswords:arcanethyst',
        [
            'CCB',            
            'CA ',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'runes:arcane_stone'
        }
    )
    event.shaped(
        'simplyswords:thunderbrand',
        [
            'CCB',            
            'CA ',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'hazennstuff:demonite_ingot'
        }
    )
    event.shaped(
        'simplyswords:mjolnir',
        [
            'BCB',            
            ' A ',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'hazennstuff:demonite_ingot'
        }
    )
    event.shaped(
        'simplyswords:slumbering_lichblade',
        [
            'DCD',            
            'CBC',
            'DAD'
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:tampered_remnant',
            C: 'simplyswords:runic_tablet',
            D: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'simplyswords:shadowsting',
        [
            ' B ',            
            'CBC',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'hazennstuff:cosmic_gold_ingot',
            C: 'simplyswords:runic_tablet'
        }
    )
    event.shaped(
        'simplyswords:dormant_relic',
        [
            ' D ',            
            'CBC',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'runes:healing_stone',
            C: 'simplyswords:runic_tablet',
            D: 'hazennstuff:hallowed_ingot'
        }
    )
    event.shaped(
        'simplyswords:whisperwind',
        [
            ' B ',            
            'CBC',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'minecraft:iron_ingot',
            C: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'simplyswords:emberlash',
        [
            '   ',            
            ' C ',
            'BAB'
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'runes:fire_stone'
        }
    )
    event.shaped(
        'simplyswords:waxweaver',
        [
            '  C',            
            'BC ',
            'AB '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'hazennstuff:hallowed_ingot'
        }
    )
    event.shaped(
        'simplyswords:hiveheart',
        [
            'CBC',            
            ' A ',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'runes:healing_stone',
            C: 'simplyswords:tampered_remnant'
        }
    )
    event.shaped(
        'simplyswords:stars_edge',
        [
            ' BD',            
            'CAC',
            'DB '
        ],
        {
            A: 'minecraft:stick',
            B: 'runes:healing_stone',
            C: 'runes:soul_stone',
            D: 'simplyswords:contained_remnant'
        }
    )
    event.shaped(
        'simplyswords:wickpiercer',
        [
            'DBD',            
            'CAC',
            'DBD'
        ],
        {
            A: 'minecraft:trident',
            B: 'hazennstuff:hallowed_ingot',
            C: 'runes:lightning_stone',
            D: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'simplyswords:tempest',
        [
            ' B ',            
            'BAB',
            ' B '
        ],
        {
            A: 'simplyswords:contained_remnant',
            B: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'simplyswords:flamewind',
        [
            ' BC',            
            ' AB',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'runes:fire_stone'
        }
    )
    event.shaped(
        'simplyswords:ribboncleaver',
        [
            ' C ',            
            ' C ',
            'BAB'
        ],
        {
            A: 'minecraft:stick',
            B: 'minecraft:gold_ingot',
            C: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'simplyswords:decaying_relic',
        [
            ' C ',            
            'BAB',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'hazennstuff:cosmic_gold_ingot'
        }
    )
    event.shaped(
        'simplyswords:magiscythe',
        [
            'BBC',            
            ' A ',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:contained_remnant',
            C: 'hazennstuff:cosmic_gold_ingot'
        }
    )
    event.shaped(
        'simplyswords:enigma',
        [
            ' D ',            
            ' C ',
            'BAB'
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'runes:healing_stone',
            D: 'hazennstuff:chlorophyte_ingot'
        }
    )
    event.shaped(
        'simplyswords:magispear',
        [
            ' BC',            
            ' AB',
            'A  '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'simplyswords:contained_remnant'
        }
    )
    event.shaped(
        'simplyswords:magiblade',
        [
            ' BC',            
            'BAB',
            'CB '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'simplyswords:contained_remnant'
        }
    )
    event.shaped(
        'simplyswords:caelestis',
        [
            '  C',            
            'BCC',
            'AB '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'hazennstuff:demonite_ingot'
        }
    )
    event.shaped(
        'simplyswords:wraithfang',
        [
            ' D ',            
            ' C ',
            'BAB'
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'runes:soul_stone',
            D: 'runes:lightning_stone'
        }
    )
    event.shaped(
        'simplyswords:chompolotl',
        [
            ' A ',            
            'ABA',
            ' A '
        ],
        {
            A: 'runes:soul_stone',
            B: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'simplyswords:dawnquiver',
        [
            '  D',            
            'BC ',
            'AB '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'irons_spellbooks:holy_rune',
            D: 'runes:healing_stone'
        }
    )
    event.shaped(
        'simplyswords:riftmane',
        [
            '  D',            
            'BC ',
            'AB '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'irons_spellbooks:arcane_rune',
            D: 'runes:soul_stone'
        }
    )
    event.shaped(
        'simplyswords:stormscale',
        [
            ' C ',            
            'CBC',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'simplyswords:empowered_remnant',
            C: 'simplyswords:tampered_remnant'
        }
    )
    event.shaped(
        'simplyswords:bloodwake',
        [
            ' C ',            
            'B  ',
            ' A '
        ],
        {
            A: 'minecraft:stick',
            B: 'irons_spellbooks:blood_rune',
            C: 'simplyswords:empowered_remnant'
        }
    )
    event.shaped(
        'fantasy_armor:moon_crystal',
        [
            'ABA',            
            'BCB',
            'ABA'
        ],
        {
            A: 'advancednetherite:netherite_diamond_ingot',
            B: 'minecraft:diamond',
            C: 'minecraft:amethyst_shard'
        }
    )
    //irons_artifice
    event.shaped(
        'irons_artifice:flintlock',
        [
            'A  ',            
            ' AB',
            ' DC'
        ],
        {
            A: 'minecraft:iron_ingot',
            B: 'runes:fire_stone',
            C: 'irons_artifice:blackpowder',
            D: 'minecraft:spruce_log'
        }
    )
    event.shaped(
        'irons_artifice:musket',
        [
            'A  ',            
            ' EB',
            ' DC'
        ],
        {
            A: 'minecraft:iron_ingot',
            B: 'runes:fire_stone',
            C: 'irons_artifice:blackpowder',
            D: 'minecraft:spruce_log',
            E: 'irons_artifice:mechanical_components'
        }
    )
    event.shaped(
        'irons_artifice:blunderbuss',
        [
            'CA ',            
            'ACB',
            ' BD'
        ],
        {
            A: 'minecraft:iron_ingot',
            B: 'runes:fire_stone',
            C: 'irons_artifice:mechanical_components',
            D: 'minecraft:spruce_log'
        }
    )
    event.shaped(
        'irons_artifice:blackpowder_revolver',
        [
            'A  ',            
            ' BC',
            ' DE'
        ],
        {
            A: 'minecraft:iron_ingot',
            B: 'runes:lightning_stone',
            C: 'irons_artifice:clockwork_components',
            D: 'minecraft:spruce_log',
            E: 'irons_artifice:blackpowder'
        }
    )
    event.shaped(
        'irons_artifice:six_shooter',
        [
            'A  ',            
            ' BC',
            ' AD'
        ],
        {
            A: 'minecraft:iron_ingot',
            B: 'runes:lightning_stone',
            C: 'irons_artifice:mechanical_components',
            D: 'minecraft:spruce_log'
        }
    )
        event.shaped(
        'irons_artifice:arquebus',
        [
            'A  ',            
            ' AC',
            ' DB'
        ],
        {
            A: 'minecraft:iron_ingot',
            B: 'runes:fire_stone',
            C: 'irons_artifice:clockwork_components',
            D: 'minecraft:spruce_log'
        }
    )

    // Refined Storage
    const RS = id => 'refinedstorage:' + id
    ;['cable', 'machine_casing', '16k_storage_part', '64k_storage_part',
        '1024b_fluid_storage_part', '4096b_fluid_storage_part'].forEach(id => event.remove({ id: RS(id) }))

    event.shaped(Item.of(RS('cable'), 12), [
        'EEE',
        'WRW',
        'EEE'
    ], {
        E: RS('quartz_enriched_copper'),
        W: 'createaddition:copper_wire',
        R: 'minecraft:redstone'
    }).id('kubejs:refinedstorage/cable')

    event.shaped(RS('machine_casing'), [
        'EIE',
        'IAI',
        'EIE'
    ], {
        E: RS('quartz_enriched_iron'),
        I: 'create:iron_sheet',
        A: 'create:andesite_casing'
    }).id('kubejs:refinedstorage/machine_casing')

    event.shaped(RS('16k_storage_part'), [
        'PEP',
        'SKS',
        'PSP'
    ], {
        P: RS('improved_processor'),
        E: RS('quartz_enriched_iron'),
        S: RS('4k_storage_part'),
        K: 'create:electron_tube'
    }).id('kubejs:refinedstorage/16k_storage_part')

    event.shaped(RS('64k_storage_part'), [
        'PTP',
        'SKS',
        'PSP'
    ], {
        P: RS('advanced_processor'),
        T: 'create:sturdy_sheet',
        S: RS('16k_storage_part'),
        K: 'create:precision_mechanism'
    }).id('kubejs:refinedstorage/64k_storage_part')

    event.shaped(RS('1024b_fluid_storage_part'), [
        'PEP',
        'SKS',
        'PSP'
    ], {
        P: RS('improved_processor'),
        E: RS('quartz_enriched_iron'),
        S: RS('256b_fluid_storage_part'),
        K: 'create:fluid_tank'
    }).id('kubejs:refinedstorage/1024b_fluid_storage_part')

    event.shaped(RS('4096b_fluid_storage_part'), [
        'PTP',
        'SKS',
        'PSP'
    ], {
        P: RS('advanced_processor'),
        T: 'create:sturdy_sheet',
        S: RS('1024b_fluid_storage_part'),
        K: 'create:fluid_tank'
    }).id('kubejs:refinedstorage/4096b_fluid_storage_part')

    // Sophisticated Backpacks
    const SB = id => 'sophisticatedbackpacks:' + id
    const sbKey = k => {
        const out = {}
        Object.keys(k).forEach(c => {
            const v = k[c]
            out[c] = v.charAt(0) === '#' ? { tag: v.substring(1) } : { item: v }
        })
        return out
    }
    const sbRecipe = (type, id, pattern, key) => {
        event.remove({ id: id })
        event.custom({ type: type, category: 'misc', pattern: pattern, key: sbKey(key), result: { id: id, count: 1 } })
            .id('kubejs:' + id.replace(':', '/'))
    }

    sbRecipe('sophisticatedbackpacks:basic_backpack', SB('backpack'), [
        'SLS',
        'LCL',
        'LIL'
    ], { S: '#c:strings', L: '#c:leathers', C: '#c:chests/wooden', I: '#c:ingots/iron' })

    sbRecipe('sophisticatedbackpacks:backpack_upgrade', SB('copper_backpack'), [
        'CKC',
        'CBC',
        'CLC'
    ], { C: '#c:ingots/copper', K: '#c:storage_blocks/copper', B: SB('backpack'), L: '#c:leathers' })

    sbRecipe('sophisticatedbackpacks:backpack_upgrade', SB('iron_backpack'), [
        'ILI',
        'IBI',
        'IKI'
    ], { I: '#c:ingots/iron', L: '#c:leathers', B: SB('backpack'), K: '#c:storage_blocks/iron' })

    sbRecipe('sophisticatedbackpacks:backpack_upgrade', SB('gold_backpack'), [
        'GLG',
        'GBG',
        'GKG'
    ], { G: '#c:ingots/gold', L: '#c:leathers', B: SB('iron_backpack'), K: '#c:storage_blocks/gold' })

    sbRecipe('sophisticatedcore:upgrade_next_tier', SB('magnet_upgrade'), [
        'EIE',
        'IPI',
        'RDR'
    ], { E: '#c:ender_pearls', I: '#c:ingots/iron', P: SB('pickup_upgrade'), R: '#c:dusts/redstone', D: '#c:gems/diamond' })

    sbRecipe('sophisticatedcore:upgrade_next_tier', SB('advanced_magnet_upgrade'), [
        'EIE',
        'IPI',
        'RDR'
    ], { E: '#c:ender_pearls', I: '#c:ingots/iron', P: SB('advanced_pickup_upgrade'), R: '#c:dusts/redstone', D: '#c:gems/diamond' })

    sbRecipe('minecraft:crafting_shaped', SB('feeding_upgrade'), [
        ' C ',
        'ABM',
        'GEG'
    ], { C: 'minecraft:golden_carrot', A: 'minecraft:golden_apple', B: SB('upgrade_base'),
        M: 'minecraft:glistering_melon_slice', G: '#c:ingots/gold', E: '#c:ender_pearls' })

    // Sophisticated Storage
    event.remove({ id: 'sophisticatedstorage:stack_upgrade_tier_1' })
    event.shaped('sophisticatedstorage:stack_upgrade_tier_1', [
        'LIL',
        'LBL',
        'LIL'
    ], {
        L: '#minecraft:logs',
        I: '#c:ingots/iron',
        B: 'sophisticatedstorage:upgrade_base'
    }).id('kubejs:sophisticatedstorage/stack_upgrade_tier_1')

    // Create New Age
    const CNA = id => 'create_new_age:' + id
    ;['basic_motor', 'advanced_motor', 'generator_coil', 'stirling_engine', 'basic_solar_heating_plate']
        .forEach(id => event.remove({ id: CNA('shaped/' + id) }))

    event.shaped(CNA('basic_motor'), [
        'IWI',
        'MCS',
        'IWI'
    ], {
        I: 'create:iron_sheet',
        W: CNA('copper_wire'),
        M: CNA('magnetite_block'),
        C: 'create:andesite_casing',
        S: 'create:shaft'
    }).id('kubejs:create_new_age/basic_motor')

    event.shaped(CNA('advanced_motor'), [
        'GWG',
        'ICS',
        'GWG'
    ], {
        G: 'create:golden_sheet',
        W: CNA('overcharged_golden_wire'),
        I: CNA('overcharged_iron'),
        C: 'create:brass_casing',
        S: 'create:shaft'
    }).id('kubejs:create_new_age/advanced_motor')

    event.shaped(CNA('generator_coil'), [
        'CWC',
        'WAW',
        'CWC'
    ], {
        C: 'create:copper_sheet',
        W: CNA('copper_wire'),
        A: 'create:andesite_alloy_block'
    }).id('kubejs:create_new_age/generator_coil')

    event.shaped(CNA('stirling_engine'), [
        'ISI',
        'PCP',
        'IBI'
    ], {
        I: 'create:iron_sheet',
        S: 'create:shaft',
        P: CNA('heat_pipe'),
        C: '#c:storage_blocks/copper',
        B: 'create:brass_casing'
    }).id('kubejs:create_new_age/stirling_engine')

    event.shaped(CNA('basic_solar_heating_plate'), [
        'GGG',
        'IPI',
        'IPI'
    ], {
        G: 'minecraft:glass',
        I: 'create:iron_sheet',
        P: CNA('heat_pipe')
    }).id('kubejs:create_new_age/basic_solar_heating_plate')

    // Supplementaries
    const SUP = id => 'supplementaries:' + id
    ;['cannon', 'cannon_2', 'bomb', 'cage', 'jar', 'sack', 'sack_2', 'sack_3', 'wrench']
        .forEach(id => event.remove({ id: SUP(id) }))

    event.shaped(SUP('cannon'), [
        'III',
        'BDB',
        'LRL'
    ], {
        I: '#c:ingots/iron',
        B: '#c:storage_blocks/iron',
        D: 'minecraft:dispenser',
        L: '#minecraft:logs',
        R: 'minecraft:redstone'
    }).id('kubejs:supplementaries/cannon')

    event.shaped(Item.of(SUP('bomb'), 4), [
        'GSG',
        'ITI',
        'GIG'
    ], {
        G: 'minecraft:gunpowder',
        S: '#c:strings',
        I: '#c:ingots/iron',
        T: 'minecraft:tnt'
    }).id('kubejs:supplementaries/bomb')

    event.shaped(SUP('cage'), [
        'ICI',
        'B B',
        'SSS'
    ], {
        I: '#c:ingots/iron',
        C: 'minecraft:chain',
        B: 'minecraft:iron_bars',
        S: '#minecraft:wooden_slabs'
    }).id('kubejs:supplementaries/cage')

    event.shaped(SUP('jar'), [
        'NSN',
        'G G',
        'GGG'
    ], {
        N: 'minecraft:iron_nugget',
        S: '#minecraft:wooden_slabs',
        G: 'minecraft:glass'
    }).id('kubejs:supplementaries/jar')

    event.shaped(SUP('sack'), [
        'LSL',
        'F F',
        'LFL'
    ], {
        L: '#c:leathers',
        S: '#c:strings',
        F: '#c:crops/flax'
    }).id('kubejs:supplementaries/sack')

    event.shaped(SUP('wrench'), [
        'C C',
        ' I ',
        ' C '
    ], {
        C: '#c:ingots/copper',
        I: '#c:ingots/iron'
    }).id('kubejs:supplementaries/wrench')

    // Aquaculture
    const AQ = id => 'aquaculture:' + id
    ;['iron_fishing_rod', 'golden_fishing_rod', 'diamond_fishing_rod', 'neptunium_fishing_rod', 'fishing_line',
        'iron_hook', 'gold_hook', 'diamond_hook', 'heavy_hook', 'light_hook', 'redstone_hook']
        .forEach(id => event.remove({ id: AQ(id) }))

    const aqRod = (result, head, handle) => event.shaped(AQ(result), [
        '  H',
        ' HS',
        'T S'
    ], { H: head, S: '#c:strings', T: handle }).id('kubejs:aquaculture/' + result)
    aqRod('iron_fishing_rod', '#c:ingots/iron', '#c:ingots/iron')
    aqRod('gold_fishing_rod', '#c:ingots/gold', '#c:ingots/iron')
    aqRod('diamond_fishing_rod', '#c:gems/diamond', '#c:ingots/gold')
    aqRod('neptunium_fishing_rod', '#c:ingots/neptunium', '#c:gems/diamond')

    event.shaped(AQ('fishing_line'), [
        'SSS',
        'SIS',
        'SSS'
    ], {
        S: '#c:strings',
        I: '#c:ingots/iron'
    }).id('kubejs:aquaculture/fishing_line')

    event.shaped(AQ('iron_hook'), [
        '  N',
        'N N',
        ' I '
    ], {
        N: '#c:nuggets/iron',
        I: '#c:ingots/iron'
    }).id('kubejs:aquaculture/iron_hook')

    const aqHook = (result, pattern, key) => {
        key.H = AQ('iron_hook')
        event.shaped(AQ(result), pattern, key).id('kubejs:aquaculture/' + result)
    }
    aqHook('gold_hook', [' G ', 'GHG', ' I '], { G: '#c:nuggets/gold', I: '#c:ingots/gold' })
    aqHook('diamond_hook', [' D ', 'DHD', 'GDG'], { D: '#c:gems/diamond', G: '#c:ingots/gold' })
    aqHook('heavy_hook', [' I ', 'IHI', ' I '], { I: '#c:ingots/iron' })
    aqHook('light_hook', [' F ', 'FHF', 'SFS'], { F: '#c:feathers', S: '#c:strings' })
    aqHook('redstone_hook', [' R ', 'RHR', ' B '], { R: '#c:dusts/redstone', B: '#c:storage_blocks/redstone' })

    // Blazing stone
    event.shaped(
        'fantasy_weapons:blazing_stone',
        [
            'ABA',            
            'BCB',
            'ABA'
        ],
        {
            A: 'advancednetherite:netherite_gold_ingot',
            B: 'minecraft:blaze_rod',
            C: 'minecraft:stone'
        }
    )
})
