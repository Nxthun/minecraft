// Scorched Guns - remove wanderer trades
const $EventPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const $WandererTradesEvent = Java.loadClass('net.neoforged.neoforge.event.village.WandererTradesEvent')
const $BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $RandomSource = Java.loadClass('net.minecraft.util.RandomSource')

function sgItemNs(stack) {
  if (stack == null || stack.isEmpty()) return ''
  return String($BuiltInRegistries.ITEM.getKey(stack.getItem())).split(':')[0]
}

function sgIsScgunsTrade(listing) {
  try {
    var offer = listing.getOffer(null, $RandomSource.create())
    if (offer == null) return false
    return sgItemNs(offer.getResult()) === 'scguns' || sgItemNs(offer.getCostA()) === 'scguns'
  } catch (e) {
    return false
  }
}

NativeEvents.onEvent($EventPriority.LOWEST, $WandererTradesEvent, event => {
  try {
    event.getGenericTrades().removeIf(l => sgIsScgunsTrade(l))
    event.getRareTrades().removeIf(l => sgIsScgunsTrade(l))
  } catch (e) {
    console.error('[scguns_no_trades] wanderer: ' + e)
  }
})