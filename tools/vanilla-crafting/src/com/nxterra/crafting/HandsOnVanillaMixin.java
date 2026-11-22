package com.nxterra.crafting;

import net.minecraft.client.gui.screens.Screen;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(targets = "com.pockyl.handson_vanilla.client.HandsOnVanillaClient", remap = false)
abstract class HandsOnVanillaMixin {
    // Alt + use keeps the normal block interaction and lets the server open its crafting menu.
    @Inject(method = "lambda$init$2", at = @At("HEAD"), cancellable = true, require = 1)
    private static void nxterra$useVanillaCrafting(CallbackInfoReturnable<Boolean> callback) {
        if (Screen.hasAltDown()) {
            callback.setReturnValue(false);
        }
    }
}
