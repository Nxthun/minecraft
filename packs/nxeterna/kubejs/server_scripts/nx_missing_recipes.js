// nx_missing_recipes.js
// Recipes the mods meant to have but did not ship (found by the quest audit, reports/quests-audit/suspects-resolved.md).
// Each uses the mod's own recipe id, so a later mod version that ships the file is simply replaced by the same recipe.
//
// The matching loot fix for Hazen 'N Stuff (Arcane Sea Shell, Pendant of Harmony: the mod's loot modifiers ask for
// table ids that do not exist) is data, not script: kubejs/data/hazennstuff/loot_table/chests/additional_*_loot.json

ServerEvents.recipes(function (event) {
  // Power Grid 0.6.2: the three vacuum tubes exist in the mod's recipe generator but their files were left out of the jar.
  event.shaped('powergrid:triode', ['Q', 'G', 'I'], { Q: 'create:polished_rose_quartz', G: 'minecraft:glowstone_dust', I: '#c:plates/iron' }).id('powergrid:crafting/triode')
  event.shaped('powergrid:pentode', ['A', 'T', 'I'], { A: 'minecraft:amethyst_shard', T: 'powergrid:triode', I: '#c:plates/iron' }).id('powergrid:crafting/pentode')
  event.shaped('powergrid:thyratron', ['H', 'E', 'I'], { H: 'powergrid:heavy_wire_connector', E: 'minecraft:ender_pearl', I: '#c:plates/iron' }).id('powergrid:crafting/thyratron')

  // Hazen 'N Stuff 1.4.0: the Hydro Upgrade Orb has no recipe; its four sibling orbs all use this pattern with their own rune.
  event.shaped('hazennstuff:hydro_upgrade_orb', ['RRR', 'ROR', 'RRR'], { R: '#hazennstuff:items/hydro_runes', O: 'irons_spellbooks:upgrade_orb' }).id('hazennstuff:crafting/upgrade_orbs/hydro_upgrade_orb')
})
