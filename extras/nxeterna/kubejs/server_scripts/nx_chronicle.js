// NxEterna: The Chronicle (design/chronicle.md).
// Records world-firsts once, in server persistent data (survives restarts), announces each once to everyone,
// and /chronicle gives the caller a written book of every entry so far.
// Storage: server.persistentData 'nx_chronicle' = { n: <count>, e0..e<n-1>: JSON {k,p,day,date,text}, k:<key>: 1b }.
// Shared helpers used by the other nx_* scripts: nxChronicleRecord, nxBook, nxPaginate (server scripts share one scope).

var $NxWBC = Java.loadClass('net.minecraft.world.item.component.WrittenBookContent')
var $NxFilterable = Java.loadClass('net.minecraft.server.network.Filterable')
var $NxDataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
var $NxComponent = Java.loadClass('net.minecraft.network.chat.Component')
var $NxCustomData = Java.loadClass('net.minecraft.world.item.component.CustomData')
var $NxCompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag')
var $NxArrayList = Java.loadClass('java.util.ArrayList')
var $NxStringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')

var NX_CHR_STORE = 'nx_chronicle'
var NX_CHR_PREFIX = 'The Chronicle records: '
// Names that never take a world-first (the AI player; owner's decision 2026-11-25). A real player's first still counts later.
var NX_CHR_EXCLUDED = ['Timmy']
var NX_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ---------------------------------------------------------------- book helper (shared)
// Word-wraps at ~19 characters a line, 13 lines a page, and only breaks pages between paragraphs
// unless a paragraph alone is longer than a page (then between sentences, then between words).
var NX_BOOK_COLS = 19
var NX_BOOK_ROWS = 13
var nxWrapLines = function (para) {
  var rows = String(para).split('\n')
  if (rows.length > 1) return rows.reduce(function (s, r) { return s + (r.length ? nxWrapLines(r) : 1) }, 0)
  var words = String(para).split(' ')
  var lines = 0, cur = 0
  for (var i = 0; i < words.length; i++) {
    var w = words[i].length
    if (cur === 0) { cur = w; lines++ }
    else if (cur + 1 + w <= NX_BOOK_COLS) cur += 1 + w
    else { cur = w; lines++ }
  }
  return Math.max(1, lines)
}
var nxSplitLong = function (para) {
  // split a too-long paragraph into chunks that each fit a page
  var parts = String(para).match(/[^.!?]+[.!?]+["']?\s*|[^.!?]+$/g) || [para]
  var out = [], cur = ''
  parts.forEach(function (s) {
    var t = cur ? cur + s : s
    if (nxWrapLines(t.trim()) <= NX_BOOK_ROWS) cur = t
    else { if (cur) out.push(cur.trim()); cur = s }
  })
  if (cur) out.push(cur.trim())
  // a single sentence longer than a page: cut by words
  var res = []
  out.forEach(function (c) {
    if (nxWrapLines(c) <= NX_BOOK_ROWS) { res.push(c); return }
    var words = c.split(' '), acc = ''
    words.forEach(function (w) {
      var t = acc ? acc + ' ' + w : w
      if (nxWrapLines(t) <= NX_BOOK_ROWS) acc = t
      else { res.push(acc); acc = w }
    })
    if (acc) res.push(acc)
  })
  return res
}
var nxPaginate = function (paras) {
  var pages = [], cur = [], used = 0
  var flush = function () { if (cur.length) pages.push(cur.join('\n\n')); cur = []; used = 0 }
  paras.forEach(function (p) {
    var chunks = nxWrapLines(p) > NX_BOOK_ROWS ? nxSplitLong(p) : [p]
    chunks.forEach(function (c) {
      var need = nxWrapLines(c) + (cur.length ? 1 : 0)
      if (used + need > NX_BOOK_ROWS) flush()
      used += nxWrapLines(c) + (cur.length ? 1 : 0)
      cur.push(c)
    })
  })
  flush()
  return pages
}
// pages: array of plain strings (one per page). customInt: optional {key: int} written to minecraft:custom_data.
var nxBook = function (title, author, pages, customInt) {
  var list = new $NxArrayList()
  pages.slice(0, 100).forEach(function (p) { list.add($NxFilterable.passThrough($NxComponent.literal(String(p)))) })
  var stack = Item.of('minecraft:written_book')
  stack.set($NxDataComponents.WRITTEN_BOOK_CONTENT, new $NxWBC($NxFilterable.passThrough(String(title).substring(0, 32)), String(author), 0, list, true))
  if (customInt) {
    var tag = new $NxCompoundTag()
    Object.keys(customInt).forEach(function (k) { tag.putInt(k, customInt[k]) })
    stack.set($NxDataComponents.CUSTOM_DATA, $NxCustomData.of(tag))
  }
  return stack
}

// ---------------------------------------------------------------- place names (server side)
// Read from the same lang override the clients load, so chat and the book use the Traveler's Titles names.
var NX_PLACE_NAMES = {}
try {
  var nxLang = JsonIO.read('kubejs/assets/nxeterna/lang/en_us.json')
  if (nxLang == null) console.error('[nx_chronicle] place names not found: kubejs/assets/nxeterna/lang/en_us.json')
  else nxLang.keySet().forEach(function (k) { NX_PLACE_NAMES[String(k)] = String(nxLang.get(k)).replace(/^"|"$/g, '') })
} catch (e) {
  console.error('[nx_chronicle] could not read place names: ' + e)
}
// "The Lavender Reach" -> "the Lavender Reach" inside a sentence
var nxPlaceInSentence = function (name) { return String(name).replace(/^The /, 'the ') }

// ---------------------------------------------------------------- what counts as a first
var NX_CHR_DIMS = {   // dimension id -> [key, sentence]   (ids verified in the jars; vanilla ids by advancement below)
  'twilightforest:twilight_forest': ['twilight', '{p} has crossed into the Twilight Forest.'],
  'deeperdarker:otherside': ['otherside', '{p} has gone below the deep dark into the Otherside.'],
  'fossilslegacy:prehistory': ['prehistory', '{p} has gone back to the age before history.']
}
var NX_CHR_ADV = {    // advancement id -> [key, sentence]   (every modded id checked in data/<ns>/advancement of its jar)
  'minecraft:story/enter_the_nether': ['nether', '{p} is the first of us to pass into the Nether.'],
  'minecraft:story/enter_the_end': ['end', '{p} has stepped into the End.'],
  'aether:enter_aether': ['aether', '{p} has risen into the Aether.'],
  'eternal_starlight:enter_starlight': ['starlight', '{p} has found the way to the Starlight.'],
  'eternal_starlight:enter_abyss': ['abyss', '{p} has gone down into the Abyss.'],
  'ad_astra:moon': ['moon', '{p} has stood on the Moon.'],
  'ad_astra:mars': ['mars', '{p} has landed on Mars.'],
  'ad_astra:venus': ['venus', '{p} has landed on Venus.'],
  'ad_astra:mercury': ['mercury', '{p} has landed on Mercury.'],
  'ad_astra:interstellar': ['beyond', '{p} has left the sun behind.'],
  'iceandfire:iceandfire/kill_if_dragon': ['dragon_slain', '{p} has brought down a dragon.'],
  'iceandfire:iceandfire/dragon_egg': ['dragon_egg', '{p} holds a dragon egg.'],
  'iceandfire:iceandfire/dragonsteel': ['dragonsteel', '{p} has forged dragonsteel.'],
  'iceandfire:iceandfire/kill_hydra': ['hydra_if', '{p} has felled the hydra.'],
  'iceandfire:iceandfire/kill_cyclops': ['cyclops', '{p} has blinded and beaten a cyclops.'],
  'iceandfire:iceandfire/kill_sea_serpent': ['sea_serpent', '{p} has slain a sea serpent.'],
  'fossilslegacy:legacy/time_machine': ['time_machine', '{p} has built a machine that turns back time.'],
  'cataclysm:kill_ignis': ['ignis', '{p} has put out Ignis.'],
  'cataclysm:kill_monstrosity': ['monstrosity', '{p} has broken the Netherite Monstrosity.'],
  'cataclysm:kill_leviathan': ['leviathan', '{p} has slain the Leviathan in the deep.'],
  'cataclysm:kill_ender_guardian': ['ender_guardian', '{p} has defeated the Ender Guardian.'],
  'cataclysm:kill_harbinger': ['harbinger', '{p} has silenced the Harbinger.'],
  'cataclysm:kill_maledictus': ['maledictus', '{p} has ended the Maledictus.'],
  'cataclysm:kill_remnant': ['remnant', '{p} has laid the Ancient Remnant to rest.'],
  'cataclysm:kill_scylla': ['scylla', '{p} has defeated Scylla.'],
  'cataclysm:kill_all_bosses': ['cataclysm_all', '{p} has faced every great foe of the Cataclysm.'],
  'mowziesmobs:kill_frostmaw': ['frostmaw', '{p} has slain the Frostmaw.'],
  'mowziesmobs:kill_ferrous_wroughtnaut': ['wroughtnaut', '{p} has beaten the Ferrous Wroughtnaut.'],
  'mowziesmobs:kill_umvuthi': ['umvuthi', '{p} has overthrown Umvuthi.'],
  'twilightforest:progress_naga': ['naga', '{p} has slain the Naga.'],
  'twilightforest:progress_lich': ['lich', '{p} has destroyed the Twilight Lich.'],
  'twilightforest:progress_hydra': ['hydra_tf', '{p} has slain the Hydra of the fire swamp.'],
  'twilightforest:progress_ur_ghast': ['ur_ghast', '{p} has brought down the Ur-Ghast.'],
  'twilightforest:progress_glacier': ['snow_queen', "{p} has ended the Snow Queen's winter."],
  'aether:bronze_dungeon': ['bronze_dungeon', '{p} has conquered the Bronze Dungeon.'],
  'aether:silver_dungeon': ['silver_dungeon', '{p} has conquered the Silver Dungeon.'],
  'aether:gold_dungeon': ['gold_dungeon', '{p} has conquered the Gold Dungeon.'],
  'eternal_starlight:kill_golem': ['starlight_golem', '{p} has toppled the Starlight Golem.'],
  'eternal_starlight:kill_lunar_monstrosity': ['lunar_monstrosity', '{p} has slain the Lunar Monstrosity.'],
  'minecraft:end/kill_dragon': ['ender_dragon', '{p} has slain the Ender Dragon.'],
  'create:andesite_alloy': ['andesite_alloy', '{p} has made the first andesite alloy. The valley has begun to turn.'],
  'create:water_wheel': ['water_wheel', '{p} has set the first wheel turning on the river.'],
  'create:brass': ['brass', '{p} has cast the first brass.'],
  'create:precision_mechanism': ['precision', '{p} has built a precision mechanism.'],
  'create:steam_engine': ['steam', '{p} has raised steam.'],
  'create:train': ['train', '{p} has built the first train.'],
  'create:long_travel': ['long_travel', '{p} has ridden the rails a long way from home.'],
  'mekanism:steel_ingot': ['steel', '{p} has made the first steel.'],
  'mekanism:digital_miner': ['digital_miner', '{p} has set a machine to dig in the dark.'],
  'mekanism:teleporter': ['teleporter', '{p} has folded distance with a teleporter.'],
  'mekanism:antimatter': ['antimatter', '{p} has made antimatter. Let us hope it stays put.'],
  'ae2:main/controller': ['me_controller', '{p} has woken the first ME network.'],
  'ae2:main/crafting_cpu': ['autocrafting', '{p} has taught the network to craft.'],
  'ae2:main/qnb': ['quantum_bridge', '{p} has bridged two places with a quantum link.'],
  'ars_nouveau:novice_spell_book': ['spellbook', '{p} has written their first spell.'],
  'ars_nouveau:archmage_spell_book': ['archmage', "{p} holds an archmage's book."],
  'irons_spellbooks:irons_spellbooks/make_inscription_table': ['inscription', '{p} has built an inscription table.'],
  'ad_astra:tier_1_rocket': ['rocket', '{p} has built a rocket.'],
  'minecraft:story/mine_diamond': ['diamonds', '{p} has found the first diamonds.'],
  'minecraft:end/elytra': ['elytra', '{p} has taken to the air on wings.']
}
var NX_CHR_KILLS = {  // entity id -> [key, sentence]   (bosses with no kill advancement)
  'minecraft:wither': ['wither', '{p} has destroyed the Wither.'],
  'irons_spellbooks:dead_king': ['dead_king', '{p} has unmade the Dead King.']
}

// ---------------------------------------------------------------- storage
var nxChrStore = function (server) { return server.persistentData.getCompound(NX_CHR_STORE) }
var nxChrHas = function (server, key) { return nxChrStore(server).getBoolean('k:' + key) }
var nxChrEntries = function (server) {
  var st = nxChrStore(server), n = st.getInt('n'), out = []
  for (var i = 0; i < n; i++) {
    var raw = String(st.getString('e' + i) || '')
    if (!raw) continue
    try { out.push(JSON.parse(raw.replace('"day":NaN', '"day":0'))) } catch (e) { console.error('[nx_chronicle] bad entry e' + i + ': ' + e + ' raw=' + raw.substring(0, 120)) }
  }
  return out
}
var nxGameDay = function (server) { var t = parseInt(String(server.overworld().getDayTime()), 10); return isNaN(t) ? 0 : Math.floor(t / 24000) + 1 }
var nxRealDate = function () { var d = new Date(); return d.getDate() + ' ' + NX_MONTHS[d.getMonth()] + ' ' + d.getFullYear() }

var nxTellAll = function (server, text, color) {
  server.runCommandSilent('tellraw @a ' + JSON.stringify({ text: text, color: color || 'gold', italic: true }))
}

// Record a first. opts: {silent: true} = book only; {broadcast: '<text>'} = custom chat line.
// Returns true if it was new. Safe to call as often as you like.
var nxChronicleRecord = function (server, key, playerName, sentence, opts) {
  opts = opts || {}
  key = String(key)
  if (playerName && NX_CHR_EXCLUDED.indexOf(String(playerName)) >= 0) return false
  var st = nxChrStore(server)
  if (st.getBoolean('k:' + key)) return false
  var text = String(sentence).replace(/\{p\}/g, playerName || '')
  var n = st.getInt('n')
  st.putString('e' + n, JSON.stringify({ k: key, p: String(playerName || ''), day: nxGameDay(server), date: nxRealDate(), text: text }))
  st.putInt('n', n + 1)
  st.putBoolean('k:' + key, true)
  server.persistentData.put(NX_CHR_STORE, st)
  console.info('[nx_chronicle] recorded ' + key + ': ' + text)
  if (!opts.silent) {
    nxTellAll(server, opts.broadcast ? String(opts.broadcast) : NX_CHR_PREFIX + text)
    server.runCommandSilent('execute as @a at @s run playsound minecraft:block.bell.resonate master @s ~ ~ ~ 0.35 1.2')
  }
  return true
}

// Other nx_* scripts call nxChronicleRecord, nxBook and nxPaginate directly (server scripts share one scope).

// ---------------------------------------------------------------- the book
var nxChronicleBooks = function (server) {
  var entries = nxChrEntries(server)
  var pages = ['The Chronicle\n\nof the valley and the people who came to it.\n\n' + (entries.length ? entries.length + (entries.length === 1 ? ' entry.' : ' entries.') : 'Nothing is written yet.')]
  var cur = [], used = 0
  entries.forEach(function (e) {
    var para = 'Day ' + e.day + ', ' + e.date + '.\n' + e.text
    var need = nxWrapLines('Day ' + e.day + ', ' + e.date + '.') + nxWrapLines(e.text) + (cur.length ? 1 : 0)
    if (used + need > NX_BOOK_ROWS && cur.length) { pages.push(cur.join('\n\n')); cur = []; used = 0; need -= 1 }
    cur.push(para); used += need
  })
  if (cur.length) pages.push(cur.join('\n\n'))
  var books = [], vol = 0
  var numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  for (var i = 0; i < pages.length; i += 100) {
    var title = pages.length > 100 ? 'The Chronicle, Vol. ' + (numerals[vol] || String(vol + 1)) : 'The Chronicle'
    books.push(nxBook(title, 'The Keepers', pages.slice(i, i + 100)))
    vol++
  }
  return books
}

// ---------------------------------------------------------------- triggers
var nxDimId = function (level) { var d = level.dimension; return String(d && d.location ? d.location() : d) }

ServerEvents.tick(function (event) {
  var server = event.server
  if (server.tickCount % 40 !== 0) return
  server.players.forEach(function (player) {
    var dim = nxDimId(player.level)
    if (dim === 'minecraft:overworld') {
      var holder = player.level.getBiome(player.blockPosition())
      var rk = holder.unwrapKey()
      if (!rk.isPresent()) return
      var loc = rk.get().location()
      var name = NX_PLACE_NAMES['biome.' + loc.namespace + '.' + loc.path]
      if (name) nxChronicleRecord(server, 'biome:' + loc, player.username, '{p} is the first of us to walk ' + nxPlaceInSentence(name) + '.')
    } else if (NX_CHR_DIMS[dim]) {
      nxChronicleRecord(server, NX_CHR_DIMS[dim][0], player.username, NX_CHR_DIMS[dim][1])
    }
  })
  // every 100th in-game day (book only)
  var day = nxGameDay(server)
  if (day >= 100 && day % 100 === 0) nxChronicleRecord(server, 'day:' + day, '', day === 100 ? 'The valley has stood a hundred days.' : 'The valley has stood ' + day + ' days.', { silent: true })
})

PlayerEvents.advancement(function (event) {
  var row = NX_CHR_ADV[String(event.advancement.id)]
  if (row) nxChronicleRecord(event.player.server, row[0], event.player.username, row[1])
})

EntityEvents.death(function (event) {
  var e = event.entity
  var server = event.server
  if (e.isPlayer()) {
    nxChronicleRecord(server, 'first_death', e.username, '{p} was the first of us to die.', { broadcast: 'The Chronicle notes a death.' })
    return
  }
  var row = NX_CHR_KILLS[String(e.type)]
  if (!row) return
  var killer = event.source.entity
  if (killer && killer.isPlayer()) nxChronicleRecord(server, row[0], killer.username, row[1])
})

// ---------------------------------------------------------------- commands
ServerEvents.commandRegistry(function (event) {
  var Commands = event.commands
  event.register(Commands.literal('chronicle').executes(function (ctx) {
    var player = ctx.source.player
    if (!player) return 0
    var books = nxChronicleBooks(player.server)
    books.forEach(function (b) { player.give(b) })
    player.server.runCommandSilent('tellraw ' + player.username + ' ' + JSON.stringify({ text: 'The Chronicle, as it stands today.', color: 'gold', italic: true }))
    return 1
  }))
  event.register(Commands.literal('chronicle_admin').requires(function (s) { return s.hasPermission(2) })
    .then(Commands.literal('list').executes(function (ctx) {
      var entries = nxChrEntries(ctx.source.server)
      ctx.source.sendSystemMessage(Text.of(entries.length + ' Chronicle entries:'))
      entries.forEach(function (e) { ctx.source.sendSystemMessage(Text.of(e.k + '  (day ' + e.day + ', ' + e.p + ')')) })
      return entries.length
    }))
    // Bridge for our own mods (the card packs cannot call a script function):
    //   chronicle_admin record "<key>" <player> <sentence>     key in double quotes when it holds a colon
    // Writes the entry in the book only (the caller does its own announcing). Result 1 = new, 0 = already recorded.
    .then(Commands.literal('record').then(Commands.argument('key', $NxStringArg.string())
      .then(Commands.argument('player', $NxStringArg.word())
        .then(Commands.argument('sentence', $NxStringArg.greedyString()).executes(function (ctx) {
          var isNew = nxChronicleRecord(ctx.source.server, String($NxStringArg.getString(ctx, 'key')),
            String($NxStringArg.getString(ctx, 'player')), String($NxStringArg.getString(ctx, 'sentence')), { silent: true })
          return isNew ? 1 : 0
        })))))
    .then(Commands.literal('remove').then(Commands.argument('key', $NxStringArg.greedyString()).executes(function (ctx) {
      var server = ctx.source.server
      var key = String($NxStringArg.getString(ctx, 'key'))
      var entries = nxChrEntries(server)
      var keep = entries.filter(function (e) { return e.k !== key })
      if (keep.length === entries.length) { ctx.source.sendSystemMessage(Text.red('No Chronicle entry with key ' + key)); return 0 }
      var st = new $NxCompoundTag()
      keep.forEach(function (e, i) { st.putString('e' + i, JSON.stringify(e)); st.putBoolean('k:' + e.k, true) })
      st.putInt('n', keep.length)
      server.persistentData.put(NX_CHR_STORE, st)
      ctx.source.sendSystemMessage(Text.green('Removed Chronicle entry ' + key + '. It can be recorded again.'))
      return 1
    })))
  )
})
