// Scorched Guns - block gunsmith trading
const $SGProfReg = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

ItemEvents.entityInteracted(event => {
  const target = event.target
  if (String(target.type) !== 'minecraft:villager') return
  const prof = String($SGProfReg.VILLAGER_PROFESSION.getKey(target.getVillagerData().getProfession()))
  if (prof !== 'scguns:gunsmith') return
  event.cancel()
  if (String(event.hand) === 'MAIN_HAND') {
    event.player.setStatusMessage(Text.gray('The gunsmith has nothing to sell.'))
  }
})
