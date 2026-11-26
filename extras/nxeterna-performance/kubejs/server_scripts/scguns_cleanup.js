// Scorched Guns - remove recipes of hidden items
var $SGCleanupBIR = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

ServerEvents.recipes(event => {
  var keep = global.SG_KEEP
  if (!keep || !keep['musket']) {
    console.error('[scguns_cleanup] global.SG_KEEP missing, skipped')
    return
  }
  var filters = []
  $SGCleanupBIR.ITEM.keySet().forEach(rl => {
    var id = String(rl)
    if (id.indexOf('scguns:') === 0 && !keep[id.substring(7)]) filters.push({ output: id })
  })
  if (filters.length > 0) event.remove(filters)
  ;[
  'scguns:create/vehement_coal',
  'scguns:diamond_steel_from_diamond_steel_block',
  'scguns:scorched_ingot_from_scorched_block',
  'scguns:treated_brass_from_treated_brass_block',
  'scguns:treated_iron/treated_iron_from_treated_iron_block'
  ].forEach(id => event.remove({ id: id }))
  console.info('[scguns_cleanup] removed recipes for ' + filters.length + ' hidden items')
})
