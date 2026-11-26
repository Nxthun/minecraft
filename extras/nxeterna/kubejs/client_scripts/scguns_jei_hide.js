// Scorched Guns - hide unused items in JEI
var $SGHideBIR = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

RecipeViewerEvents.removeEntriesCompletely('item', event => {
  var keep = global.SG_KEEP
  if (!keep || !keep['musket']) {
    console.error('[scguns_jei_hide] global.SG_KEEP missing, skipped')
    return
  }
  $SGHideBIR.ITEM.keySet().forEach(rl => {
    var id = String(rl)
    if (id.indexOf('scguns:') === 0 && !keep[id.substring(7)]) event.remove(id)
  })
})

RecipeViewerEvents.removeEntriesCompletely('fluid', event => {
  $SGHideBIR.FLUID.keySet().forEach(rl => {
    var id = String(rl)
    if (id.indexOf('scguns:') === 0 && id.indexOf('flowing') < 0) event.remove(id)
  })
})
