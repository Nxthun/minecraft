// NxEterna danger rings without an extra mod (no extra mod). Centre = world spawn; keep equal to tools/structures_safety.py.
// Hostile mobs that enter the overworld get permanent attribute modifiers by distance from the ring centre.
// The modifiers have fixed ids and the mob is flagged, so loading the same mob again never stacks them.
var NX_DANGER_CENTER_X = -1032      // spawn centre (keep equal to tools/structures_safety.py)
var NX_DANGER_CENTER_Z = 696
// [min distance, health multiplier, damage multiplier, speed multiplier]
var NX_DANGER_RINGS = [[0, 1.0, 1.0, 1.0], [500, 1.15, 1.1, 1.0], [1000, 1.4, 1.25, 1.0], [1600, 1.75, 1.4, 1.03], [2400, 2.25, 1.6, 1.06], [4800, 3.0, 2.0, 1.1]]

EntityEvents.spawned(event => {
  var e = event.entity
  if (!e || !e.isLiving() || !e.isMonster() || e.isPlayer()) return
  if (String(event.level.dimension) != 'minecraft:overworld') return
  if (e.persistentData.getBoolean('nx_danger')) return
  var dx = e.x - NX_DANGER_CENTER_X
  var dz = e.z - NX_DANGER_CENTER_Z
  var d = Math.sqrt(dx * dx + dz * dz)
  var ring = NX_DANGER_RINGS[0]
  for (var i = 0; i < NX_DANGER_RINGS.length; i++) if (d >= NX_DANGER_RINGS[i][0]) ring = NX_DANGER_RINGS[i]
  e.persistentData.putBoolean('nx_danger', true)
  if (ring[1] != 1.0) { e.modifyAttribute('minecraft:generic.max_health', 'nxeterna:danger_health', ring[1] - 1.0, 'add_multiplied_base'); e.setHealth(e.getMaxHealth()) }
  if (ring[2] != 1.0 && e.getAttribute('minecraft:generic.attack_damage') != null) e.modifyAttribute('minecraft:generic.attack_damage', 'nxeterna:danger_damage', ring[2] - 1.0, 'add_multiplied_base')
  if (ring[3] != 1.0) e.modifyAttribute('minecraft:generic.movement_speed', 'nxeterna:danger_speed', ring[3] - 1.0, 'add_multiplied_base')
})
