EntityEvents.drops(event => {
    // Infernal Dragon (Bosses Rises) -> Rogue Eye
    if (event.entity.type == 'block_factorys_bosses:infernal_dragon') {
        event.addDrop('endrem:rogue_eye')
    }

    // Underworld Knight (Bosses Rises) -> Magical Eye
    if (event.entity.type == 'block_factorys_bosses:underworld_knight') {
        event.addDrop('endrem:magical_eye')
    }

    // Netherite Monstrosity (Cataclysm) -> Lost Eye
    if (event.entity.type == 'cataclysm:netherite_monstrosity') {
        event.addDrop('endrem:lost_eye')
    }

    // Hydra (Twilight Forest) -> Evil Eye
    if (event.entity.type == 'twilightforest:hydra') {
        event.addDrop('endrem:evil_eye')
    }

    // Snow Queen (Twilight Forest) -> Cold Eye
    if (event.entity.type == 'twilightforest:snow_queen') {
        event.addDrop('endrem:cold_eye')
    }

    // Starlight Golem (Eternal Starlight) -> Corrupted Eye
    if (event.entity.type == 'eternal_starlight:starlight_golem') {
        event.addDrop('endrem:corrupted_eye')
    }

    // Lunar Monstrosity (Eternal Starlight) -> Witch Eye
    if (event.entity.type == 'eternal_starlight:lunar_monstrosity') {
        event.addDrop('endrem:witch_eye')
    }

    // The Leviathan (Cataclysm) -> Exotic Eye
    if (event.entity.type == 'cataclysm:the_leviathan') {
        event.addDrop('endrem:exotic_eye')
    }

    // Maledictus (Cataclysm) -> Undead Eye
    if (event.entity.type == 'cataclysm:maledictus') {
        event.addDrop('endrem:undead_eye')
    }

    // Ancient Remnant (Cataclysm) -> Old Eye
    if (event.entity.type == 'cataclysm:ancient_remnant') {
        event.addDrop('endrem:old_eye')
    }

    // Ignis (Cataclysm) -> Nether Eye
    if (event.entity.type == 'cataclysm:ignis') {
        event.addDrop('endrem:nether_eye')
    }

    // Wither (Minecraft) -> Wither Eye
    if (event.entity.type == 'minecraft:wither') {
        event.addDrop('endrem:wither_eye')
    }
})