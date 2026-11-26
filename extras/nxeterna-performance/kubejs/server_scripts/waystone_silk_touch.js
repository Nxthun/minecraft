// Lista wyciągnięta bezpośrednio z pliku moda (waystones-neoforge-1_21_1-21_1_45.jar)
const waystoneBlocks = [
    "black_portstone",
    "black_sharestone",
    "blackstone_waystone",
    "blue_portstone",
    "blue_sharestone",
    "brown_portstone",
    "brown_sharestone",
    "cyan_portstone",
    "cyan_sharestone",
    "deepslate_waystone",
    "end_stone_waystone",
    "gray_portstone",
    "gray_sharestone",
    "green_portstone",
    "green_sharestone",
    "light_blue_portstone",
    "light_blue_sharestone",
    "light_gray_portstone",
    "light_gray_sharestone",
    "lime_portstone",
    "lime_sharestone",
    "magenta_portstone",
    "magenta_sharestone",
    "mossy_waystone",
    "mud_bricks_waystone",
    "orange_portstone",
    "orange_sharestone",
    "pink_portstone",
    "pink_sharestone",
    "prismarine_waystone",
    "purple_portstone",
    "purple_sharestone",
    "purpur_waystone",
    "red_nether_bricks_waystone",
    "red_portstone",
    "red_sharestone",
    "sandy_waystone",
    "waystone",
    "white_portstone",
    "yellow_portstone",
    "yellow_sharestone",
]

LootJS.lootTables(event => {
    waystoneBlocks.forEach(name => {
        const blockId = "waystones:" + name
        const tableId = "waystones:blocks/" + name

        event
            .getLootTable(tableId)
            .firstPool()
            .removeItem(blockId)
            .addEntry(
                LootEntry.of(blockId).matchTool(ItemFilter.hasEnchantment("minecraft:silk_touch"))
            )
    })
})

// Uwaga: Warp Plate (waystones:warp_plate) NIE jest tu ujęty - jeśli chcesz,
// żeby on też wymagał Silk Touch, dopisz "warp_plate" do listy powyżej.
