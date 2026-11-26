// Iron's Artifice - no guns in offhand
(function () {
  const IA_InteractionHand = Java.loadClass('net.minecraft.world.InteractionHand');

  PlayerEvents.tick(function (event) {
    const p = event.player;
    const off = p.offHandItem;
    if (off.isEmpty() || !off.hasTag('irons_artifice:guns')) return;

    const gun = off.copy();
    p.setItemInHand(IA_InteractionHand.OFF_HAND, Item.empty);
    p.give(gun);
    try { p.setStatusMessage(Text.gray('This weapon is two-handed - hold it in your main hand.')); } catch (e) {}
  });
})();
