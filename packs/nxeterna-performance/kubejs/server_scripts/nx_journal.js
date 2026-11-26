// NxEterna: Thomas Wren's survey, 20 journal pages (design/journal-pages.md).
// Each page is a written book "Survey: <place>" by T. Wren with custom_data {nx_page:<n>} (the Atlas quest
// "The Whole Survey" matches that). Pages turn up in chest loot opened in the biome they describe (LootJS,
// biome at the chest), and the matching Explorer's Atlas quest gives its page as a guaranteed reward through
// /nx_journal give <player> <n> (quest command reward).
// Uses nxBook / nxPaginate from nx_chronicle.js.

var NX_JOURNAL_CHANCE = 0.12   // per chest opened in the page's biome
var NX_JOURNAL = [
  { n: 1, place: 'The High Meadow', day: 2, biomes: ['minecraft:meadow'],
    text: "Started the survey at the meadow above the valley. Good open ground. Lone trees here often carry bee nests; smoke them with a campfire underneath and the honey is yours. Found a stone cairn on the rise, the old kind Will used to build, five flat stones. It's old enough to have moss on it. I told myself it could be anyone's." },
  { n: 2, place: 'The Flower Wood', day: 4, biomes: ['minecraft:flower_forest'],
    text: "Every colour of dye grows in this wood if you walk it slowly. I filled a sack for map inks. Counted more kinds of flower than I can name. A birch by the stream has a W cut into it, scarred over and grown wide. Will cut his letter like that, the long middle stroke. So he came this way. That is something." },
  { n: 3, place: 'The Cherry Hills', day: 6, biomes: ['minecraft:cherry_grove'],
    text: "Pink all the way down the slope. The petals drift into the streams and turn the water pink at the edges. Cherry wood is the best-looking timber I know for a house; worth the walk. Another cairn, facing toward the mountain. I am starting to think he built them to point, not to mark." },
  { n: 4, place: 'The Lavender Reach', day: 8, biomes: ['natures_spirit:lavender_fields'],
    text: "Lavender, foxglove, anemone, and the dark spires of cypress standing alone in it. Sheep and cows graze here and nothing much bothers them. The cliffs are soft pale clay. I slept in the open and woke smelling of the field. No sign of Will. I drew the field anyway. Someone should have it on paper." },
  { n: 5, place: 'Fields of Carnation', day: 9, biomes: ['natures_spirit:carnation_fields'],
    text: "Red carnation and poppy as far as I could see, so dyeing red costs nothing here. Cypress again, in ones and twos. Clay in the cliff faces. Met a shepherd's dog that followed me half a day and then turned home. I keep wanting to tell Will about things. Twenty years and I still save things to tell him." },
  { n: 6, place: 'The Cypress Rows', day: 10, biomes: ['natures_spirit:cypress_fields'],
    text: "Dense cypress, and olive trees between them. Wolves den in the rows. They watched me, didn't come close. Bring bones and you'll have company for life. A cairn at the edge, and under its top stone a tin cup with a dent I'd know anywhere. He drank from that at our mother's table." },
  { n: 7, place: 'The Wisteria Veil', day: 13, biomes: ['natures_spirit:wisteria_forest'],
    text: "Wisteria in four colours, blue, pink, purple, white, hanging so low you walk through it like curtains. Lotus on the still water. If I ever build a second house it will be on the water's edge here. The light under the vines is green-violet. Will would have stopped here a week. I did not let myself stop." },
  { n: 8, place: 'The Tall Cedars', day: 15, biomes: ['natures_spirit:sugi_forest'],
    text: "Tall cedars, bamboo in the hollows, and clear springs coming straight out of the slopes, so a camp here never needs to carry water. Bamboo makes scaffolding and the cedar splits straight. Another W in the bark, higher than I can reach. He was taller than me. I measured it for no reason." },
  { n: 9, place: 'Cedar and Blossom', day: 16, biomes: ['natures_spirit:blooming_sugi_forest'],
    text: "The same cedars, but with cherry trees growing among them and blossom on the ground under both. Springs here too. Quietest place on the survey so far. I found where someone had cleared a sleeping spot between two roots and lined it with fern. It could have been anyone. I lay in it to see if it fit him." },
  { n: 10, place: 'The Chalk Cliffs', day: 18, biomes: ['natures_spirit:white_cliffs'],
    text: "White chalk cliffs over clear springs. The chalk cuts easily and builds clean, and it shows from far off, which makes it good for a lighthouse or a marker. I climbed the highest one and could see the mountain for the first time with snow on it. There is a dark smudge near the top. Rock, probably." },
  { n: 11, place: 'The Golden Aspens', day: 20, biomes: ['natures_spirit:aspen_forest'],
    text: "Aspen, white bark and yellow leaves, and pumpkins growing wild under them, so no one starves here in the cold months. Flaxen fern to the knee. Found a cairn knocked flat, then rebuilt by a different hand, the stones set wrong. Someone else has been following him too, or he came back through here older and clumsier." },
  { n: 12, place: 'Hollow of Maples', day: 22, biomes: ['natures_spirit:maple_woodlands'],
    text: "Red maples in a fold between granite outcrops. Pumpkins here as well. The granite is good, hard building stone and it lies right at the surface. Spent the evening re-inking the map by the fire. The W marks and the cairns make a line on paper. It runs straight at the mountain, every one." },
  { n: 13, place: 'The Amber Wilds', day: 24, biomes: ['natures_spirit:golden_wilds'],
    text: "Maple, tall grass, marigold and tiger lily. Wolves run here in packs, more than in the cypress. They let me pass. Granite again. I am tired in a way sleep doesn't fix. I wrote Will a letter tonight that I will never send, just to say the line on my map is straight and I am on it." },
  { n: 14, place: 'The Marigold Meads', day: 25, biomes: ['natures_spirit:marigold_meadows'],
    text: "A whole valley of marigold. Orange and yellow dye for nothing, and pumpkins between the maples. Bright enough to hurt in the afternoon. A traveller I met on the road said there used to be a white dragon over the mountain years ago, and that it stopped flying one winter. She did not know what happened to it." },
  { n: 15, place: 'The Heather Moor', day: 27, biomes: ['natures_spirit:heather_fields'],
    text: "Heather in purple, red, and white, larch on the ridges, and grey andesite boulders the size of houses to camp in the lee of. Cold wind off the mountain now. The cairns are closer together here, as if he was slowing down or wanted to be found. I have stopped telling myself it could be anyone." },
  { n: 16, place: 'Redwood Deep', day: 29, biomes: ['natures_spirit:redwood_forest'],
    text: "Redwoods so large a single trunk gives a cabin's worth of timber. Ferns and blue iris on the floor, light coming down in bars. I sat inside a hollow trunk to wait out rain and found his initials carved again, and a date. Nineteen years ago. He was here, alive, a year after he left." },
  { n: 17, place: 'The Archwood', day: 31, biomes: ['ars_nouveau:archwood_forest'],
    text: "Trees in red, blue, green and purple, and lights drifting between them at night. Small creatures live here: a fat orange one that hoards, a bird-like one in the leaves, something that sleeps under the moss. Those who study the arcane collect them. Will's knife was stuck in a stump here, blade down, pointing at the peak." },
  { n: 18, place: 'The Banded Desert', day: 34, biomes: ['natures_spirit:stratified_desert'],
    text: "Clay cliffs in layered bands of colour, joshua trees, cactus. Desert turnips grow rooted in the sand; dig them up, they keep you going. I nearly turned back here. Two days without a sign. Then a cairn on a ledge, built of the banded stone, and on top a scrap of his coat. I went on." },
  { n: 19, place: 'The Painted Canyons', day: 37, biomes: ['minecraft:badlands', 'minecraft:eroded_badlands', 'minecraft:wooded_badlands'],
    text: "Red and orange canyon walls. Gold shows in the rock here even near the surface, more than anywhere else I have mapped. Old mine timbers stick out of the cliffs. In a dry cave, a letter in Will's hand, never sent: \"Gone up to watch her. She hasn't flown since autumn. Someone should stay with her. W.\"" },
  { n: 20, place: 'The Mountain', day: 41, biomes: ['minecraft:jagged_peaks', 'minecraft:frozen_peaks', 'minecraft:stony_peaks', 'natures_spirit:snowcapped_red_peaks'],
    text: "Powder snow up here will swallow a man; leather boots carry you over it. Goats on the ledges, emerald in the grey stone. At the top, the dragon, long dead, bones white as the snow. Will's camp beside her, cold for years. Under his coat, an egg, whole. He kept it all that time. I left it there. It needs a keeper. I went home to be one." }
]

var nxJournalPage = function (n) {
  var pg = NX_JOURNAL[n - 1]
  if (!pg) return null
  var pages = nxPaginate([pg.place + '\nDay ' + pg.day + ' of the survey\n\n' + pg.text])
  return nxBook('Survey: ' + pg.place, 'T. Wren', pages, { nx_page: n })
}

LootJS.modifiers(function (event) {
  NX_JOURNAL.forEach(function (pg) {
    event.addTableModifier(LootType.CHEST)
      .matchBiome(pg.biomes)
      .randomChance(NX_JOURNAL_CHANCE)
      .addLoot(LootEntry.of(nxJournalPage(pg.n)))
  })
})

ServerEvents.commandRegistry(function (event) {
  var Commands = event.commands
  var $EntityArg = Java.loadClass('net.minecraft.commands.arguments.EntityArgument')
  var $IntArg = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')
  event.register(Commands.literal('nx_journal').requires(function (s) { return s.hasPermission(2) })
    .then(Commands.literal('give').then(Commands.argument('target', $EntityArg.player())
      .then(Commands.argument('page', $IntArg.integer(1, NX_JOURNAL.length)).executes(function (ctx) {
        var p = $EntityArg.getPlayer(ctx, 'target')
        p.give(nxJournalPage($IntArg.getInteger(ctx, 'page')))
        return 1
      }))
      .then(Commands.literal('all').executes(function (ctx) {
        var p = $EntityArg.getPlayer(ctx, 'target')
        NX_JOURNAL.forEach(function (pg) { p.give(nxJournalPage(pg.n)) })
        return NX_JOURNAL.length
      })))))
})
