// NxEterna: named landmarks. On a player's first approach: title + subtitle fade and a soft sound, once per player
// per landmark (player persistent data 'nx_landmarks'). The first player ever to reach one also gets a Chronicle entry.
//
// TO ADD A LANDMARK: add one row below and /reload. Fields:
//   name      shown as the title (and in the Chronicle)
//   sub       subtitle line (optional, short)
//   x, z      centre in overworld block coordinates
//   r         radius in blocks (horizontal distance, any height)
//   chronicle Chronicle key for the first visit (optional; omit for no Chronicle entry)
//   line      Chronicle sentence (optional; default "{p} has reached <name>.")
//   dim       dimension id (optional; default minecraft:overworld)
// The key that remembers a visit is the row's `id`; never change the id of a row players have already visited.
var NX_LANDMARKS = [
  { id: 'hearth', name: 'The Hearth', sub: 'Home. The fire is lit.', x: -1026, z: 699, r: 40, chronicle: 'landmark:hearth', line: '{p} has come home to the Hearth.' },
  { id: 'summit', name: 'Mount Aurelion', sub: 'The roof of the valley.', x: -420, z: 20, r: 36, chronicle: 'landmark:summit', line: '{p} has stood on the summit of Mount Aurelion.' },
  { id: 'white_ridge', name: 'The White Ridge', sub: 'He kept it all that time.', x: -370, z: 64, r: 26, chronicle: 'landmark:white_ridge', line: '{p} has found the white dragon, and the camp beside her.' },
  // Chosen from the generator probe of seed 8 (heights and water around home); names are ours.
  { id: 'east_crown', name: 'The East Crown', sub: 'The highest ground within three days of home.', x: 1112, z: -8, r: 80, chronicle: 'landmark:east_crown', line: '{p} has stood on the East Crown, the highest peak yet found.' },
  { id: 'greywatch', name: 'Greywatch Peak', sub: 'Bare stone above the cherry hills.', x: 344, z: -360, r: 70, chronicle: 'landmark:greywatch' },
  { id: 'frostcrown', name: 'Frostcrown', sub: 'Ice all year.', x: 1016, z: -1000, r: 70, chronicle: 'landmark:frostcrown' },
  { id: 'red_sisters', name: 'The Red Sisters', sub: 'Red rock under snow, far to the south-east.', x: 88, z: 2168, r: 90, chronicle: 'landmark:red_sisters' },
  { id: 'whitewater_bay', name: 'Whitewater Bay', sub: 'Chalk cliffs over wide water.', x: -1863, z: -2005, r: 120, chronicle: 'landmark:whitewater_bay' },
  { id: 'heather_mere', name: 'Heather Mere', sub: 'Wide water where the moor meets banded sand.', x: -3437, z: 1770, r: 110, chronicle: 'landmark:heather_mere' },
  { id: 'pinewater', name: 'Pinewater', sub: 'Still water under gold and pine.', x: 1265, z: 2416, r: 110, chronicle: 'landmark:pinewater' },
]

// ---------------------------------------------------------------- validation (one clear line per bad row)
var NX_LANDMARKS_OK = []
;(function () {
  var seen = {}
  NX_LANDMARKS.forEach(function (row, i) {
    var why = null
    if (!row || typeof row !== 'object') why = 'not an object'
    else if (!row.id || typeof row.id !== 'string') why = 'missing id'
    else if (seen[row.id]) why = 'duplicate id ' + row.id
    else if (!row.name || typeof row.name !== 'string') why = 'missing name'
    else if (typeof row.x !== 'number' || typeof row.z !== 'number' || isNaN(row.x) || isNaN(row.z)) why = 'x/z must be numbers'
    else if (typeof row.r !== 'number' || !(row.r > 0) || row.r > 2000) why = 'r must be a number between 1 and 2000'
    if (why) { console.error('[nx_landmarks] row ' + i + ' skipped: ' + why + ' -> ' + JSON.stringify(row)); return }
    seen[row.id] = true
    NX_LANDMARKS_OK.push({ id: row.id, name: row.name, sub: row.sub || '', x: row.x, z: row.z, r2: row.r * row.r,
      dim: row.dim || 'minecraft:overworld', chronicle: row.chronicle || null, line: row.line || ('{p} has reached ' + row.name + '.') })
  })
  console.info('[nx_landmarks] ' + NX_LANDMARKS_OK.length + ' landmarks loaded')
})()

var nxLmDim = function (level) { var d = level.dimension; return String(d && d.location ? d.location() : d) }

var nxLmArrive = function (player, lm) {
  var server = player.server, n = player.username
  // Wait a few seconds so the Traveler's Titles biome title (shown on entering the biome, and at login) has faded:
  // the two used to draw on top of each other.
  server.scheduleInTicks(130, function () {
    server.runCommandSilent('title ' + n + ' times 20 70 30')
    server.runCommandSilent('title ' + n + ' subtitle ' + JSON.stringify({ text: lm.sub, color: 'gray', italic: true }))
    server.runCommandSilent('title ' + n + ' title ' + JSON.stringify({ text: lm.name, color: 'gold' }))
    server.runCommandSilent('execute as ' + n + ' at @s run playsound minecraft:block.amethyst_block.resonate ambient @s ~ ~ ~ 0.7 0.8')
  })
  if (lm.chronicle && typeof nxChronicleRecord === 'function') nxChronicleRecord(server, lm.chronicle, n, lm.line)
}

ServerEvents.tick(function (event) {
  var server = event.server
  if (server.tickCount % 40 !== 20 || NX_LANDMARKS_OK.length === 0) return
  server.players.forEach(function (player) {
    var dim = nxLmDim(player.level)
    var seen = null
    for (var i = 0; i < NX_LANDMARKS_OK.length; i++) {
      var lm = NX_LANDMARKS_OK[i]
      if (lm.dim !== dim) continue
      var dx = player.x - lm.x, dz = player.z - lm.z
      if (dx * dx + dz * dz > lm.r2) continue
      if (seen === null) seen = player.persistentData.getCompound('nx_landmarks')
      if (seen.getBoolean(lm.id)) continue
      seen.putBoolean(lm.id, true)
      player.persistentData.put('nx_landmarks', seen)
      nxLmArrive(player, lm)
      break   // one title at a time; an overlapping landmark fires on the next check
    }
  })
})
