// nx_hearth_safety.js
// Two small protections, added after a test player was killed by a zombie at the Hearth while its
// "loading terrain" screen was still up (2026-11-25).
//
// 1. No NATURAL monster spawns within NX_HEARTH_RADIUS blocks of the Hearth, overworld only. Monsters can still
//    walk in from outside, and spawners, raids, bosses and commands are untouched.
// 2. Login grace: a player who logs in takes no damage for NX_GRACE_TICKS, or until they move a few blocks or
//    hit something, whichever comes first. This covers the long loading screen of a big pack; it cannot be
//    used in a fight, because moving or attacking ends it.
//
// To switch either off, set its number to 0.
var NX_HEARTH_X = -1026
var NX_HEARTH_Z = 699
var NX_HEARTH_RADIUS = 48
var NX_GRACE_TICKS = 400          // 20 seconds
var NX_GRACE_MOVE = 3             // blocks
var NX_HEARTH_DEBUG = false       // true = log every refused spawn (testing only)

EntityEvents.checkSpawn(function (event) {
  if (NX_HEARTH_RADIUS <= 0) return
  var refuse = false
  try {
    var e = event.entity
    if (String(event.type) == 'NATURAL' && e && e.isMonster() && String(event.level.dimension) == 'minecraft:overworld') {
      var dx = event.x - NX_HEARTH_X
      var dz = event.z - NX_HEARTH_Z
      refuse = dx * dx + dz * dz <= NX_HEARTH_RADIUS * NX_HEARTH_RADIUS
      if (refuse && NX_HEARTH_DEBUG) console.info('[nx_hearth_safety] refused ' + e.type + ' at ' + Math.floor(event.x) + ' ' + Math.floor(event.y) + ' ' + Math.floor(event.z))
    }
  } catch (err) {
    console.error('[nx_hearth_safety] checkSpawn: ' + err)
  }
  if (refuse) event.cancel()   // outside the try: cancel() works by throwing, and a catch would swallow it
})

var nxGraceEnd = function (player) {
  var pd = player.persistentData
  if (!pd.getBoolean('nx_grace')) return
  pd.putBoolean('nx_grace', false)
  player.removeEffect('minecraft:resistance')
}

PlayerEvents.loggedIn(function (event) {
  if (NX_GRACE_TICKS <= 0) return
  try {
    var p = event.player
    var pd = p.persistentData
    pd.putBoolean('nx_grace', true)
    pd.putDouble('nx_grace_x', p.x)
    pd.putDouble('nx_grace_z', p.z)
    pd.putInt('nx_grace_left', NX_GRACE_TICKS)
    p.potionEffects.add('minecraft:resistance', NX_GRACE_TICKS, 4, false, false)   // level V: no damage
  } catch (err) {
    console.error('[nx_hearth_safety] loggedIn: ' + err)
  }
})

PlayerEvents.tick(function (event) {
  var p = event.player
  if (p.age % 10 != 0) return
  var pd = p.persistentData
  if (!pd.getBoolean('nx_grace')) return
  var left = pd.getInt('nx_grace_left') - 10
  pd.putInt('nx_grace_left', left)
  var dx = p.x - pd.getDouble('nx_grace_x')
  var dz = p.z - pd.getDouble('nx_grace_z')
  if (left <= 0 || dx * dx + dz * dz > NX_GRACE_MOVE * NX_GRACE_MOVE) nxGraceEnd(p)
})

EntityEvents.afterHurt(function (event) {
  try {
    var attacker = event.source.player
    if (attacker && attacker.persistentData.getBoolean('nx_grace')) nxGraceEnd(attacker)
  } catch (err) {
    console.error('[nx_hearth_safety] afterHurt: ' + err)
  }
})
