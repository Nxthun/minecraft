var MAX_HEALTH = 'minecraft:generic.max_health'
var MOD_ID = 'forbidden_engine:bonus_hearts'
var DATA_KEY = 'fec_bonus_hearts'
var STAGE_PREFIX = 'fec_heart_'
var TAU = Math.PI * 2

var DENSITY = 1.0
var SPACING = 0.3

var AUTO_STYLE = 'cycle'
var AUTO_ORDER = ['souls', 'void', 'forge', 'starfall', 'tree', 'dragon', 'storm', 'abyss', 'cosmos', 'phoenix']

var JUMP_ATTR = 'minecraft:generic.jump_strength'
var FREEZE_ID = 'forbidden_engine:ritual_freeze'

var EFFECTS = {}
var RITUALS = {}

function dimOf(plr) {
  var raw = null
  try { raw = plr.level.dimension } catch (e) {}
  if (raw == null) {
    try { raw = plr.level().dimension().location() } catch (e) {}
  }
  if (raw == null) return 'minecraft:overworld'
  var s = String(raw)
  var m = s.match(/([a-z0-9_.\-]+:[a-z0-9_.\-\/]+)\]?$/)
  return m ? m[1] : 'minecraft:overworld'
}

function uuidOf(plr) {
  try { return String(plr.getUUID()) } catch (e) {}
  try { return String(plr.uuid) } catch (e) {}
  return String(plr.username)
}

function run(plr, cmd) {
  plr.server.runCommandSilent('execute in ' + dimOf(plr) + ' run ' + cmd)
}

function runAt(plr, x, y, z, cmd) {
  plr.server.runCommandSilent('execute in ' + dimOf(plr) + ' positioned ' + f(x) + ' ' + f(y) + ' ' + f(z) + ' run ' + cmd)
}

function isGone(plr) {
  try { if (plr.isRemoved()) return true } catch (e) {}
  try { if (!plr.isAlive()) return true } catch (e) {}
  return false
}

function f(n) {
  return n.toFixed(2)
}

function rnd(a) {
  return (Math.random() * 2 - 1) * a
}

function cnt(n) {
  return Math.max(1, Math.round(n * DENSITY))
}

function nPoints(len, sp) {
  return Math.max(6, Math.round(len / (sp || SPACING) * DENSITY))
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x))
}

function vec(c) {
  return '[' + f(c[0]) + ',' + f(c[1]) + ',' + f(c[2]) + ']'
}

function lerp3(a, b, u) {
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
}

function note(semi) {
  return Math.pow(2, (semi - 12) / 12)
}

function particle(plr, id, x, y, z, dx, dy, dz, speed, count) {
  run(plr, 'particle ' + id + ' ' + f(x) + ' ' + f(y) + ' ' + f(z) + ' ' + f(dx) + ' ' + f(dy) + ' ' + f(dz) + ' ' + f(speed) + ' ' + count + ' force')
}

function dust(plr, col, scale, x, y, z, dx, dy, dz, count) {
  particle(plr, 'minecraft:dust{color:' + vec(col) + ',scale:' + f(scale) + '}', x, y, z, dx, dy, dz, 0, count)
}

function dustFade(plr, from, to, scale, x, y, z, dx, dy, dz, count) {
  particle(plr, 'minecraft:dust_color_transition{from_color:' + vec(from) + ',scale:' + f(scale) + ',to_color:' + vec(to) + '}', x, y, z, dx, dy, dz, 0, count)
}

function sound(plr, id, vol, pitch) {
  runAt(plr, plr.x, plr.y, plr.z, 'playsound ' + id + ' player @a[distance=..64] ~ ~ ~ ' + vol + ' ' + pitch)
}

function effect(plr, id, seconds, amp) {
  run(plr, 'effect give ' + plr.username + ' minecraft:' + id + ' ' + seconds + ' ' + amp + ' true')
}

function ring(plr, col, scale, cx, cy, cz, R, sp) {
  var n = nPoints(TAU * R, sp)
  for (var i = 0; i < n; i++) {
    var a = i * TAU / n
    dust(plr, col, scale, cx + Math.cos(a) * R, cy, cz + Math.sin(a) * R, 0, 0, 0, 1)
  }
}

function setFrozen(plr, on) {
  run(plr, 'attribute ' + plr.username + ' ' + JUMP_ATTR + ' modifier remove ' + FREEZE_ID)
  if (on) {
    run(plr, 'attribute ' + plr.username + ' ' + JUMP_ATTR + ' modifier add ' + FREEZE_ID + ' -1 add_multiplied_total')
  }
}

function pin(plr, ox, oz) {
  var st = RITUALS[uuidOf(plr)]
  if (st) st.pinned = true
  var dx = plr.x - ox, dz = plr.z - oz
  if (dx * dx + dz * dz > 0.04) {
    run(plr, 'tp ' + plr.username + ' ' + f(ox) + ' ' + f(plr.y) + ' ' + f(oz))
  }
}

function facing(plr) {
  var yaw = 0
  try {
    yaw = Number(plr.yaw) || 0
  } catch (e) {}
  var rad = yaw * Math.PI / 180
  return { fx: -Math.sin(rad), fz: Math.cos(rad), tx: Math.cos(rad), tz: Math.sin(rad) }
}

function getHearts(plr) {
  var a = plr.persistentData.getInt(DATA_KEY)
  var b = 0
  try {
    while (plr.stages.has(STAGE_PREFIX + (b + 1))) b++
  } catch (e) {}
  return Math.max(a, b)
}

function setHearts(plr, n) {
  n = Math.max(0, n)
  plr.persistentData.putInt(DATA_KEY, n)
  try {
    for (var i = 1; i <= n; i++) {
      if (!plr.stages.has(STAGE_PREFIX + i)) plr.stages.add(STAGE_PREFIX + i)
    }
    var j = n + 1
    while (plr.stages.has(STAGE_PREFIX + j)) {
      plr.stages.remove(STAGE_PREFIX + j)
      j++
    }
  } catch (e) {}
}

function applyHearts(plr) {
  var hearts = getHearts(plr)
  run(plr, 'attribute ' + plr.username + ' ' + MAX_HEALTH + ' modifier remove ' + MOD_ID)
  if (hearts > 0) {
    run(plr, 'attribute ' + plr.username + ' ' + MAX_HEALTH + ' modifier add ' + MOD_ID + ' ' + (hearts * 2) + ' add_value')
  }
}

function playFrames(plr, tEnd, frameFn, tag) {
  var id = uuidOf(plr)
  var st = { tag: tag, pinned: false, frozen: false, done: false }
  RITUALS[id] = st

  function finish(reason) {
    if (st.done) return
    st.done = true
    if (st.frozen) {
      try { setFrozen(plr, false) } catch (e) {}
    }
    if (RITUALS[id] === st) delete RITUALS[id]
    if (reason) console.info('[addheart:' + tag + '] stopped: ' + reason)
  }

  function step(t) {
    if (st.done) return
    if (isGone(plr)) {
      finish('player left or died at frame ' + t)
      return
    }

    st.pinned = false
    try {
      frameFn(plr, t)
    } catch (e) {
      console.error('[addheart:' + tag + '] frame ' + t + ' failed: ' + e)
    }

    if (st.pinned !== st.frozen) {
      try {
        setFrozen(plr, st.pinned)
        st.frozen = st.pinned
      } catch (e) {}
    }

    if (t >= tEnd) {
      finish(null)
      return
    }
    plr.server.scheduleInTicks(1, function () { step(t + 1) })
  }

  step(0)
}

EFFECTS.souls = (function () {
  var C_SOUL = [0.40, 0.88, 1.0]
  var C_DEEP = [0.12, 0.38, 0.85]
  var C_WHITE = [0.92, 0.98, 1.0]

  var STREAMS = 8
  var STREAM_LEN = 70
  var STREAM_GAP = 5
  var STREAM_START = 22
  var STREAM_R = 14

  var BEATS = [10, 34, 56, 76, 94, 108, 119, 127]
  var T_FIN = 130
  var T_END = 210

  function ringR(plr, col, scale, cx, cy, cz, R, reveal) {
    var n = nPoints(TAU * R)
    for (var i = 0; i < n; i++) {
      var frac = i / n
      if (frac > reveal) break
      var a = frac * TAU
      dust(plr, col, scale, cx + Math.cos(a) * R, cy, cz + Math.sin(a) * R, 0, 0, 0, 1)
    }
  }

  function ringParticle(plr, id, cx, cy, cz, R, steps) {
    var n = cnt(steps)
    for (var i = 0; i < n; i++) {
      var a = i * TAU / n
      particle(plr, id, cx + Math.cos(a) * R, cy, cz + Math.sin(a) * R, 0, 0, 0, 0, 1)
    }
  }

  function ritualStart(plr) {
    effect(plr, 'resistance', 13, 4)
    sound(plr, 'minecraft:entity.warden.nearby_close', 1.0, 0.7)
    sound(plr, 'minecraft:block.sculk_catalyst.bloom', 1.0, 0.6)
    plr.tell(Text.aqua('[NxEterna] ').append(Text.gray('The souls of the fallen gather...')))
  }

  function groundSouls(plr, t, ox, oy, oz) {
    if (t % 6 === 0) {
      for (var i = 0; i < cnt(2); i++) {
        var a = Math.random() * TAU
        var d = 1.5 + Math.random() * 9
        particle(plr, 'minecraft:sculk_soul', ox + Math.cos(a) * d, oy + 0.1, oz + Math.sin(a) * d, 0, 0, 0, 0, 1)
      }
    }
  }

  function pulse(plr, s, idx, ox, oy, oz) {
    var r = 0.6 + s * 0.9
    ringR(plr, C_DEEP, 1.0, ox, oy + 0.1, oz, r, 1)
    if (s % 2 === 0) ringR(plr, C_SOUL, 0.8, ox, oy + 0.14, oz, Math.max(0.4, r - 0.35), 1)
  }

  function beat(plr, idx) {
    sound(plr, 'minecraft:entity.warden.heartbeat', 2.0, 0.8 + idx * 0.05)
    particle(plr, 'minecraft:sculk_soul', plr.x, plr.y + 1.0, plr.z, 0.3, 0.4, 0.3, 0.02, cnt(4))
    if (idx >= 3) effect(plr, 'glowing', 1, 0)
  }

  function pathPos(ox, oy, oz, ang0, dir, u) {
    var r = 0.3 + (STREAM_R - 0.3) * (1 - u * u)
    var ang = ang0 + dir * u * 1.8
    var y = oy + 0.25 + Math.sin(u * Math.PI) * 1.6 * (1 - u) + u * 0.9
    return [ox + Math.cos(ang) * r, y, oz + Math.sin(ang) * r]
  }

  function streamTick(plr, i, t, t0, ox, oy, oz) {
    var u = (t - t0) / STREAM_LEN
    var ang0 = i * TAU / STREAMS + 0.4
    var dir = (i % 2 === 0) ? 1 : -1

    var h = pathPos(ox, oy, oz, ang0, dir, u)
    dust(plr, C_WHITE, 1.2, h[0], h[1], h[2], 0.02, 0.02, 0.02, 1)
    particle(plr, 'minecraft:soul', h[0], h[1], h[2], 0, 0, 0, 0, 1)
    if ((t - t0) % 3 === 0) {
      particle(plr, 'minecraft:sculk_soul', h[0], h[1], h[2], 0.05, 0.05, 0.05, 0.01, 1)
    }
    for (var k = 1; k <= 4; k++) {
      var uu = u - k * 0.022
      if (uu < 0) break
      var p = pathPos(ox, oy, oz, ang0, dir, uu)
      dustFade(plr, C_SOUL, C_DEEP, 1.0 - k * 0.15, p[0], p[1], p[2], 0, 0, 0, 1)
    }
  }

  function absorb(plr, i) {
    particle(plr, 'minecraft:sculk_soul', plr.x, plr.y + 1.1, plr.z, 0.25, 0.3, 0.25, 0.02, 3)
    dust(plr, C_WHITE, 1.5, plr.x, plr.y + 1.1, plr.z, 0.2, 0.25, 0.2, 3)
    sound(plr, 'minecraft:block.sculk_catalyst.bloom', 0.5, 0.9 + i * 0.06)
  }

  function finale(plr) {
    var x = plr.x, y = plr.y, z = plr.z
    sound(plr, 'minecraft:entity.warden.sonic_boom', 1.0, 0.7)
    sound(plr, 'minecraft:item.totem.use', 1.0, 1.0)
    sound(plr, 'minecraft:block.beacon.power_select', 1.5, 0.9)
    sound(plr, 'minecraft:block.end_portal.spawn', 0.6, 1.3)
    sound(plr, 'minecraft:particle.soul_escape', 1.5, 0.6)

    particle(plr, 'minecraft:flash', x, y + 1, z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:sonic_boom', x, y + 1.0, z, 0, 0, 0, 0, 1)

    for (var i = 0; i < cnt(45); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.55
      particle(plr, 'minecraft:soul', x, y + 1, z, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.28, 0)
    }
    ringParticle(plr, 'minecraft:soul_fire_flame', x, y + 0.2, z, 0.9, 20)

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.aqua('[NxEterna] ').append(Text.white('The souls of the fallen bind into a new heart. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function shock(plr, s) {
    ringR(plr, C_DEEP, 1.2, plr.x, plr.y + 0.15, plr.z, 0.8 + s * 0.75, 1)
    if (s >= 3) ringR(plr, C_SOUL, 1.1, plr.x, plr.y + 0.25, plr.z, 0.8 + (s - 3) * 0.75, 1)
  }

  function aura(plr, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.1) {
      for (var st = 0; st < 3; st++) {
        var a = s * 0.18 + st * TAU / 3
        var y = plr.y + ((s * 0.05 + st * 0.8) % 2.4)
        particle(plr, 'minecraft:soul', plr.x + Math.cos(a) * 0.9, y, plr.z + Math.sin(a) * 0.9, 0, 0, 0, 0, 1)
        dustFade(plr, C_SOUL, C_DEEP, 0.9, plr.x + Math.cos(a + 0.3) * 0.9, y, plr.z + Math.sin(a + 0.3) * 0.9, 0, 0, 0, 1)
      }
    }
    if (k > 0.3 && s % 3 === 0) {
      particle(plr, 'minecraft:sculk_soul', plr.x + rnd(1.2), plr.y + 0.1, plr.z + rnd(1.2), 0, 0, 0, 0, 1)
    }
    if (s === 28 || s === 60 || s === 100) {
      sound(plr, 'minecraft:entity.warden.heartbeat', 1.2, 0.7)
      ringR(plr, C_DEEP, 1.0, plr.x, plr.y + 0.9, plr.z, 0.6, 1)
    }
    if (s === 40) sound(plr, 'minecraft:block.amethyst_block.resonate', 1.0, 0.6)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, ox, oy, oz) {
    if (t === 0) ritualStart(plr)
    if (t < T_FIN + 60) pin(plr, ox, oz)
    if (t < T_FIN) groundSouls(plr, t, ox, oy, oz)

    for (var b = 0; b < BEATS.length; b++) {
      if (t === BEATS[b]) beat(plr, b)
      if (t >= BEATS[b] && t < BEATS[b] + 8) pulse(plr, t - BEATS[b], b, ox, oy, oz)
    }

    for (var i = 0; i < STREAMS; i++) {
      var t0 = STREAM_START + i * STREAM_GAP
      if (t === t0) sound(plr, 'minecraft:particle.soul_escape', 1.0, 0.7 + i * 0.05)
      if (t >= t0 && t <= t0 + STREAM_LEN) streamTick(plr, i, t, t0, ox, oy, oz)
      if (t === t0 + STREAM_LEN) absorb(plr, i)
    }

    if (t === T_FIN) finale(plr)
    if (t >= T_FIN && t < T_FIN + 15) shock(plr, t - T_FIN)
    if (t > T_FIN) aura(plr, t)
  }

  return {
    start: function (plr) {
      var ox = plr.x, oy = plr.y, oz = plr.z
      playFrames(plr, T_END, function (p, t) { frame(p, t, ox, oy, oz) }, 'souls')
    }
  }
})()

EFFECTS['void'] = (function () {
  var C_VOID = [0.55, 0.15, 0.95]
  var C_MAG = [0.95, 0.20, 0.70]
  var C_GOLD = [1.0, 0.80, 0.25]
  var C_DARK = [0.20, 0.02, 0.35]
  var C_WHITE = [0.97, 0.93, 1.0]

  var RUNE_SP = 0.45
  var RUNE_STEP = 4
  var RUNE_R = 5.2
  var HEX_R = 5.0
  var PILLAR_H = 3.5

  var BEATS = [30, 54, 74, 92, 106, 118, 128, 135]
  var T_HEART = 60
  var T_COLLAPSE = 112
  var T_FIN = 140
  var T_END = 215

  function ringR(plr, col, scale, cx, cy, cz, R, reveal, sp) {
    var n = nPoints(TAU * R, sp)
    for (var i = 0; i < n; i++) {
      var frac = i / n
      if (frac > reveal) break
      var a = frac * TAU
      dust(plr, col, scale, cx + Math.cos(a) * R, cy, cz + Math.sin(a) * R, 0, 0, 0, 1)
    }
  }

  function line(plr, col, scale, x1, y, z1, x2, z2, reveal, sp) {
    var len = Math.sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1))
    var n = nPoints(len, sp)
    for (var i = 0; i <= n; i++) {
      var frac = i / n
      if (frac > reveal) break
      dust(plr, col, scale, x1 + (x2 - x1) * frac, y, z1 + (z2 - z1) * frac, 0, 0, 0, 1)
    }
  }

  function ritualStart(plr) {
    effect(plr, 'resistance', 13, 4)
    sound(plr, 'minecraft:block.respawn_anchor.charge', 1.0, 0.6)
    sound(plr, 'minecraft:entity.wither.ambient', 0.8, 0.5)
    plr.tell(Text.lightPurple('[NxEterna] ').append(Text.gray('The void stirs beneath your feet...')))
  }

  function rune(plr, t, ox, oy, oz) {
    var rot = t * 0.025
    var rev = Math.min(1, t / 40)
    var y = oy + 0.08

    ringR(plr, C_VOID, 1.2, ox, y, oz, RUNE_R, rev, RUNE_SP)
    ringR(plr, C_MAG, 1.0, ox, y + 0.03, oz, 2.4, rev, RUNE_SP)

    for (var tri = 0; tri < 2; tri++) {
      var col = (tri === 0) ? C_VOID : C_MAG
      for (var j = 0; j < 3; j++) {
        var a1 = rot + (tri + 2 * j) * TAU / 6
        var a2 = rot + (tri + 2 * ((j + 1) % 3)) * TAU / 6
        line(plr, col, 1.1,
          ox + Math.cos(a1) * HEX_R, y + 0.02, oz + Math.sin(a1) * HEX_R,
          ox + Math.cos(a2) * HEX_R, oz + Math.sin(a2) * HEX_R, rev, RUNE_SP)
      }
    }
    for (var k = 0; k < 6; k++) {
      var a = rot + k * TAU / 6
      dust(plr, C_GOLD, 1.6, ox + Math.cos(a) * HEX_R, y + 0.1, oz + Math.sin(a) * HEX_R, 0.1, 0.1, 0.1, 2)
    }
  }

  function groundPortal(plr, ox, oy, oz) {
    for (var i = 0; i < cnt(2); i++) {
      var a = Math.random() * TAU
      var d = 1.0 + Math.random() * 4.5
      particle(plr, 'minecraft:portal', ox + Math.cos(a) * d, oy + 0.3, oz + Math.sin(a) * d, 0.2, 0.6, 0.2, 0.5, 3)
    }
  }

  function pillars(plr, t, ox, oy, oz) {
    var rot = t * 0.025
    var grow = Math.min(1, (t - 20) / 40)
    var h = PILLAR_H * grow
    for (var k = 0; k < 6; k++) {
      var a = rot + k * TAU / 6
      var px = ox + Math.cos(a) * HEX_R
      var pz = oz + Math.sin(a) * HEX_R
      var n = Math.max(2, Math.round(h / 0.5 * DENSITY))
      for (var i = 0; i <= n; i++) {
        var y = oy + 0.1 + h * i / n
        dustFade(plr, C_VOID, C_DARK, 1.1, px, y, pz, 0.04, 0, 0.04, 1)
      }
      particle(plr, 'minecraft:end_rod', px, oy + h + 0.1, pz, 0, 0.02, 0, 0.01, 1)
    }
  }

  function orbPos(ox, oy, oz, a0, dir, u) {
    var r = HEX_R * (1 - u)
    var ang = a0 + dir * u * 2.2
    var y = oy + PILLAR_H + (1.2 - PILLAR_H) * u + Math.sin(u * Math.PI) * 0.6
    return [ox + Math.cos(ang) * r, y, oz + Math.sin(ang) * r]
  }

  function orbs(plr, t, ox, oy, oz) {
    var rot = t * 0.025
    for (var k = 0; k < 6; k++) {
      var ph = (t - 50 + k * 3) % 22
      var u = ph / 22
      var a0 = rot + k * TAU / 6
      var dir = (k % 2 === 0) ? 1 : -1

      var p = orbPos(ox, oy, oz, a0, dir, u)
      dust(plr, C_WHITE, 1.2, p[0], p[1], p[2], 0.02, 0.02, 0.02, 1)
      particle(plr, 'minecraft:end_rod', p[0], p[1], p[2], 0, 0, 0, 0, 1)

      for (var j = 1; j <= 3; j++) {
        var uu = u - j * 0.04
        if (uu < 0) break
        var q = orbPos(ox, oy, oz, a0, dir, uu)
        dustFade(plr, C_MAG, C_DARK, 1.0 - j * 0.2, q[0], q[1], q[2], 0, 0, 0, 1)
      }
      if (ph === 21) {
        particle(plr, 'minecraft:witch', plr.x, plr.y + 1.2, plr.z, 0.25, 0.3, 0.25, 0.02, 3)
        if (k === 0) sound(plr, 'minecraft:block.amethyst_block.chime', 0.6, 0.6 + (t - 50) * 0.008)
      }
    }
  }

  function drawHeart(plr, cx, cy, cz, S, rot, reveal, n, scale, colA, colB) {
    var c = Math.cos(rot), s = Math.sin(rot)
    for (var i = 0; i < n; i++) {
      var frac = i / n
      if (frac > reveal) break
      var th = Math.PI + frac * TAU
      var hx = Math.pow(Math.sin(th), 3)
      var hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
      dustFade(plr, colA, colB, scale, cx + hx * S * c, cy + hy * S, cz + hx * S * s, 0, 0, 0, 1)
    }
  }

  function bigHeart(plr, t, ox, oy, oz) {
    var reveal = Math.min(1, (t - T_HEART) / 30)
    var k = (t >= T_COLLAPSE) ? (t - T_COLLAPSE) / (T_FIN - T_COLLAPSE) : 0

    var pulse = 1
    for (var b = 0; b < BEATS.length; b++) {
      if (t >= BEATS[b] && t < BEATS[b] + 4) pulse = 1 + 0.18 * (1 - (t - BEATS[b]) / 4)
    }

    var S = 1.1 * pulse * (1 - 0.85 * k)
    var cy = oy + 3.2 - 2.1 * k
    var rot = t * 0.08

    drawHeart(plr, ox, cy, oz, S, rot, reveal, cnt(56), 1.0, C_MAG, C_VOID)
    if (reveal >= 1 && t % 4 === 0) {
      particle(plr, 'minecraft:end_rod', ox + rnd(0.8), cy + rnd(0.7), oz + rnd(0.8), 0, 0, 0, 0, 1)
    }
  }

  function beat(plr, idx) {
    sound(plr, 'minecraft:entity.warden.heartbeat', 2.0, 0.8 + idx * 0.05)
    particle(plr, 'minecraft:witch', plr.x, plr.y + 1.0, plr.z, 0.3, 0.4, 0.3, 0.02, cnt(4))
    if (idx >= 3) effect(plr, 'glowing', 1, 0)
  }

  function finale(plr) {
    var x = plr.x, y = plr.y, z = plr.z
    sound(plr, 'minecraft:item.totem.use', 1.0, 0.9)
    sound(plr, 'minecraft:block.beacon.activate', 1.5, 0.8)
    sound(plr, 'minecraft:entity.ender_dragon.growl', 0.7, 0.8)
    sound(plr, 'minecraft:entity.evoker.cast_spell', 1.2, 0.6)

    particle(plr, 'minecraft:flash', x, y + 1, z, 0, 0, 0, 0, 1)

    for (var h = 0; h <= 14; h += 0.5) {
      dust(plr, C_WHITE, 1.4, x, y + h, z, 0.12, 0, 0.12, 1)
      dustFade(plr, C_GOLD, C_MAG, 1.2, x, y + h + 0.25, z, 0.2, 0, 0.2, 1)
    }
    for (var i = 0; i < cnt(40); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.6
      particle(plr, 'minecraft:end_rod', x, y + 1, z, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.3, 0)
    }
    particle(plr, 'minecraft:dragon_breath', x, y + 0.3, z, 0.6, 0.1, 0.6, 0.03, cnt(30))

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.lightPurple('[NxEterna] ').append(Text.white('The void yields a new heart. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function shock(plr, s) {
    if (s % 2 !== 0) return
    ringR(plr, C_MAG, 1.3, plr.x, plr.y + 0.15, plr.z, 0.8 + s * 0.85, 1, 0.6)
    if (s >= 4) ringR(plr, C_GOLD, 1.1, plr.x, plr.y + 0.25, plr.z, 0.8 + (s - 4) * 0.85, 1, 0.6)
  }

  function aura(plr, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.1) {
      for (var st = 0; st < 3; st++) {
        var a = s * 0.2 + st * TAU / 3
        var y = plr.y + ((s * 0.05 + st * 0.8) % 2.4)
        dustFade(plr, C_GOLD, C_VOID, 0.9, plr.x + Math.cos(a) * 0.9, y, plr.z + Math.sin(a) * 0.9, 0, 0, 0, 1)
        particle(plr, 'minecraft:end_rod', plr.x + Math.cos(a + 0.3) * 0.9, y, plr.z + Math.sin(a + 0.3) * 0.9, 0, 0, 0, 0, 1)
      }
    }
    if (k > 0.3 && s % 4 === 0) {
      drawHeart(plr, plr.x, plr.y + 2.6, plr.z, 0.35, s * 0.1, 1, cnt(24), 0.8, C_MAG, C_GOLD)
    }
    if (k > 0.3 && s % 3 === 0) {
      particle(plr, 'minecraft:portal', plr.x + rnd(1.2), plr.y + 0.2, plr.z + rnd(1.2), 0, 0.3, 0, 0.3, 2)
    }
    if (s === 28 || s === 60 || s === 100) {
      sound(plr, 'minecraft:entity.warden.heartbeat', 1.2, 0.7)
      ringR(plr, C_VOID, 1.0, plr.x, plr.y + 0.9, plr.z, 0.6, 1)
    }
    if (s === 40) sound(plr, 'minecraft:block.amethyst_block.resonate', 1.0, 0.6)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, ox, oy, oz) {
    if (t === 0) ritualStart(plr)
    if (t < T_FIN + 60) pin(plr, ox, oz)

    if (t < T_FIN) {
      if (t % RUNE_STEP === 0) rune(plr, t, ox, oy, oz)
      if (t % 4 === 0) groundPortal(plr, ox, oy, oz)
      if (t >= 20 && t % 3 === 0) pillars(plr, t, ox, oy, oz)
      if (t >= 50 && t <= 115) orbs(plr, t, ox, oy, oz)
      if (t >= T_HEART && t % 2 === 0) bigHeart(plr, t, ox, oy, oz)
    }
    for (var b = 0; b < BEATS.length; b++) {
      if (t === BEATS[b]) beat(plr, b)
    }
    if (t === T_FIN) finale(plr)
    if (t >= T_FIN && t < T_FIN + 15) shock(plr, t - T_FIN)
    if (t > T_FIN) aura(plr, t)
  }

  return {
    start: function (plr) {
      var ox = plr.x, oy = plr.y, oz = plr.z
      playFrames(plr, T_END, function (p, t) { frame(p, t, ox, oy, oz) }, 'void')
    }
  }
})()

EFFECTS.forge = (function () {
  var C_STEEL = [0.72, 0.76, 0.82]
  var C_ORANGE = [1.0, 0.55, 0.10]
  var C_EMBER = [0.85, 0.12, 0.05]
  var C_GOLD = [1.0, 0.82, 0.30]
  var C_HOT = [1.0, 0.96, 0.80]

  var GEARS = 4
  var GEAR_D = 3.4
  var GEAR_R = 1.4
  var TOOTH = 0.22
  var TEETH = 8
  var GEAR_Y = 1.6
  var CORE_Y = 2.4
  var CORE_R = 0.9

  var HAMMERS = [42, 62, 78, 92, 104, 114]
  var T_COLLAPSE = 114
  var T_FIN = 135
  var T_END = 205

  function flameRing(plr, cx, cy, cz, R) {
    var n = nPoints(TAU * R, 0.8)
    for (var i = 0; i < n; i++) {
      var a = i * TAU / n
      particle(plr, 'minecraft:flame', cx + Math.cos(a) * R, cy, cz + Math.sin(a) * R, 0, 1, 0, 0.03, 0)
    }
  }

  function ringPlane(plr, col, scale, cx, cy, cz, R, ux, uy, uz, vx, vy, vz, n) {
    for (var i = 0; i < n; i++) {
      var a = i * TAU / n
      var c = Math.cos(a) * R, s = Math.sin(a) * R
      dust(plr, col, scale, cx + c * ux + s * vx, cy + c * uy + s * vy, cz + c * uz + s * vz, 0, 0, 0, 1)
    }
  }

  function ritualStart(plr) {
    effect(plr, 'resistance', 13, 4)
    sound(plr, 'minecraft:block.anvil.place', 0.8, 0.6)
    sound(plr, 'minecraft:block.piston.extend', 1.0, 0.7)
    plr.tell(Text.gold('[NxEterna] ').append(Text.gray('Gears grind awake beneath the earth...')))
  }

  function rotAt(t) {
    return 0.02 * t + 0.00035 * t * t
  }

  function gear(plr, ox, oy, oz, phi, rot, scale, bodyCol) {
    var cx = ox + Math.cos(phi) * GEAR_D
    var cy = oy + GEAR_Y
    var cz = oz + Math.sin(phi) * GEAR_D
    var tx = -Math.sin(phi), tz = Math.cos(phi)

    var n = cnt(48)
    for (var i = 0; i < n; i++) {
      var g = i * TAU / n
      var r = (GEAR_R + (Math.sin(TEETH * g) > 0 ? TOOTH : 0)) * scale
      var u = r * Math.cos(g + rot), v = r * Math.sin(g + rot)
      dust(plr, bodyCol, 1.0, cx + tx * u, cy + v, cz + tz * u, 0, 0, 0, 1)
    }

    var m = cnt(5)
    for (var s = 0; s < 4; s++) {
      var ang = rot + s * TAU / 4
      for (var j = 1; j <= m; j++) {
        var rr = GEAR_R * scale * j / (m + 1)
        dust(plr, C_STEEL, 0.8, cx + tx * rr * Math.cos(ang), cy + rr * Math.sin(ang), cz + tz * rr * Math.cos(ang), 0, 0, 0, 1)
      }
    }

    dust(plr, C_GOLD, 1.5, cx, cy, cz, 0.05, 0.05, 0.05, 2)

    if (Math.random() < 0.35) {
      var ga = Math.random() * TAU
      var gr = (GEAR_R + TOOTH) * scale
      particle(plr, 'minecraft:electric_spark', cx + tx * gr * Math.cos(ga), cy + gr * Math.sin(ga), cz + tz * gr * Math.cos(ga), 0.1, 0.1, 0.1, 0.05, 1)
    }
  }

  function gears(plr, ox, oy, oz, rot, scale) {
    for (var k = 0; k < GEARS; k++) {
      var phi = 0.785 + k * TAU / GEARS
      var dir = (k % 2 === 0) ? 1 : -1
      var col = (k % 2 === 0) ? C_STEEL : C_ORANGE
      gear(plr, ox, oy, oz, phi, rot * dir, scale, col)
    }
  }

  function steam(plr, ox, oy, oz) {
    for (var k = 0; k < GEARS; k++) {
      var phi = 0.785 + k * TAU / GEARS
      particle(plr, 'minecraft:campfire_cosy_smoke', ox + Math.cos(phi) * GEAR_D, oy + 0.2, oz + Math.sin(phi) * GEAR_D, 0, 1, 0, 0.05, 0)
    }
  }

  function core(plr, t, ox, oy, oz) {
    var k = (t >= T_COLLAPSE) ? (t - T_COLLAPSE) / (T_FIN - T_COLLAPSE) : 0
    var grow = Math.min(1, (t - 20) / 30)
    var R = CORE_R * grow * (1 - 0.9 * k)
    var cy = oy + CORE_Y - (CORE_Y - 1.2) * k
    var r = t * 0.12
    var n = cnt(26)

    ringPlane(plr, C_ORANGE, 1.0, ox, cy, oz, R, Math.cos(r), 0, Math.sin(r), 0, 1, 0, n)
    ringPlane(plr, C_GOLD, 1.0, ox, cy, oz, R, Math.cos(r + 1.5708), 0, Math.sin(r + 1.5708), 0, 1, 0, n)
    ringPlane(plr, C_EMBER, 1.0, ox, cy, oz, R * 0.8, 1, 0, 0, 0, Math.sin(r * 0.7), Math.cos(r * 0.7), n)

    particle(plr, 'minecraft:flame', ox, cy, oz, 0.05, 0.05, 0.05, 0.01, cnt(2))
    dust(plr, C_HOT, 1.6 * grow, ox, cy, oz, 0.08, 0.08, 0.08, 2)
  }

  function strike(plr, idx, ox, oy, oz) {
    sound(plr, 'minecraft:block.anvil.use', 1.4, 0.7 + idx * 0.08)
    var cy = oy + CORE_Y - (CORE_Y - 1.2) * Math.max(0, (HAMMERS[idx] - T_COLLAPSE) / (T_FIN - T_COLLAPSE))
    particle(plr, 'minecraft:electric_spark', ox, cy, oz, 0.5, 0.5, 0.5, 0.4, cnt(25))
    particle(plr, 'minecraft:lava', ox, cy, oz, 0.6, 0.4, 0.6, 0.1, cnt(6))
    ring(plr, C_ORANGE, 1.1, ox, oy + 0.12, oz, 1.2, 0.35)
    if (idx >= 3) effect(plr, 'glowing', 1, 0)
  }

  function finale(plr) {
    var x = plr.x, y = plr.y, z = plr.z
    sound(plr, 'minecraft:item.totem.use', 1.0, 0.9)
    sound(plr, 'minecraft:block.anvil.land', 1.2, 0.5)
    sound(plr, 'minecraft:item.firecharge.use', 1.5, 0.6)
    sound(plr, 'minecraft:block.piston.contract', 1.2, 0.5)

    particle(plr, 'minecraft:flash', x, y + 1, z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:explosion', x, y + 1, z, 0, 0, 0, 0, 1)

    for (var i = 0; i < cnt(45); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.5
      particle(plr, 'minecraft:electric_spark', x, y + 1, z, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.35, 0)
    }
    particle(plr, 'minecraft:lava', x, y + 1, z, 0.8, 0.5, 0.8, 0.1, cnt(14))
    particle(plr, 'minecraft:cloud', x, y + 0.3, z, 0.8, 0.1, 0.8, 0.08, cnt(25))

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.gold('[NxEterna] ').append(Text.white('The Engine forges a new heart. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function shock(plr, s) {
    if (s % 2 !== 0) return
    var R = 0.8 + s * 0.85
    ring(plr, C_ORANGE, 1.3, plr.x, plr.y + 0.15, plr.z, R, 0.6)
    flameRing(plr, plr.x, plr.y + 0.1, plr.z, R)
    if (s >= 4) ring(plr, C_GOLD, 1.1, plr.x, plr.y + 0.25, plr.z, R - 3.4, 0.6)
  }

  function aura(plr, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.1) {
      for (var st = 0; st < 3; st++) {
        var a = s * 0.2 + st * TAU / 3
        var y = plr.y + ((s * 0.05 + st * 0.8) % 2.4)
        dustFade(plr, C_ORANGE, C_EMBER, 0.9, plr.x + Math.cos(a) * 0.9, y, plr.z + Math.sin(a) * 0.9, 0, 0, 0, 1)
        particle(plr, 'minecraft:small_flame', plr.x + Math.cos(a + 0.3) * 0.9, y, plr.z + Math.sin(a + 0.3) * 0.9, 0, 1, 0, 0.01, 0)
      }
    }
    if (k > 0.3 && s % 4 === 0) {
      particle(plr, 'minecraft:lava', plr.x + rnd(1.0), plr.y + 0.5, plr.z + rnd(1.0), 0, 0, 0, 0, 1)
    }
    if (s === 30) {
      sound(plr, 'minecraft:block.fire.extinguish', 1.2, 0.8)
      particle(plr, 'minecraft:cloud', plr.x, plr.y + 0.5, plr.z, 0.6, 0.3, 0.6, 0.05, cnt(20))
    }
    if (s === 45) sound(plr, 'minecraft:block.anvil.hit', 0.6, 1.2)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, ox, oy, oz) {
    if (t === 0) ritualStart(plr)
    if (t < T_FIN + 40) pin(plr, ox, oz)

    if (t < T_FIN) {
      if (t >= 4 && t % 3 === 0) gears(plr, ox, oy, oz, rotAt(t), Math.min(1, t / 30))
      if (t % 4 === 0) steam(plr, ox, oy, oz)
      if (t >= 20 && t % 2 === 0) core(plr, t, ox, oy, oz)

      if (t === 8 || t === 16 || t === 24 || t === 32) {
        sound(plr, 'minecraft:block.piston.extend', 0.9, 0.6 + t * 0.012)
      }
      if (t >= 36 && t % 10 === 0) sound(plr, 'minecraft:block.iron_trapdoor.open', 0.5, 0.6 + t * 0.005)
    }

    for (var h = 0; h < HAMMERS.length; h++) {
      if (t === HAMMERS[h]) strike(plr, h, ox, oy, oz)
    }

    if (t === T_FIN) finale(plr)
    if (t >= T_FIN && t < T_FIN + 17) shock(plr, t - T_FIN)

    if (t > T_FIN && t <= T_FIN + 40 && t % 3 === 0) {
      var s = t - T_FIN
      var rot = rotAt(T_FIN) + 0.115 * s * (1 - s / 80)
      gears(plr, ox, oy, oz, rot, Math.max(0, 1 - s / 40))
    }

    if (t > T_FIN) aura(plr, t)
  }

  return {
    start: function (plr) {
      var ox = plr.x, oy = plr.y, oz = plr.z
      playFrames(plr, T_END, function (p, t) { frame(p, t, ox, oy, oz) }, 'forge')
    }
  }
})()

EFFECTS.starfall = (function () {
  var C_GOLD = [1.0, 0.85, 0.35]
  var C_WHITE = [0.98, 0.98, 1.0]
  var C_BLUE = [0.35, 0.55, 1.0]
  var C_CYAN = [0.30, 0.95, 0.85]
  var C_GREEN = [0.35, 1.0, 0.55]
  var C_PINK = [1.0, 0.45, 0.90]
  var C_VIOLET = [0.60, 0.35, 1.0]

  var STARS = 10
  var HEART_DIST = 6
  var HEART_Y = 5.5
  var HEART_S = 2.2
  var ORDER = [0, 5, 2, 7, 3, 8, 1, 6, 4, 9]
  var SEMI = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]

  var T_FIRST = 20
  var T_GAP = 6
  var T_FLIGHT = 20
  var T_LINES = 76
  var T_ABSORB = 100
  var T_ABS_GAP = 3
  var T_ABS_FLIGHT = 14
  var T_FIN = 142
  var T_END = 215

  function line3(plr, col, scale, a, b, reveal) {
    var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz)
    var n = nPoints(len, 0.35)
    for (var i = 0; i <= n; i++) {
      var fr = i / n
      if (fr > reveal) break
      dust(plr, col, scale, a[0] + dx * fr, a[1] + dy * fr, a[2] + dz * fr, 0.02, 0.02, 0.02, 1)
    }
  }

  function buildScene(plr) {
    var fc = facing(plr)
    var S = { ox: plr.x, oy: plr.y, oz: plr.z, pts: [], off: [], land: [], absorb: [], rank: [], tx: fc.tx, tz: fc.tz }
    var cx = S.ox + fc.fx * HEART_DIST
    var cz = S.oz + fc.fz * HEART_DIST
    var cy = S.oy + HEART_Y

    for (var i = 0; i < STARS; i++) {
      var th = Math.PI + i * TAU / STARS
      var hx = Math.pow(Math.sin(th), 3)
      var hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
      S.pts.push([cx + fc.tx * hx * HEART_S, cy + hy * HEART_S, cz + fc.tz * hx * HEART_S])
      S.off.push([rnd(9), 15 + Math.random() * 4, rnd(9)])
    }
    for (var r = 0; r < ORDER.length; r++) {
      var idx = ORDER[r]
      S.rank[idx] = r
      S.land[idx] = T_FIRST + r * T_GAP
      S.absorb[idx] = T_ABSORB + r * T_ABS_GAP
    }
    return S
  }

  function ritualStart(plr) {
    effect(plr, 'resistance', 13, 4)
    sound(plr, 'minecraft:block.amethyst_block.resonate', 1.0, 0.5)
    sound(plr, 'minecraft:block.beacon.ambient', 0.8, 1.4)
    plr.tell(Text.aqua('[NxEterna] ').append(Text.yellow('The stars lean closer...')))
  }

  function aurora(plr, t, S, inten) {
    if (inten < 0.05) inten = 0.05
    for (var c = 0; c < 2; c++) {
      var base = c * Math.PI + t * 0.012 + 0.6
      var from = (c === 0) ? C_GREEN : C_PINK
      var to = (c === 0) ? C_CYAN : C_VIOLET
      var cols = cnt(12)
      for (var j = 0; j < cols; j++) {
        var th = base + j / (cols - 1) * 1.5
        var wave = Math.sin(th * 3 + t * 0.12 + c * 2) * 1.1
        var r = 9 + Math.sin(th * 2 + t * 0.05) * 0.6
        var x = S.ox + Math.cos(th) * r
        var z = S.oz + Math.sin(th) * r
        for (var row = 0; row < 4; row++) {
          var y = S.oy + 9 + wave + row * 0.8
          dustFade(plr, from, to, 2.4 * (1 - row * 0.18) * inten, x, y, z, 0.3, 0.15, 0.3, 1)
        }
      }
    }
  }

  function groundTwinkle(plr, S) {
    for (var i = 0; i < cnt(3); i++) {
      var a = Math.random() * TAU
      var d = Math.random() * 4.5
      particle(plr, 'minecraft:end_rod', S.ox + Math.cos(a) * d, S.oy + 0.1, S.oz + Math.sin(a) * d, 0, 1, 0, 0.012, 0)
    }
  }

  function cometDraw(plr, posFn, u, headCol) {
    var h = posFn(u)
    dust(plr, headCol, 1.5, h[0], h[1], h[2], 0.02, 0.02, 0.02, 1)
    particle(plr, 'minecraft:end_rod', h[0], h[1], h[2], 0, 0, 0, 0, 1)
    for (var k = 1; k <= 6; k++) {
      var uu = u - k * 0.03
      if (uu < 0) break
      var p = posFn(uu)
      dustFade(plr, C_GOLD, C_BLUE, 1.3 - k * 0.16, p[0], p[1], p[2], 0, 0, 0, 1)
    }
  }

  function glint(plr, S, p, size) {
    dust(plr, C_WHITE, 1.8, p[0], p[1], p[2], 0.04, 0.04, 0.04, 2)
    for (var k = 1; k <= 2; k++) {
      var d = size * k / 2
      dust(plr, C_GOLD, 1.0, p[0], p[1] + d, p[2], 0, 0, 0, 1)
      dust(plr, C_GOLD, 1.0, p[0], p[1] - d, p[2], 0, 0, 0, 1)
      dust(plr, C_GOLD, 1.0, p[0] + S.tx * d, p[1], p[2] + S.tz * d, 0, 0, 0, 1)
      dust(plr, C_GOLD, 1.0, p[0] - S.tx * d, p[1], p[2] - S.tz * d, 0, 0, 0, 1)
    }
  }

  function stars(plr, t, S) {
    for (var i = 0; i < STARS; i++) {
      var P = S.pts[i]
      var land = S.land[i]
      var ab = S.absorb[i]

      if (t >= land - T_FLIGHT && t < land) {
        var u = (t - (land - T_FLIGHT)) / T_FLIGHT
        var start = [P[0] + S.off[i][0], P[1] + S.off[i][1], P[2] + S.off[i][2]]
        var wob = (i % 2 === 0) ? 1 : -1
        cometDraw(plr, function (uu) {
          var q = lerp3(start, P, Math.pow(uu, 1.6))
          var side = Math.sin(uu * Math.PI) * 0.8 * wob
          return [q[0] + S.tx * side, q[1], q[2] + S.tz * side]
        }, u, C_WHITE)
      }

      if (t === land) {
        particle(plr, 'minecraft:firework', P[0], P[1], P[2], 0, 0, 0, 0.06, cnt(8))
        dust(plr, C_GOLD, 2.2, P[0], P[1], P[2], 0.3, 0.3, 0.3, cnt(6))
        var pitch = note(SEMI[S.rank[i]])
        sound(plr, 'minecraft:block.note_block.chime', 1.6, pitch)
        sound(plr, 'minecraft:block.amethyst_block.chime', 0.8, pitch + 0.2)
      }

      if (t >= land && t < ab && t % 3 === 0) {
        glint(plr, S, P, 0.4 + 0.08 * Math.sin(t * 0.3 + i))
        if (t % 6 === 0) particle(plr, 'minecraft:end_rod', P[0], P[1], P[2], 0.1, 0.1, 0.1, 0.01, 1)
      }

      if (t >= ab && t <= ab + T_ABS_FLIGHT) {
        var ua = (t - ab) / T_ABS_FLIGHT
        var dir = (S.rank[i] % 2 === 0) ? 1 : -1
        cometDraw(plr, function (uu) {
          var chest = [plr.x, plr.y + 1.2, plr.z]
          var q = lerp3(P, chest, Math.pow(uu, 1.4))
          var side = Math.sin(uu * Math.PI) * 1.0 * dir
          return [q[0] + S.tx * side, q[1], q[2] + S.tz * side]
        }, ua, C_WHITE)
      }

      if (t === ab + T_ABS_FLIGHT) {
        var j = S.rank[i]
        sound(plr, 'minecraft:entity.experience_orb.pickup', 1.0, 0.7 + j * 0.07)
        particle(plr, 'minecraft:end_rod', plr.x, plr.y + 1.2, plr.z, 0.3, 0.3, 0.3, 0.08, cnt(5))
        ring(plr, C_GOLD, 1.0, plr.x, plr.y + 0.3 + j * 0.2, plr.z, 0.7, 0.4)
      }
    }
  }

  function constellation(plr, t, S) {
    var reveal = Math.min(1, (t - T_LINES) / 20)
    var edges = STARS * reveal
    for (var i = 0; i < STARS; i++) {
      if (i >= edges) break
      var part = Math.min(1, edges - i)
      line3(plr, (i % 2 === 0) ? C_WHITE : C_GOLD, 0.9, S.pts[i], S.pts[(i + 1) % STARS], part)
    }
  }

  function finale(plr) {
    var x = plr.x, y = plr.y, z = plr.z
    sound(plr, 'minecraft:item.totem.use', 1.0, 1.1)
    sound(plr, 'minecraft:block.beacon.activate', 1.5, 1.2)
    sound(plr, 'minecraft:block.bell.use', 1.5, 1.6)
    sound(plr, 'minecraft:block.amethyst_cluster.break', 1.2, 0.8)

    particle(plr, 'minecraft:flash', x, y + 1, z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:totem_of_undying', x, y + 1, z, 0.3, 0.5, 0.3, 0.5, cnt(40))
    for (var i = 0; i < cnt(30); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.6
      particle(plr, 'minecraft:end_rod', x, y + 1, z, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.25, 0)
    }

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.aqua('[NxEterna] ').append(Text.white('A constellation becomes your heart. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function burst(plr, s) {
    if (s < 16) {
      ring(plr, (s % 2 === 0) ? C_GOLD : C_WHITE, 1.2, plr.x, plr.y + 0.1 + s * 0.8, plr.z, 1.3, 0.4)
    }
    if (s % 2 === 0) {
      var cols = [C_PINK, C_CYAN, C_GOLD]
      ring(plr, cols[(s / 2) % 3], 1.3, plr.x, plr.y + 0.15, plr.z, 0.8 + s * 0.9, 0.6)
    }
  }

  function aura(plr, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.1) {
      for (var st = 0; st < 3; st++) {
        var base = s * 0.15 + st * TAU / 3
        var yy = plr.y + 1.2 + Math.sin(s * 0.08 + st * 2) * 0.7
        var hx = plr.x + Math.cos(base) * 1.1
        var hz = plr.z + Math.sin(base) * 1.1
        particle(plr, 'minecraft:end_rod', hx, yy, hz, 0, 0, 0, 0, 1)
        dust(plr, C_WHITE, 1.2, hx, yy, hz, 0, 0, 0, 1)
        for (var j = 1; j <= 4; j++) {
          var b2 = base - j * 0.12
          dustFade(plr, C_GOLD, C_BLUE, 1.0 - j * 0.15, plr.x + Math.cos(b2) * 1.1, yy, plr.z + Math.sin(b2) * 1.1, 0, 0, 0, 1)
        }
      }
    }
    if (k > 0.2 && s % 3 === 0) {
      for (var i = 0; i < cnt(2); i++) {
        particle(plr, 'minecraft:end_rod', plr.x + rnd(2.5), plr.y + 4 + Math.random() * 2, plr.z + rnd(2.5), 0, -1, 0, 0.03, 0)
      }
    }
    if (s === 30 || s === 70) sound(plr, 'minecraft:block.amethyst_block.resonate', 1.0, 0.6 + s * 0.005)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, S) {
    if (t === 0) ritualStart(plr)
    if (t < T_FIN + 30) pin(plr, S.ox, S.oz)

    if (t >= 6 && t % 4 === 0 && t < T_FIN + 30) {
      var inten = (t < 40) ? (t - 6) / 34 : 1
      if (t > T_FIN) inten = 1 - (t - T_FIN) / 30
      aurora(plr, t, S, inten)
    }

    if (t < T_FIN && t % 5 === 0) groundTwinkle(plr, S)
    if (t >= T_FIRST - T_FLIGHT && t <= T_ABSORB + 9 * T_ABS_GAP + T_ABS_FLIGHT) stars(plr, t, S)
    if (t >= T_LINES && t <= T_ABSORB + 4 && t % 3 === 0) constellation(plr, t, S)

    if (t === T_FIN) finale(plr)
    if (t >= T_FIN && t < T_FIN + 17) burst(plr, t - T_FIN)
    if (t > T_FIN) aura(plr, t)
  }

  return {
    start: function (plr) {
      var S = buildScene(plr)
      playFrames(plr, T_END, function (p, t) { frame(p, t, S) }, 'starfall')
    }
  }
})()

EFFECTS.tree = (function () {
  var C_BARK = [0.62, 0.40, 0.18]
  var C_LIFE = [0.40, 1.00, 0.55]
  var C_LEAF = [0.25, 0.80, 0.35]
  var C_PINK = [1.00, 0.55, 0.80]
  var C_WHITE = [1.00, 0.97, 0.97]
  var C_GOLD = [1.00, 0.85, 0.35]
  var C_HEART = [1.00, 0.30, 0.35]

  var TREE_DIST = 5.5
  var TRUNK_H = 6.0
  var TURNS = 3.5
  var ROOTS = 5
  var BRANCHES = 6
  var CANOPY_R = 3.4
  var CANOPY_RY = 2.1
  var STEP = 4

  var T_ROOTS = 30
  var T_TRUNK = 12
  var T_BRANCH = 40
  var T_SAP = 30
  var T_CANOPY = 55
  var T_FRUIT = 85
  var T_RIPE = 128
  var T_GUST = 130
  var T_FALL = 132
  var T_FIN = 148
  var T_END = 225
  var BEATS = [108, 116, 122, 127]
  var NOTES = [0, 4, 7, 9, 12, 16, 19, 21]

  function trunkCenter(S, hf) {
    return [S.bx + Math.sin(hf * 3) * 0.25 * hf, S.by + hf * TRUNK_H, S.bz + Math.cos(hf * 2) * 0.2 * hf]
  }

  function trunkPt(S, hf, strand) {
    var c = trunkCenter(S, hf)
    var r = 0.55 - 0.35 * hf
    var ang = hf * TURNS * TAU + strand * Math.PI
    return [c[0] + Math.cos(ang) * r, c[1], c[2] + Math.sin(ang) * r]
  }

  function buildScene(plr) {
    var fc = facing(plr)
    var S = {
      ox: plr.x, oy: plr.y, oz: plr.z,
      tx: fc.tx, tz: fc.tz,
      bx: plr.x + fc.fx * TREE_DIST, by: plr.y, bz: plr.z + fc.fz * TREE_DIST,
      roots: [], branches: []
    }

    for (var i = 0; i < ROOTS; i++) {
      var a0 = i * TAU / ROOTS + 0.3
      var pts = []
      for (var j = 0; j < 12; j++) {
        var d = 0.3 + j * (3.2 / 11)
        var a = a0 + Math.sin(j * 0.7 + i) * 0.25
        pts.push([S.bx + Math.cos(a) * d, S.by + 0.1, S.bz + Math.sin(a) * d])
      }
      S.roots.push(pts)
    }

    for (var b = 0; b < BRANCHES; b++) {
      var hf = 0.55 + 0.08 * b
      var start = trunkCenter(S, hf)
      var az = b * TAU / BRANCHES + 0.5
      var L = 2.6 + (b % 3) * 0.4
      var bp = []
      for (var k = 0; k < 14; k++) {
        var u = k / 13
        var ang = az + Math.sin(u * 3 + b) * 0.3
        bp.push([start[0] + Math.cos(ang) * u * L, start[1] + u * 2.0 - 0.5 * u * u, start[2] + Math.sin(ang) * u * L])
      }
      S.branches.push(bp)
    }

    S.canopy = [S.bx, S.by + TRUNK_H + 1.4, S.bz]
    S.fruit0 = [S.bx - fc.fx * 0.9, S.by + TRUNK_H + 0.6, S.bz - fc.fz * 0.9]
    S.dx = S.ox - S.canopy[0]
    S.dz = S.oz - S.canopy[2]
    return S
  }

  function ritualStart(plr) {
    effect(plr, 'resistance', 13, 4)
    sound(plr, 'minecraft:block.moss.place', 1.2, 0.6)
    sound(plr, 'minecraft:entity.allay.ambient_with_item', 0.8, 0.8)
    plr.tell(Text.green('[NxEterna] ').append(Text.gray('Life stirs beneath the earth...')))
  }

  function drawRoots(plr, S, reveal) {
    for (var i = 0; i < ROOTS; i++) {
      var pts = S.roots[i]
      var m = Math.floor(pts.length * reveal)
      for (var j = 0; j < m; j++) {
        var p = pts[j]
        dust(plr, C_LIFE, 1.0, p[0], p[1], p[2], 0.03, 0.02, 0.03, 1)
      }
      if (reveal < 1 && m > 0) {
        var tip = pts[m - 1]
        particle(plr, 'minecraft:happy_villager', tip[0], tip[1] + 0.1, tip[2], 0.1, 0.1, 0.1, 0, 1)
      }
    }
  }

  function drawTrunk(plr, S, reveal) {
    var n = cnt(36)
    for (var s = 0; s < 2; s++) {
      for (var i = 0; i <= n; i++) {
        var hf = i / n
        if (hf > reveal) break
        var p = trunkPt(S, hf, s)
        if (s === 0) dust(plr, C_BARK, 1.3, p[0], p[1], p[2], 0.02, 0.02, 0.02, 1)
        else dust(plr, C_LIFE, 1.0, p[0], p[1], p[2], 0.02, 0.02, 0.02, 1)
      }
    }
    if (reveal > 0.05) {
      var bp = trunkCenter(S, 0)
      dust(plr, C_BARK, 1.8, bp[0], bp[1] + 0.2, bp[2], 0.35, 0.15, 0.35, 3)
    }
  }

  function drawBranches(plr, S, t) {
    for (var b = 0; b < BRANCHES; b++) {
      var rv = clamp01((t - (T_BRANCH + b * 6)) / 28)
      if (rv <= 0) continue
      var pts = S.branches[b]
      var m = Math.floor(pts.length * rv)
      for (var j = 0; j < m; j++) {
        var p = pts[j]
        dust(plr, (j % 2 === 0) ? C_BARK : C_LIFE, 1.1, p[0], p[1], p[2], 0.02, 0.02, 0.02, 1)
      }
      if (m > 0) {
        var tip = pts[m - 1]
        if (rv < 1) particle(plr, 'minecraft:happy_villager', tip[0], tip[1], tip[2], 0.1, 0.1, 0.1, 0, 1)
        else dustFade(plr, C_PINK, C_WHITE, 1.8, tip[0], tip[1], tip[2], 0.3, 0.3, 0.3, 3)
      }
    }
  }

  function canopyPt(S, cr) {
    var h = CANOPY_RY * cr + 0.001
    var yy = rnd(h)
    var q = 1 - (yy / h) * (yy / h)
    var dd = CANOPY_R * cr * Math.sqrt(Math.max(0, q)) * Math.sqrt(Math.random())
    var a = Math.random() * TAU
    return [S.canopy[0] + Math.cos(a) * dd, S.canopy[1] + yy, S.canopy[2] + Math.sin(a) * dd]
  }

  function canopy(plr, S, t) {
    var cr = clamp01((t - T_CANOPY) / 45)
    var n = cnt(2 + 8 * cr)
    for (var i = 0; i < n; i++) {
      var p = canopyPt(S, cr)
      var r = Math.random()
      if (r < 0.45) dust(plr, C_LEAF, 2.0, p[0], p[1], p[2], 0.1, 0.1, 0.1, 1)
      else if (r < 0.85) dustFade(plr, C_PINK, C_WHITE, 1.7, p[0], p[1], p[2], 0.1, 0.1, 0.1, 1)
      else dust(plr, C_GOLD, 1.3, p[0], p[1], p[2], 0.1, 0.1, 0.1, 1)
    }
    if (t % 4 === 0) {
      var q = canopyPt(S, cr)
      particle(plr, 'minecraft:cherry_leaf', q[0], q[1], q[2], 0, 0, 0, 0, 1)
    }
    if (t % 6 === 0) {
      var w = canopyPt(S, cr)
      particle(plr, 'minecraft:happy_villager', w[0], w[1], w[2], 0.2, 0.2, 0.2, 0, 1)
    }
  }

  function groundLife(plr, S) {
    for (var i = 0; i < cnt(2); i++) {
      var a = Math.random() * TAU
      var d = Math.random() * 3.5
      particle(plr, 'minecraft:composter', S.bx + Math.cos(a) * d, S.by + 0.2, S.bz + Math.sin(a) * d, 0.1, 0.1, 0.1, 0, 2)
    }
  }

  function pulsePos(S, i, u) {
    if (u < 0.35) {
      var pts = S.roots[i]
      var idx = (1 - u / 0.35) * (pts.length - 1)
      var lo = Math.floor(idx)
      var hi = Math.min(pts.length - 1, lo + 1)
      return lerp3(pts[lo], pts[hi], idx - lo)
    }
    return trunkPt(S, (u - 0.35) / 0.65, i % 2)
  }

  function pulses(plr, t, S) {
    for (var i = 0; i < ROOTS; i++) {
      var tt = t - T_SAP - i * 7
      if (tt < 0) continue
      var ph = tt % 36
      var u = ph / 36
      var h = pulsePos(S, i, u)
      dust(plr, C_WHITE, 1.5, h[0], h[1], h[2], 0.02, 0.02, 0.02, 1)
      particle(plr, 'minecraft:happy_villager', h[0], h[1], h[2], 0.05, 0.05, 0.05, 0, 1)
      for (var k = 1; k <= 4; k++) {
        var uu = u - k * 0.03
        if (uu < 0) break
        var p = pulsePos(S, i, uu)
        dustFade(plr, C_GOLD, C_LIFE, 1.3 - k * 0.2, p[0], p[1], p[2], 0, 0, 0, 1)
      }
      if (ph >= 34 && ph < 36) {
        var cyc = Math.floor(tt / 36)
        sound(plr, 'minecraft:block.note_block.harp', 1.4, note(NOTES[(i + cyc * 2) % NOTES.length]))
        var top = trunkCenter(S, 1)
        dust(plr, C_GOLD, 2.0, top[0], top[1], top[2], 0.4, 0.3, 0.4, 4)
      }
    }
  }

  function heartRing(plr, S, c, size, n, colA, colB, scale) {
    for (var i = 0; i < n; i++) {
      var th = Math.PI + i * TAU / n
      var hx = Math.pow(Math.sin(th), 3)
      var hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
      dustFade(plr, colA, colB, scale, c[0] + S.tx * hx * size, c[1] + hy * size, c[2] + S.tz * hx * size, 0, 0, 0, 1)
    }
  }

  function heartFill(plr, S, c, size) {
    heartRing(plr, S, c, size, cnt(22), C_GOLD, C_HEART, 1.0)
    heartRing(plr, S, c, size * 0.62, cnt(13), C_GOLD, C_HEART, 1.0)
    heartRing(plr, S, c, size * 0.28, cnt(6), C_WHITE, C_GOLD, 1.0)
  }

  function fruitGrow(plr, t, S) {
    var g = clamp01((t - T_FRUIT) / (T_RIPE - T_FRUIT))
    var e = g * g * (3 - 2 * g)
    var size = 0.7 * e
    if (size < 0.05) return

    var pulse = 1
    for (var b = 0; b < BEATS.length; b++) {
      if (t >= BEATS[b] && t < BEATS[b] + 4) pulse = 1 + 0.2 * (1 - (t - BEATS[b]) / 4)
    }
    var c = [S.fruit0[0], S.fruit0[1] + Math.sin(t * 0.1) * 0.08, S.fruit0[2]]
    heartFill(plr, S, c, size * pulse)
    if (t % 6 === 0) particle(plr, 'minecraft:end_rod', c[0] + rnd(0.5), c[1] + rnd(0.5), c[2] + rnd(0.5), 0, 0, 0, 0, 1)
  }

  function fruitPos(S, plr, u) {
    var e = u * u * (3 - 2 * u)
    var chest = [plr.x, plr.y + 1.3, plr.z]
    var p = lerp3(S.fruit0, chest, e)
    var side = Math.sin(u * TAU) * 0.6 * (1 - u)
    return [p[0] + S.tx * side, p[1], p[2] + S.tz * side]
  }

  function fruitFall(plr, t, S) {
    var u = (t - T_FALL) / (T_FIN - T_FALL)
    var c = fruitPos(S, plr, u)
    heartFill(plr, S, c, 0.7 * (1 - 0.5 * u))
    for (var k = 1; k <= 4; k++) {
      var uu = u - k * 0.05
      if (uu < 0) break
      var p = fruitPos(S, plr, uu)
      dustFade(plr, C_GOLD, C_PINK, 1.2 - k * 0.2, p[0], p[1], p[2], 0.05, 0.05, 0.05, 1)
    }
    if (t % 3 === 0) particle(plr, 'minecraft:cherry_leaf', c[0], c[1], c[2], 0, 0, 0, 0, 1)
  }

  function gust(plr, S) {
    sound(plr, 'minecraft:item.elytra.flying', 0.5, 0.6)
    sound(plr, 'minecraft:block.sweet_berry_bush.pick_berries', 1.0, 0.8)
    var len = Math.sqrt(S.dx * S.dx + S.dz * S.dz) + 0.001
    var dx = S.dx / len, dz = S.dz / len
    for (var i = 0; i < cnt(28); i++) {
      var p = canopyPt(S, 1)
      particle(plr, 'minecraft:cherry_leaf', p[0], p[1], p[2], dx + rnd(0.3), 0.1 + rnd(0.2), dz + rnd(0.3), 0.35, 0)
    }
  }

  function finale(plr) {
    var x = plr.x, y = plr.y, z = plr.z
    sound(plr, 'minecraft:item.totem.use', 1.0, 1.3)
    sound(plr, 'minecraft:block.beacon.activate', 1.5, 1.4)
    sound(plr, 'minecraft:entity.allay.item_given', 1.2, 1.0)
    sound(plr, 'minecraft:block.amethyst_block.chime', 1.2, 1.2)

    particle(plr, 'minecraft:totem_of_undying', x, y + 1, z, 0.3, 0.5, 0.3, 0.5, cnt(40))
    particle(plr, 'minecraft:happy_villager', x, y + 1, z, 1.0, 0.8, 1.0, 0, cnt(30))
    var m = cnt(20)
    for (var i = 0; i < m; i++) {
      var a = i * TAU / m
      particle(plr, 'minecraft:cherry_leaf', x + Math.cos(a) * 0.8, y + 0.5, z + Math.sin(a) * 0.8, Math.cos(a), 0.6, Math.sin(a), 0.2, 0)
    }

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.green('[NxEterna] ').append(Text.white('The Tree of Life bears you a new heart. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function bloom(plr, s) {
    if (s % 2 !== 0) return
    ring(plr, C_LIFE, 1.3, plr.x, plr.y + 0.15, plr.z, 0.8 + s * 0.85, 0.6)
    if (s >= 4) ring(plr, C_PINK, 1.2, plr.x, plr.y + 0.25, plr.z, 0.8 + (s - 4) * 0.85, 0.6)
  }

  function dissolve(plr, S) {
    sound(plr, 'minecraft:block.grass.break', 1.2, 0.5)
    for (var i = 0; i < cnt(30); i++) {
      var p = (i % 3 === 0) ? trunkCenter(S, Math.random()) : canopyPt(S, 1)
      particle(plr, 'minecraft:cherry_leaf', p[0], p[1], p[2], rnd(0.4), 0.2 + Math.random() * 0.3, rnd(0.4), 0.2, 0)
    }
    var top = S.canopy
    particle(plr, 'minecraft:totem_of_undying', top[0], top[1], top[2], 0.8, 0.6, 0.8, 0.3, cnt(20))
  }

  function aura(plr, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.25 && s % 2 === 0) {
      var height = Math.min(3.0, s * 0.12)
      var idx = 0
      for (var st = 0; st < 2; st++) {
        for (var h = 0; h <= height; h += 0.2) {
          var ang = h * TAU / 1.1 + st * Math.PI + s * 0.05
          var px = plr.x + Math.cos(ang) * 0.8
          var pz = plr.z + Math.sin(ang) * 0.8
          dust(plr, C_LEAF, 1.1, px, plr.y + h, pz, 0, 0, 0, 1)
          if (idx % 3 === 0) dustFade(plr, C_PINK, C_WHITE, 1.6, px, plr.y + h, pz, 0.05, 0.05, 0.05, 1)
          idx++
        }
      }
    }
    if (k > 0.1 && s % 3 === 0) {
      var a = s * 0.25
      particle(plr, 'minecraft:cherry_leaf', plr.x + Math.cos(a) * 1.0, plr.y + 0.3, plr.z + Math.sin(a) * 1.0, 0, 0, 0, 0, 1)
      particle(plr, 'minecraft:happy_villager', plr.x + rnd(1.0), plr.y + 0.5 + Math.random() * 2, plr.z + rnd(1.0), 0.1, 0.1, 0.1, 0, 1)
    }
    if (s === 30 || s === 70) sound(plr, 'minecraft:block.amethyst_block.resonate', 0.9, 0.9)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, S) {
    if (t === 0) ritualStart(plr)
    if (t < T_FIN + 30) pin(plr, S.ox, S.oz)

    if (t < T_FIN + 8 && t % STEP === 0) {
      drawRoots(plr, S, clamp01(t / T_ROOTS))
      if (t >= T_TRUNK) drawTrunk(plr, S, clamp01((t - T_TRUNK) / 50))
      if (t >= T_BRANCH) drawBranches(plr, S, t)
    }

    if (t < T_FIN && t % 3 === 0) groundLife(plr, S)
    if (t >= T_SAP && t <= 105 && t % 2 === 0) pulses(plr, t, S)
    if (t >= T_CANOPY && t < T_FIN + 4 && t % 2 === 0) canopy(plr, S, t)

    if (t >= T_FRUIT && t < T_FALL && t % 2 === 0) fruitGrow(plr, t, S)
    if (t >= T_FALL && t < T_FIN) fruitFall(plr, t, S)
    for (var b = 0; b < BEATS.length; b++) {
      if (t === BEATS[b]) sound(plr, 'minecraft:entity.warden.heartbeat', 1.6, 0.9 + b * 0.08)
    }

    if (t === 12 || t === 24 || t === 36 || t === 48 || t === 60) {
      sound(plr, 'minecraft:block.grass.break', 1.0, 0.5 + t * 0.01)
      sound(plr, 'minecraft:block.moss.place', 0.8, 0.7 + t * 0.008)
    }
    if (t === T_RIPE) sound(plr, 'minecraft:block.amethyst_block.chime', 1.2, 1.0)
    if (t === T_GUST) gust(plr, S)

    if (t === T_FIN) finale(plr)
    if (t >= T_FIN && t < T_FIN + 17) bloom(plr, t - T_FIN)
    if (t === T_FIN + 2) dissolve(plr, S)
    if (t > T_FIN) aura(plr, t)
  }

  return {
    start: function (plr) {
      var S = buildScene(plr)
      playFrames(plr, T_END, function (p, t) { frame(p, t, S) }, 'tree')
    }
  }
})()

EFFECTS.dragon = (function () {
  var C_SCALE = [0.85, 0.10, 0.12]
  var C_BELLY = [1.0, 0.80, 0.40]
  var C_BONE = [1.0, 0.93, 0.78]
  var C_MEM = [0.60, 0.05, 0.15]
  var C_EYE = [1.0, 1.0, 0.20]
  var C_FIRE = [1.0, 0.50, 0.10]
  var C_EMBER = [0.85, 0.12, 0.05]
  var C_GOLD = [1.0, 0.82, 0.30]
  var C_WHITE = [0.97, 0.94, 1.0]
  var C_FLESH = [0.70, 0.12, 0.30]
  var C_HEART = [1.0, 0.25, 0.35]

  var SEGS = 24
  var LAG = 1.1
  var R_ORBIT = 11
  var T_DIVE = 70
  var T_EAT = 96
  var T_FIN = 172
  var T_END = 245
  var BEATS = [112, 130, 146, 158, 166]

  function norm(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) + 0.0001
    return [v[0] / l, v[1] / l, v[2] / l]
  }

  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  }

  function sideOf(d) {
    var l = Math.sqrt(d[0] * d[0] + d[2] * d[2]) + 0.0001
    return [-d[2] / l, 0, d[0] / l]
  }

  function q(F, x, y, z) {
    return [
      F.p[0] + F.d[0] * x + F.sd[0] * y + F.up[0] * z,
      F.p[1] + F.d[1] * x + F.sd[1] * y + F.up[1] * z,
      F.p[2] + F.d[2] * x + F.sd[2] * y + F.up[2] * z
    ]
  }

  function vq(F, x, y, z) {
    return norm([
      F.d[0] * x + F.sd[0] * y + F.up[0] * z,
      F.d[1] * x + F.sd[1] * y + F.up[1] * z,
      F.d[2] * x + F.sd[2] * y + F.up[2] * z
    ])
  }

  function circ(S, x) {
    var ang = 0.5 + x * 0.055
    var r = R_ORBIT + Math.max(0, 25 - x) * 0.7
    return [S.ox + Math.cos(ang) * r, S.oy + 9 + Math.sin(x * 0.1) * 1.3, S.oz + Math.sin(ang) * r]
  }

  function pathAt(S, tt) {
    if (tt <= T_DIVE) return circ(S, tt)
    if (tt <= T_EAT) {
      var u = (tt - T_DIVE) / (T_EAT - T_DIVE)
      return lerp3(circ(S, tt), S.mouth, u * u)
    }
    return lerp3(S.mouth, S.climb, (tt - T_EAT) / 30)
  }

  function dirAt(S, tt) {
    var a = pathAt(S, tt + 0.6)
    var b = pathAt(S, tt - 0.6)
    return norm([a[0] - b[0], a[1] - b[1], a[2] - b[2]])
  }

  function bodyFrame(S, t, k) {
    var tt = t - k * LAG
    var P = pathAt(S, tt)
    var d = dirAt(S, tt)
    var sd = sideOf(d)
    var up = norm(cross(sd, d))
    var amp = 1.1 * Math.pow(k / SEGS, 0.8)
    var w1 = Math.sin(k * 0.6 - t * 0.14) * amp
    var w2 = Math.sin(k * 0.45 - t * 0.1 + 1) * amp * 0.5
    return {
      p: [P[0] + sd[0] * w1 + up[0] * w2, P[1] + sd[1] * w1 + up[1] * w2, P[2] + sd[2] * w1 + up[2] * w2],
      d: d, sd: sd, up: up, tt: tt
    }
  }

  function buildScene(plr) {
    var S = { ox: plr.x, oy: plr.y, oz: plr.z }
    S.mouth = [S.ox, S.oy + 1.1, S.oz]
    S.climb = [S.ox + 12, S.oy + 26, S.oz - 12]
    return S
  }

  function drawHeartV(plr, cx, cy, cz, size, rot, n, scale, colA, colB) {
    var c = Math.cos(rot), s = Math.sin(rot)
    for (var i = 0; i < n; i++) {
      var th = Math.PI + i * TAU / n
      var hx = Math.pow(Math.sin(th), 3)
      var hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
      dustFade(plr, colA, colB, scale, cx + hx * size * c, cy + hy * size, cz + hx * size * s, 0, 0, 0, 1)
    }
  }

  function flameRing(plr, cx, cy, cz, R) {
    var n = nPoints(TAU * R, 0.8)
    for (var i = 0; i < n; i++) {
      var a = i * TAU / n
      particle(plr, 'minecraft:flame', cx + Math.cos(a) * R, cy, cz + Math.sin(a) * R, 0, 1, 0, 0.03, 0)
    }
  }

  function ritualStart(plr, S) {
    effect(plr, 'resistance', 16, 4)
    sound(plr, 'minecraft:entity.lightning_bolt.thunder', 1.2, 0.7)
    sound(plr, 'minecraft:entity.ender_dragon.growl', 0.6, 0.5)
    var r = circ(S, 0)
    particle(plr, 'minecraft:portal', r[0], r[1], r[2], 2, 2, 2, 1, cnt(60))
    plr.tell(Text.darkPurple('[NxEterna] ').append(Text.gray('A shadow falls across the sky...')))
  }

  function clouds(plr, S) {
    var n = cnt(10)
    for (var i = 0; i < n; i++) {
      var a = i * TAU / n + Math.random()
      particle(plr, 'minecraft:large_smoke', S.ox + Math.cos(a) * 16, S.oy + 14 + rnd(1.5), S.oz + Math.sin(a) * 16, 1, 0.4, 1, 0.01, 2)
    }
  }

  function drawHead(plr, S, t) {
    var F = bodyFrame(S, t, 0)
    var jaw = 0.12
    if (t >= T_DIVE - 6 && t < T_EAT) jaw = 0.12 + 0.75 * clamp01((t - (T_DIVE - 6)) / 24)
    var sj = Math.sin(jaw)

    var sk = q(F, -0.1, 0, 0.1)
    dust(plr, C_SCALE, 2.4, sk[0], sk[1], sk[2], 0.28, 0.25, 0.28, cnt(4))

    for (var i = 1; i <= 5; i++) {
      var len = 0.3 + i * 0.48
      var wid = 0.42 - 0.06 * i
      var upZ = 0.25 + len * sj * 0.55
      var loZ = -(0.2 + len * sj * 0.8)

      var ctr = q(F, len, 0, upZ + 0.12)
      dust(plr, C_SCALE, 1.5, ctr[0], ctr[1], ctr[2], 0, 0, 0, 1)

      for (var sg = -1; sg <= 1; sg += 2) {
        var ua = q(F, len, wid * sg, upZ)
        dust(plr, C_SCALE, 1.5, ua[0], ua[1], ua[2], 0, 0, 0, 1)
        var la = q(F, len, wid * sg, loZ)
        dust(plr, C_BELLY, 1.4, la[0], la[1], la[2], 0, 0, 0, 1)
        if (i >= 2 && jaw > 0.25) {
          var ut = q(F, len, wid * sg * 0.9, upZ - 0.28)
          dust(plr, C_BONE, 1.0, ut[0], ut[1], ut[2], 0, 0, 0, 1)
          var lt = q(F, len, wid * sg * 0.9, loZ + 0.28)
          dust(plr, C_BONE, 1.0, lt[0], lt[1], lt[2], 0, 0, 0, 1)
        }
      }
    }

    if (jaw > 0.4) {
      var gl = q(F, 1.3, 0, 0)
      dustFade(plr, C_FIRE, C_EMBER, 1.6, gl[0], gl[1], gl[2], 0.2, 0.3, 0.2, 2)
      particle(plr, 'minecraft:flame', gl[0], gl[1], gl[2], 0.1, 0.1, 0.1, 0.02, 1)
    }

    var nz = q(F, 2.7, 0.15, 0.3)
    particle(plr, 'minecraft:smoke', nz[0], nz[1], nz[2], 0.05, 0.05, 0.05, 0.02, 1)

    for (var e = -1; e <= 1; e += 2) {
      var ey = q(F, 0.6, 0.5 * e, 0.35)
      dust(plr, C_EYE, 2.2, ey[0], ey[1], ey[2], 0, 0, 0, 1)
      var br = q(F, 0.75, 0.38 * e, 0.62)
      dust(plr, C_BONE, 1.2, br[0], br[1], br[2], 0, 0, 0, 1)
      for (var j = 1; j <= 5; j++) {
        var hp = q(F, -0.3 * j, (0.38 + 0.07 * j) * e, 0.4 + 0.3 * j - 0.02 * j * j)
        dust(plr, C_BONE, 1.5, hp[0], hp[1], hp[2], 0, 0, 0, 1)
        if (j === 5) particle(plr, 'minecraft:end_rod', hp[0], hp[1], hp[2], 0, 0, 0, 0, 1)
      }
      for (var fr = 1; fr <= 3; fr++) {
        var fp = q(F, -0.15 * fr, (0.55 + 0.4 * fr) * e, 0.05 - 0.1 * fr)
        dustFade(plr, C_FIRE, C_MEM, 1.3, fp[0], fp[1], fp[2], 0, 0, 0, 1)
      }
    }
  }

  function bodyRadius(k) {
    if (k < 5) return 0.45 + 0.1 * k
    return 0.95 * (1 - (k - 5) / (SEGS - 5)) + 0.12
  }

  function drawBody(plr, S, t) {
    for (var k = 1; k <= SEGS; k++) {
      var F = bodyFrame(S, t, k)
      if (F.tt < 0) break
      var r = bodyRadius(k)

      for (var i = 0; i < 5; i++) {
        var a = i * TAU / 5 + 0.3
        var y = Math.cos(a) * r
        var z = Math.sin(a) * r * 0.85
        var pt = q(F, 0, y, z)
        if (z < -0.1 * r) dust(plr, C_BELLY, 1.3, pt[0], pt[1], pt[2], 0, 0, 0, 1)
        else dustFade(plr, C_SCALE, C_EMBER, 1.4, pt[0], pt[1], pt[2], 0, 0, 0, 1)
      }

      if (k % 2 === 0) {
        var hh = 1.2 - k / SEGS
        var s1 = q(F, 0, 0, r + 0.3 * hh)
        var s2 = q(F, -0.1, 0, r + 0.7 * hh)
        dust(plr, C_BONE, 1.2, s1[0], s1[1], s1[2], 0, 0, 0, 1)
        dust(plr, C_BONE, 1.0, s2[0], s2[1], s2[2], 0, 0, 0, 1)
      }

      if (k === 4 || k === 10) {
        for (var sg = -1; sg <= 1; sg += 2) {
          for (var j = 1; j <= 3; j++) {
            var lp = q(F, -0.3 * j, sg * (r * 0.8 + 0.15 * j), -(r * 0.5 + 0.4 * j))
            dust(plr, C_SCALE, 1.4, lp[0], lp[1], lp[2], 0, 0, 0, 1)
          }
          var cl = q(F, -1.1, sg * (r * 0.8 + 0.5), -(r * 0.5 + 1.4))
          dust(plr, C_BONE, 1.8, cl[0], cl[1], cl[2], 0.1, 0.05, 0.1, 2)
        }
      }

      if (k === SEGS) {
        var tp = q(F, -0.5, 0, 0)
        dust(plr, C_BONE, 1.6, tp[0], tp[1], tp[2], 0, 0, 0, 1)
        for (var sd2 = -1; sd2 <= 1; sd2 += 2) {
          var l1 = q(F, -0.1, sd2 * 0.6, 0)
          var l2 = q(F, -0.1, 0, sd2 * 0.6)
          dust(plr, C_BONE, 1.5, l1[0], l1[1], l1[2], 0, 0, 0, 1)
          dust(plr, C_BONE, 1.5, l2[0], l2[1], l2[2], 0, 0, 0, 1)
        }
      }

      if (k % 6 === 0) {
        particle(plr, 'minecraft:small_flame', F.p[0], F.p[1] - r * 0.5, F.p[2], 0.15, 0.1, 0.15, 0.01, 1)
      }
    }
  }

  function wings(plr, S, t) {
    if (t - 8 * LAG < 0) return
    var F = bodyFrame(S, t, 5)
    var Bf = bodyFrame(S, t, 8)
    var dive = (t >= T_DIVE - 4 && t < T_EAT + 6)
    var fl = dive ? 0.35 : 0.15 + Math.sin(t * 0.22) * 0.85
    var swp = dive ? 0.75 : 0.2

    for (var s = -1; s <= 1; s += 2) {
      var S0 = q(F, 0, s * 0.4, 0.5)
      var Wr = q(F, -0.3, s * Math.cos(fl) * 4.2, Math.sin(fl) * 4.2 + 0.9)

      for (var a = 1; a <= 6; a++) {
        var ap = lerp3(S0, Wr, a / 6)
        dust(plr, C_BONE, 1.6, ap[0], ap[1], ap[2], 0, 0, 0, 1)
      }

      var fing = []
      var tips = []
      for (var f = 0; f < 4; f++) {
        var fl2 = fl - 0.1
        var dir = vq(F, -(swp * 0.5 + 0.5 * f), s * Math.cos(fl2), Math.sin(fl2) - 0.25 * f)
        var Lf = 6.5 - 0.7 * f
        var pts = []
        for (var j = 1; j <= 6; j++) {
          var fp = [Wr[0] + dir[0] * Lf * j / 6, Wr[1] + dir[1] * Lf * j / 6, Wr[2] + dir[2] * Lf * j / 6]
          pts.push(fp)
          dust(plr, C_BONE, 1.3, fp[0], fp[1], fp[2], 0, 0, 0, 1)
        }
        fing.push(pts)
      }

      for (var g = 0; g < 3; g++) {
        for (var jj = 2; jj <= 6; jj += 2) {
          for (var m = 1; m <= 2; m++) {
            var mp = lerp3(fing[g][jj - 1], fing[g + 1][jj - 1], m / 3)
            dustFade(plr, C_FIRE, C_MEM, 1.4, mp[0], mp[1], mp[2], 0.05, 0.05, 0.05, 1)
          }
        }
      }

      var Bq = q(Bf, 0, s * 0.5, -0.2)
      for (var e = 2; e <= 6; e += 2) {
        for (var m2 = 1; m2 <= 2; m2++) {
          var ep = lerp3(fing[3][e - 1], Bq, m2 / 3)
          dustFade(plr, C_FIRE, C_MEM, 1.4, ep[0], ep[1], ep[2], 0.05, 0.05, 0.05, 1)
        }
      }
      for (var ed = 1; ed <= 4; ed++) {
        var edp = lerp3(fing[3][5], Bq, ed / 5)
        dust(plr, C_BONE, 1.0, edp[0], edp[1], edp[2], 0, 0, 0, 1)
      }
    }
  }

  function drawDragon(plr, S, t) {
    drawHead(plr, S, t)
    drawBody(plr, S, t)
    wings(plr, S, t)
  }

  function breath(plr, S, t) {
    var F = bodyFrame(S, t, 0)
    var d = F.d
    var m = q(F, 2.4, 0, 0)
    particle(plr, 'minecraft:flame', m[0], m[1], m[2], d[0], d[1], d[2], 0.45, 0)
    for (var k = 1; k <= 5; k++) {
      var r = 2.6 + k * 0.9
      dustFade(plr, C_FIRE, C_EMBER, 1.6, F.p[0] + d[0] * r, F.p[1] + d[1] * r, F.p[2] + d[2] * r, 0.25, 0.25, 0.25, 2)
    }
  }

  function eat(plr, S) {
    sound(plr, 'minecraft:entity.ender_dragon.growl', 1.6, 0.6)
    sound(plr, 'minecraft:entity.generic.eat', 1.5, 0.5)
    sound(plr, 'minecraft:entity.generic.explode', 0.6, 0.6)
    effect(plr, 'blindness', 5, 0)
    effect(plr, 'nausea', 5, 0)
    particle(plr, 'minecraft:large_smoke', S.ox, S.oy + 1, S.oz, 0.6, 0.6, 0.6, 0.05, cnt(25))
    particle(plr, 'minecraft:poof', S.ox, S.oy + 1, S.oz, 0.5, 0.5, 0.5, 0.1, cnt(15))
    ring(plr, C_FLESH, 1.3, S.ox, S.oy + 0.2, S.oz, 1.4, 0.4)
    plr.tell(Text.darkPurple('[NxEterna] ').append(Text.red('CHOMP.')))
  }

  function bulge(plr, S, t) {
    var s = t - T_EAT
    var kb = s / 46 * SEGS
    var F = bodyFrame(S, t, kb)
    if (F.tt < 0) return
    dustFade(plr, C_HEART, C_GOLD, 2.8, F.p[0], F.p[1], F.p[2], 0.3, 0.3, 0.3, 3)
    particle(plr, 'minecraft:end_rod', F.p[0], F.p[1], F.p[2], 0.2, 0.2, 0.2, 0.01, 1)
  }

  function stomach(plr, S, t) {
    var s = t - T_EAT
    for (var i = 0; i < 3; i++) {
      var h = (s * 0.07 + i * 0.8) % 2.4
      var r = 1.1 - 0.35 * Math.sin(h / 2.4 * Math.PI)
      ring(plr, (i % 2 === 0) ? C_FLESH : C_EMBER, 1.2, S.ox, S.oy + h, S.oz, r, 0.5)
    }
    particle(plr, 'minecraft:falling_obsidian_tear', S.ox + rnd(0.9), S.oy + 2.3, S.oz + rnd(0.9), 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:dragon_breath', S.ox + rnd(0.8), S.oy + 0.5 + Math.random() * 1.5, S.oz + rnd(0.8), 0.1, 0.1, 0.1, 0.01, 1)

    if (s > 24) {
      var grow = clamp01((s - 24) / 40)
      var pulse = 1
      for (var b = 0; b < BEATS.length; b++) {
        if (t >= BEATS[b] && t < BEATS[b] + 4) pulse = 1 + 0.25 * (1 - (t - BEATS[b]) / 4)
      }
      drawHeartV(plr, S.ox, S.oy + 1.2, S.oz, 0.15 + 0.5 * grow * pulse, t * 0.1, cnt(28), 1.0, C_HEART, C_GOLD)
    }
  }

  function beat(plr, idx) {
    sound(plr, 'minecraft:entity.warden.heartbeat', 2.0, 0.7 + idx * 0.07)
    particle(plr, 'minecraft:heart', plr.x, plr.y + 1.6, plr.z, 0.3, 0.3, 0.3, 0, 2)
  }

  function finale(plr) {
    var x = plr.x, y = plr.y, z = plr.z
    run(plr, 'effect clear ' + plr.username + ' minecraft:blindness')
    run(plr, 'effect clear ' + plr.username + ' minecraft:nausea')

    sound(plr, 'minecraft:item.totem.use', 1.0, 0.9)
    sound(plr, 'minecraft:block.beacon.activate', 1.5, 0.8)
    sound(plr, 'minecraft:entity.ender_dragon.growl', 1.2, 1.2)
    sound(plr, 'minecraft:entity.generic.explode', 1.0, 0.8)

    particle(plr, 'minecraft:flash', x, y + 1, z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:explosion_emitter', x, y + 1, z, 0, 0, 0, 0, 1)

    for (var h = 0; h <= 14; h += 0.5) {
      dust(plr, C_WHITE, 1.4, x, y + h, z, 0.12, 0, 0.12, 1)
      dustFade(plr, C_GOLD, C_EMBER, 1.2, x, y + h + 0.25, z, 0.2, 0, 0.2, 1)
    }
    for (var i = 0; i < cnt(45); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.55
      var type = (i % 3 === 0) ? 'minecraft:flame' : 'minecraft:end_rod'
      particle(plr, type, x, y + 1, z, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.3, 0)
    }
    particle(plr, 'minecraft:dragon_breath', x, y + 0.3, z, 0.7, 0.1, 0.7, 0.04, cnt(30))
    particle(plr, 'minecraft:heart', x, y + 1.5, z, 0.8, 0.6, 0.8, 0, cnt(14))

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.darkPurple('[NxEterna] ').append(Text.white('The dragon devoured you, and gave back more than it took. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function shock(plr, s) {
    if (s % 2 !== 0) return
    var R = 0.8 + s * 0.85
    ring(plr, C_FIRE, 1.3, plr.x, plr.y + 0.15, plr.z, R, 0.6)
    flameRing(plr, plr.x, plr.y + 0.1, plr.z, R)
    if (s >= 4) ring(plr, C_GOLD, 1.1, plr.x, plr.y + 0.25, plr.z, R - 3.4, 0.6)
  }

  function aura(plr, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.1) {
      for (var st = 0; st < 3; st++) {
        var a = s * 0.2 + st * TAU / 3
        var y = plr.y + ((s * 0.05 + st * 0.8) % 2.4)
        dustFade(plr, C_FIRE, C_EMBER, 0.9, plr.x + Math.cos(a) * 0.9, y, plr.z + Math.sin(a) * 0.9, 0, 0, 0, 1)
        particle(plr, 'minecraft:dragon_breath', plr.x + Math.cos(a + 0.3) * 0.9, y, plr.z + Math.sin(a + 0.3) * 0.9, 0, 0, 0, 0, 1)
      }
    }
    if (k > 0.3 && s % 4 === 0) {
      drawHeartV(plr, plr.x, plr.y + 2.6, plr.z, 0.35, s * 0.1, cnt(24), 0.8, C_HEART, C_GOLD)
    }
    if (k > 0.3 && s % 6 === 0) {
      particle(plr, 'minecraft:heart', plr.x + rnd(0.6), plr.y + 2.2, plr.z + rnd(0.6), 0.1, 0.1, 0.1, 0, 1)
    }
    if (s === 30) sound(plr, 'minecraft:block.amethyst_block.resonate', 1.0, 0.6)
    if (s === 60) sound(plr, 'minecraft:entity.ender_dragon.flap', 0.5, 0.7)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, S) {
    if (t === 0) ritualStart(plr, S)
    if (t < T_FIN + 40) pin(plr, S.ox, S.oz)

    if (t < T_DIVE && t % 8 === 0) clouds(plr, S)
    if (t === 30) sound(plr, 'minecraft:entity.lightning_bolt.thunder', 1.0, 0.8)
    if (t === 6) sound(plr, 'minecraft:entity.ender_dragon.growl', 1.2, 0.7)
    if (t === 44) sound(plr, 'minecraft:entity.ender_dragon.growl', 1.4, 0.6)
    if (t >= 8 && t < T_DIVE && t % 9 === 0) sound(plr, 'minecraft:entity.ender_dragon.flap', 1.0, 0.8 + t * 0.002)

    if (t % 2 === 0 && t <= T_EAT + 46) drawDragon(plr, S, t)

    if (t === T_DIVE) {
      sound(plr, 'minecraft:entity.ender_dragon.growl', 1.8, 0.5)
      sound(plr, 'minecraft:entity.ender_dragon.shoot', 1.0, 0.7)
    }
    if (t >= T_DIVE + 2 && t < T_EAT - 1 && t % 2 === 0) breath(plr, S, t)
    if (t >= T_DIVE + 2 && t < T_EAT && t % 6 === 0) sound(plr, 'minecraft:item.firecharge.use', 1.2, 0.6)

    if (t === T_EAT) eat(plr, S)

    if (t > T_EAT && t < T_FIN) {
      if (t % 2 === 0) stomach(plr, S, t)
      if (t % 2 === 0 && t <= T_EAT + 46) bulge(plr, S, t)
      var s = t - T_EAT
      if (s % 14 === 0) sound(plr, 'minecraft:entity.slime.squish', 1.0, 0.5)
      if (s % 20 === 10) sound(plr, 'minecraft:block.bubble_column.upwards_inside', 0.8, 0.7)
      if (s === 20) sound(plr, 'minecraft:entity.ender_dragon.growl', 0.6, 0.4)
    }
    for (var b = 0; b < BEATS.length; b++) {
      if (t === BEATS[b]) beat(plr, b)
    }

    if (t === T_FIN) finale(plr)
    if (t >= T_FIN && t < T_FIN + 17) shock(plr, t - T_FIN)
    if (t > T_FIN) aura(plr, t)
  }

  return {
    start: function (plr) {
      var S = buildScene(plr)
      playFrames(plr, T_END, function (p, t) { frame(p, t, S) }, 'dragon')
    }
  }
})()

EFFECTS.storm = (function () {
  var C_BOLT = [0.70, 0.85, 1.0]
  var C_ELEC = [0.30, 0.50, 1.0]
  var C_WHITE = [1.0, 1.0, 1.0]
  var C_CLOUD = [0.22, 0.24, 0.32]
  var C_GOLD = [1.0, 0.85, 0.35]
  var C_HEART = [1.0, 0.95, 0.55]

  var STRIKES = 8
  var T_FIRST = 36
  var T_GAP = 9
  var CLOUD_Y = 16
  var T_HEART = 80
  var T_COLLAPSE = 118
  var T_FIN = 130
  var T_END = 205
  var BEATS = [96, 106, 114, 120, 125]

  function buildScene(plr) {
    var fc = facing(plr)
    var S = { ox: plr.x, oy: plr.y, oz: plr.z, fx: fc.fx, fz: fc.fz, tx: fc.tx, tz: fc.tz, sp: [], land: [] }
    for (var i = 0; i < STRIKES; i++) {
      var r = 8 - i * 0.8
      var a = 0.3 + i * 2.4
      S.sp.push([S.ox + Math.cos(a) * r, S.oy, S.oz + Math.sin(a) * r])
      S.land.push(T_FIRST + i * T_GAP)
    }
    return S
  }

  function ritualStart(plr) {
    effect(plr, 'resistance', 13, 4)
    sound(plr, 'minecraft:entity.lightning_bolt.thunder', 0.6, 0.5)
    sound(plr, 'minecraft:block.beacon.ambient', 0.8, 0.6)
    plr.tell(Text.yellow('[NxEterna] ').append(Text.gray('The sky darkens... something answers the call.')))
  }

  function bolt(plr, x, z, y0, topY, jit) {
    var segs = cnt(14)
    var px = x + rnd(jit), pz = z + rnd(jit), py = topY
    for (var i = 1; i <= segs; i++) {
      var u = i / segs
      var cx = (i === segs) ? x : x + rnd(jit) * (1 - u)
      var cz = (i === segs) ? z : z + rnd(jit) * (1 - u)
      var cy = topY + (y0 - topY) * u
      for (var j = 0; j < 3; j++) {
        var w = j / 3
        var bx = px + (cx - px) * w
        var by = py + (cy - py) * w
        var bz = pz + (cz - pz) * w
        dust(plr, C_WHITE, 1.2, bx, by, bz, 0, 0, 0, 1)
        dust(plr, C_BOLT, 2.2, bx, by, bz, 0.1, 0.1, 0.1, 1)
      }
      px = cx; pz = cz; py = cy
    }
  }

  function arc(plr, a, b, y) {
    var dx = b[0] - a[0], dz = b[1] - a[1]
    var len = Math.sqrt(dx * dx + dz * dz)
    var n = nPoints(len, 0.5)
    for (var i = 0; i <= n; i++) {
      var u = i / n
      var x = a[0] + dx * u + rnd(0.25)
      var z = a[1] + dz * u + rnd(0.25)
      dust(plr, C_ELEC, 1.1, x, y, z, 0, 0, 0, 1)
      if (i % 3 === 0) particle(plr, 'minecraft:electric_spark', x, y + 0.1, z, 0.05, 0.05, 0.05, 0.05, 1)
    }
  }

  function clouds(plr, S, t) {
    var inten = clamp01(t / 30)
    var n = cnt(Math.max(3, Math.round(12 * inten)))
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU
      var d = Math.sqrt(Math.random()) * 13
      var x = S.ox + Math.cos(a) * d
      var z = S.oz + Math.sin(a) * d
      var y = S.oy + CLOUD_Y + rnd(0.8)
      particle(plr, 'minecraft:large_smoke', x, y, z, 1.2, 0.3, 1.2, 0.005, 1)
      dust(plr, C_CLOUD, 3.0, x, y, z, 1.0, 0.3, 1.0, 1)
    }
    if (Math.random() < 0.6 * inten) {
      var fa = Math.random() * TAU
      var fd = Math.random() * 10
      particle(plr, 'minecraft:electric_spark', S.ox + Math.cos(fa) * fd, S.oy + CLOUD_Y, S.oz + Math.sin(fa) * fd, 1.0, 0.3, 1.0, 0.3, cnt(5))
    }
  }

  function rain(plr, S) {
    for (var i = 0; i < cnt(7); i++) {
      var a = Math.random() * TAU
      var d = Math.sqrt(Math.random()) * 10
      var x = S.ox + Math.cos(a) * d
      var z = S.oz + Math.sin(a) * d
      particle(plr, 'minecraft:falling_water', x, S.oy + 9 + Math.random() * 5, z, 0.05, 0.3, 0.05, 0, 1)
      if (i % 2 === 0) particle(plr, 'minecraft:rain', x, S.oy + 0.1, z, 0, 0, 0, 0, 1)
    }
  }

  function strike(plr, S, i) {
    var P = S.sp[i]
    sound(plr, 'minecraft:entity.lightning_bolt.thunder', 1.4, 0.8 + i * 0.05)
    sound(plr, 'minecraft:entity.lightning_bolt.impact', 1.0, 0.9 + i * 0.04)
    bolt(plr, P[0], P[2], P[1] + 0.1, S.oy + CLOUD_Y, 1.6)
    particle(plr, 'minecraft:electric_spark', P[0], P[1] + 0.3, P[2], 0.6, 0.3, 0.6, 0.4, cnt(25))
    particle(plr, 'minecraft:flash', P[0], P[1] + 2, P[2], 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:poof', P[0], P[1] + 0.2, P[2], 0.4, 0.1, 0.4, 0.05, cnt(8))
    ring(plr, C_ELEC, 1.2, P[0], P[1] + 0.1, P[2], 1.3, 0.35)
    if (i >= 3) effect(plr, 'glowing', 1, 0)
  }

  function drawHeartF(plr, S, c, size, n, reveal) {
    for (var i = 0; i < n; i++) {
      var fr = i / n
      if (fr > reveal) break
      var th = Math.PI + fr * TAU
      var hx = Math.pow(Math.sin(th), 3)
      var hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
      var x = c[0] + S.tx * hx * size
      var y = c[1] + hy * size
      var z = c[2] + S.tz * hx * size
      dustFade(plr, C_HEART, C_ELEC, 1.1, x, y, z, 0, 0, 0, 1)
      if (i % 5 === 0) particle(plr, 'minecraft:electric_spark', x, y, z, 0.08, 0.08, 0.08, 0.05, 1)
    }
  }

  function heart(plr, S, t) {
    var reveal = clamp01((t - T_HEART) / 22)
    var k = (t >= T_COLLAPSE) ? (t - T_COLLAPSE) / (T_FIN - T_COLLAPSE) : 0
    var pulse = 1
    for (var b = 0; b < BEATS.length; b++) {
      if (t >= BEATS[b] && t < BEATS[b] + 4) pulse = 1 + 0.2 * (1 - (t - BEATS[b]) / 4)
    }
    var front = 2.6 * (1 - k)
    var c = [S.ox + S.fx * front, S.oy + 2.8 - 1.6 * k, S.oz + S.fz * front]
    var size = 1.2 * pulse * (1 - 0.75 * k)
    drawHeartF(plr, S, c, size, cnt(52), reveal)
    drawHeartF(plr, S, c, size * 0.6, cnt(26), reveal)
  }

  function beat(plr, idx) {
    sound(plr, 'minecraft:entity.warden.heartbeat', 2.0, 0.8 + idx * 0.06)
    particle(plr, 'minecraft:electric_spark', plr.x, plr.y + 1.0, plr.z, 0.3, 0.4, 0.3, 0.2, cnt(6))
  }

  function finale(plr, S) {
    var x = plr.x, y = plr.y, z = plr.z
    sound(plr, 'minecraft:entity.lightning_bolt.thunder', 2.0, 0.6)
    sound(plr, 'minecraft:entity.lightning_bolt.impact', 1.5, 0.7)
    sound(plr, 'minecraft:item.totem.use', 1.0, 1.0)
    sound(plr, 'minecraft:block.beacon.activate', 1.5, 1.0)

    for (var b = 0; b < 3; b++) {
      bolt(plr, x + rnd(0.3), z + rnd(0.3), y, S.oy + CLOUD_Y + 2, 1.2)
    }
    for (var h = 0; h <= 16; h += 0.5) {
      dust(plr, C_WHITE, 1.8, x, y + h, z, 0.15, 0, 0.15, 1)
      dustFade(plr, C_GOLD, C_ELEC, 1.4, x, y + h + 0.25, z, 0.25, 0, 0.25, 1)
    }

    particle(plr, 'minecraft:flash', x, y + 1, z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:totem_of_undying', x, y + 1, z, 0.3, 0.5, 0.3, 0.5, cnt(40))
    for (var i = 0; i < cnt(50); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.6
      particle(plr, 'minecraft:electric_spark', x, y + 1, z, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.4, 0)
    }
    particle(plr, 'minecraft:cloud', x, y + 0.3, z, 0.8, 0.1, 0.8, 0.08, cnt(25))

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.yellow('[NxEterna] ').append(Text.white('The storm strikes true and leaves a new heart. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function shock(plr, s) {
    if (s % 2 !== 0) return
    ring(plr, C_ELEC, 1.3, plr.x, plr.y + 0.15, plr.z, 0.8 + s * 0.85, 0.6)
    if (s >= 4) ring(plr, C_GOLD, 1.1, plr.x, plr.y + 0.25, plr.z, 0.8 + (s - 4) * 0.85, 0.6)
  }

  function aura(plr, S, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.1) {
      for (var st = 0; st < 3; st++) {
        var a = s * 0.22 + st * TAU / 3
        var y = plr.y + ((s * 0.06 + st * 0.8) % 2.4)
        dustFade(plr, C_BOLT, C_ELEC, 0.9, plr.x + Math.cos(a) * 0.9, y, plr.z + Math.sin(a) * 0.9, 0, 0, 0, 1)
        particle(plr, 'minecraft:electric_spark', plr.x + Math.cos(a + 0.3) * 0.9, y, plr.z + Math.sin(a + 0.3) * 0.9, 0.05, 0.05, 0.05, 0.05, 1)
      }
    }
    if (k > 0.3 && s % 12 === 0) {
      bolt(plr, plr.x + rnd(3), plr.z + rnd(3), plr.y, plr.y + 9, 0.8)
      sound(plr, 'minecraft:entity.lightning_bolt.thunder', 0.4, 1.2)
    }
    if (k > 0.3 && s % 4 === 0) {
      drawHeartF(plr, S, [plr.x, plr.y + 2.6, plr.z], 0.35, cnt(22), 1)
    }
    if (s === 30 || s === 70) sound(plr, 'minecraft:block.amethyst_block.resonate', 1.0, 0.7)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, S) {
    if (t === 0) ritualStart(plr)
    if (t < T_FIN + 40) pin(plr, S.ox, S.oz)

    if (t < T_FIN && t % 4 === 0) clouds(plr, S, t)
    if (t < T_FIN && t % 2 === 0) rain(plr, S)

    if (t === 8 || t === 20 || t === 30) sound(plr, 'minecraft:entity.lightning_bolt.thunder', 0.5, 0.5 + t * 0.01)

    for (var i = 0; i < STRIKES; i++) {
      var land = S.land[i]
      if (t === land) strike(plr, S, i)
      if (t > land && t < land + 14 && t % 4 === 0) {
        ring(plr, C_ELEC, 1.0, S.sp[i][0], S.oy + 0.1, S.sp[i][2], 0.5 + (t - land) * 0.1, 0.35)
      }
      if (t > land && t < T_COLLAPSE && t % 4 === 0) {
        arc(plr, [S.sp[i][0], S.sp[i][2]], [S.ox, S.oz], S.oy + 0.15)
      }
    }

    if (t >= T_HEART && t < T_FIN && t % 2 === 0) heart(plr, S, t)

    for (var b = 0; b < BEATS.length; b++) {
      if (t === BEATS[b]) beat(plr, b)
    }

    if (t === T_FIN) finale(plr, S)
    if (t >= T_FIN && t < T_FIN + 17) shock(plr, t - T_FIN)
    if (t > T_FIN) aura(plr, S, t)
  }

  return {
    start: function (plr) {
      var S = buildScene(plr)
      playFrames(plr, T_END, function (p, t) { frame(p, t, S) }, 'storm')
    }
  }
})()

EFFECTS.abyss = (function () {
  var C_DEEP = [0.05, 0.25, 0.65]
  var C_AQUA = [0.20, 0.85, 0.95]
  var C_FOAM = [0.92, 1.0, 1.0]
  var C_PEARL = [1.0, 0.93, 0.97]
  var C_PINK = [1.0, 0.55, 0.78]
  var C_SAND = [0.90, 0.80, 0.55]
  var C_GOLD = [1.0, 0.85, 0.40]
  var C_HEART = [1.0, 0.45, 0.65]

  var CLAM_D = 5.4
  var SHELL_W = 1.5
  var SHELL_L = 1.9
  var ARMS = 4

  var T_EMERGE = 24
  var T_OPEN = 56
  var T_PEARL = 84
  var T_HEART = 118
  var T_FLY = 136
  var T_FIN = 152
  var T_END = 230
  var BEATS = [96, 108, 118, 126, 132, 136]

  function smooth(u) {
    return u * u * (3 - 2 * u)
  }

  function buildScene(plr) {
    var fc = facing(plr)
    return {
      ox: plr.x, oy: plr.y, oz: plr.z,
      fx: fc.fx, fz: fc.fz, tx: fc.tx, tz: fc.tz,
      hx: plr.x + fc.fx * CLAM_D, hy: plr.y, hz: plr.z + fc.fz * CLAM_D
    }
  }

  function ritualStart(plr) {
    effect(plr, 'resistance', 13, 4)
    sound(plr, 'minecraft:ambient.underwater.enter', 1.0, 0.8)
    sound(plr, 'minecraft:block.conduit.ambient', 1.0, 0.8)
    sound(plr, 'minecraft:block.bubble_column.whirlpool_ambient', 1.0, 0.8)
    plr.tell(Text.aqua('[NxEterna] ').append(Text.gray('The tide rises from nowhere...')))
  }

  function funnel(plr, S, t) {
    var fade = (t < 84) ? 1 : clamp01(1 - (t - 84) / 22)
    if (fade <= 0) return
    var grow = clamp01(t / 30)
    for (var arm = 0; arm < ARMS; arm++) {
      var n = cnt(24)
      for (var i = 0; i <= n; i++) {
        var u = i / n
        if (u > grow) break
        var ang = arm * TAU / ARMS + t * 0.14 + u * 4.5
        var r = (2.4 + u * 5.0) * (0.6 + 0.4 * fade)
        var y = S.oy + 0.15 + u * 8 * fade
        var x = S.ox + Math.cos(ang) * r
        var z = S.oz + Math.sin(ang) * r
        dustFade(plr, C_AQUA, C_DEEP, 1.2, x, y, z, 0.03, 0.03, 0.03, 1)
        if (i % 7 === 0) particle(plr, 'minecraft:splash', x, y, z, 0.1, 0.1, 0.1, 0, 1)
      }
    }
  }

  function rain(plr, S) {
    for (var i = 0; i < cnt(6); i++) {
      var a = Math.random() * TAU
      var d = Math.sqrt(Math.random()) * 10
      particle(plr, 'minecraft:falling_water', S.ox + Math.cos(a) * d, S.oy + 8 + Math.random() * 5, S.oz + Math.sin(a) * d, 0.05, 0.3, 0.05, 0, 1)
    }
    var a2 = Math.random() * TAU
    var d2 = 1 + Math.random() * 8
    particle(plr, 'minecraft:splash', S.ox + Math.cos(a2) * d2, S.oy + 0.1, S.oz + Math.sin(a2) * d2, 0.1, 0, 0.1, 0, cnt(2))
  }

  function ripple(plr, S, t) {
    var s = t % 28
    if (s > 18 || s % 3 !== 0) return
    ring(plr, C_AQUA, 1.0, S.ox, S.oy + 0.1, S.oz, 1 + s * 0.45, 0.7)
  }

  function growAt(t) {
    return smooth(clamp01((t - T_EMERGE) / 30))
  }

  function openAt(t) {
    if (t < T_OPEN) return 0.08
    var o = 0.08 + 1.0 * smooth(clamp01((t - T_OPEN) / 30))
    if (t >= T_FLY) o -= 0.9 * smooth(clamp01((t - T_FLY) / (T_FIN - T_FLY)))
    return o
  }

  function shellPoint(S, upper, l, d, a) {
    var dx = -S.fx, dz = -S.fz
    if (!upper) {
      return [S.hx + S.tx * l + dx * d, S.hy + 0.15 + 0.1 * d, S.hz + S.tz * l + dz * d]
    }
    var ca = Math.cos(a), sa = Math.sin(a)
    return [S.hx + S.tx * l + dx * d * ca, S.hy + 0.3 + sa * d, S.hz + S.tz * l + dz * d * ca]
  }

  function drawClam(plr, S, t) {
    var g = growAt(t)
    if (g < 0.02) return
    var a = openAt(t)
    var nR = cnt(6)
    var m = 5
    for (var side = 0; side < 2; side++) {
      for (var j = -nR; j <= nR; j++) {
        var fr = j / nR
        var l = fr * SHELL_W * g
        var L = SHELL_L * g * Math.sqrt(Math.max(0, 1 - fr * fr)) + 0.05
        for (var k = 1; k <= m; k++) {
          var d = L * k / m
          var p = shellPoint(S, side === 1, l, d, a)
          if (k === m) {
            dust(plr, C_FOAM, 1.5, p[0], p[1], p[2], 0, 0, 0, 1)
          } else if ((j + k) % 2 === 0) {
            dust(plr, (side === 1) ? C_PEARL : C_PINK, 1.2, p[0], p[1], p[2], 0, 0, 0, 1)
          } else {
            dust(plr, (side === 1) ? C_PINK : C_PEARL, 1.2, p[0], p[1], p[2], 0, 0, 0, 1)
          }
        }
      }
    }
    if (a > 0.5) {
      dust(plr, C_PEARL, 2.0, S.hx - S.fx * 0.9, S.hy + 0.5, S.hz - S.fz * 0.9, 0.5, 0.2, 0.5, 2)
    }
  }

  function emerge(plr, S) {
    sound(plr, 'minecraft:entity.generic.splash', 1.4, 0.6)
    sound(plr, 'minecraft:block.sand.break', 1.2, 0.6)
    sound(plr, 'minecraft:block.conduit.activate', 0.8, 0.6)
    var cx = S.hx - S.fx * 0.9, cz = S.hz - S.fz * 0.9
    particle(plr, 'minecraft:splash', cx, S.hy + 0.5, cz, 1.2, 0.5, 1.2, 0.1, cnt(40))
    dust(plr, C_SAND, 1.6, cx, S.hy + 0.4, cz, 1.0, 0.6, 1.0, cnt(15))
    ring(plr, C_FOAM, 1.2, cx, S.hy + 0.15, cz, 1.6, 0.4)
  }

  function spray(plr, S) {
    particle(plr, 'minecraft:splash', S.hx - S.fx * 0.9, S.hy + 0.6, S.hz - S.fz * 0.9, 0.9, 0.3, 0.9, 0.05, cnt(12))
    dust(plr, C_SAND, 1.3, S.hx - S.fx * 0.9, S.hy + 0.3, S.hz - S.fz * 0.9, 0.7, 0.2, 0.7, cnt(4))
  }

  function openBurst(plr, S) {
    sound(plr, 'minecraft:block.conduit.activate', 1.2, 0.8)
    sound(plr, 'minecraft:block.chest.open', 1.0, 0.5)
    sound(plr, 'minecraft:block.amethyst_block.chime', 1.0, 0.7)
    particle(plr, 'minecraft:end_rod', S.hx - S.fx * 0.9, S.hy + 0.6, S.hz - S.fz * 0.9, 0.5, 0.3, 0.5, 0.05, cnt(15))
  }

  function godrays(plr, S) {
    for (var c = -1; c <= 1; c++) {
      var x = S.hx + S.tx * c * 0.6 - S.fx * 0.9
      var z = S.hz + S.tz * c * 0.6 - S.fz * 0.9
      for (var h = 0; h <= 14; h += 0.8) {
        dustFade(plr, C_FOAM, C_AQUA, 0.9, x, S.hy + h, z, 0.05, 0, 0.05, 1)
      }
    }
  }

  function pearlBase(S, t) {
    var e = smooth(clamp01((t - T_PEARL) / 34))
    return [S.hx - S.fx * 0.9, S.hy + 0.5 + 1.4 * e + Math.sin(t * 0.12) * 0.05, S.hz - S.fz * 0.9]
  }

  function corePos(S, plr, t) {
    if (t < T_FLY) return pearlBase(S, t)
    var v = clamp01((t - T_FLY) / (T_FIN - T_FLY))
    var p0 = [S.hx - S.fx * 0.9, S.hy + 1.9, S.hz - S.fz * 0.9]
    var chest = [plr.x, plr.y + 1.3, plr.z]
    var p = lerp3(p0, chest, smooth(v))
    var side = Math.sin(v * TAU) * 0.5 * (1 - v)
    return [p[0] + S.tx * side, p[1] + Math.sin(v * Math.PI) * 1.2, p[2] + S.tz * side]
  }

  function drawHeartP(plr, S, c, size, n, colA, colB, scale) {
    for (var i = 0; i < n; i++) {
      var th = Math.PI + i * TAU / n
      var hx = Math.pow(Math.sin(th), 3)
      var hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
      dustFade(plr, colA, colB, scale, c[0] + S.tx * hx * size, c[1] + hy * size, c[2] + S.tz * hx * size, 0, 0, 0, 1)
    }
  }

  function drawCore(plr, S, t) {
    var c = corePos(S, plr, t)
    var sc = 1.2 + 1.4 * clamp01((t - (T_OPEN + 12)) / 30)
    dust(plr, C_PEARL, sc * 1.6, c[0], c[1], c[2], 0.05, 0.05, 0.05, cnt(3))
    dust(plr, C_FOAM, 1.4, c[0], c[1], c[2], 0.15, 0.15, 0.15, 2)
    if (t % 4 === 0) particle(plr, 'minecraft:end_rod', c[0], c[1], c[2], 0.1, 0.1, 0.1, 0.01, 1)

    if (t >= T_HEART && t < T_FIN) {
      var size = 0.9 * clamp01((t - T_HEART) / 14)
      if (t >= T_FLY) size *= 1 - 0.55 * clamp01((t - T_FLY) / (T_FIN - T_FLY))
      var pulse = 1
      for (var b = 0; b < BEATS.length; b++) {
        if (t >= BEATS[b] && t < BEATS[b] + 4) pulse = 1 + 0.2 * (1 - (t - BEATS[b]) / 4)
      }
      size *= pulse
      drawHeartP(plr, S, c, size, cnt(26), C_HEART, C_PEARL, 1.0)
      drawHeartP(plr, S, c, size * 0.62, cnt(15), C_HEART, C_PEARL, 1.0)
      drawHeartP(plr, S, c, size * 0.28, cnt(7), C_PEARL, C_GOLD, 1.0)
    }
  }

  function streams(plr, S, t) {
    var P = pearlBase(S, t)
    for (var i = 0; i < 6; i++) {
      var ph = (t - T_OPEN - 4 + i * 5) % 30
      if (ph < 0) continue
      var u = ph / 30
      var dir = (i % 2 === 0) ? 1 : -1
      for (var k = 0; k <= 4; k++) {
        var uu = u - k * 0.035
        if (uu < 0) break
        var ang = i * TAU / 6 + dir * uu * 2.4
        var r = 8 * (1 - uu) * (1 - uu)
        var y = S.oy + 0.3 + (P[1] - S.oy - 0.3) * uu * uu + Math.sin(uu * Math.PI) * 1.2
        var x = P[0] + Math.cos(ang) * r
        var z = P[2] + Math.sin(ang) * r
        if (k === 0) {
          dust(plr, C_FOAM, 1.3, x, y, z, 0.02, 0.02, 0.02, 1)
          if (t % 3 === 0) particle(plr, 'minecraft:splash', x, y, z, 0.05, 0.05, 0.05, 0, 1)
        } else {
          dustFade(plr, C_AQUA, C_DEEP, 1.2 - k * 0.2, x, y, z, 0, 0, 0, 1)
        }
      }
      if (ph === 29) {
        particle(plr, 'minecraft:end_rod', P[0], P[1], P[2], 0.2, 0.2, 0.2, 0.05, cnt(4))
        sound(plr, 'minecraft:block.amethyst_block.chime', 0.6, 0.7 + i * 0.08)
      }
    }
  }

  function beat(plr, idx) {
    sound(plr, 'minecraft:entity.warden.heartbeat', 2.0, 0.8 + idx * 0.06)
    particle(plr, 'minecraft:bubble_pop', plr.x, plr.y + 1.0, plr.z, 0.3, 0.4, 0.3, 0.02, cnt(6))
    if (idx >= 3) effect(plr, 'glowing', 1, 0)
  }

  function finale(plr, S) {
    var x = plr.x, y = plr.y, z = plr.z
    sound(plr, 'minecraft:item.totem.use', 1.0, 1.1)
    sound(plr, 'minecraft:block.beacon.activate', 1.5, 1.1)
    sound(plr, 'minecraft:block.conduit.activate', 1.5, 1.0)
    sound(plr, 'minecraft:entity.player.splash.high_speed', 1.2, 0.8)
    sound(plr, 'minecraft:entity.generic.splash', 1.5, 0.7)

    particle(plr, 'minecraft:flash', x, y + 1, z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:splash', x, y + 1, z, 1.2, 0.8, 1.2, 0.2, cnt(80))
    particle(plr, 'minecraft:bubble_pop', x, y + 1, z, 0.8, 0.8, 0.8, 0.05, cnt(40))
    particle(plr, 'minecraft:totem_of_undying', x, y + 1, z, 0.3, 0.5, 0.3, 0.5, cnt(30))

    for (var h = 0; h <= 14; h += 0.5) {
      dust(plr, C_FOAM, 1.6, x, y + h, z, 0.15, 0, 0.15, 1)
      dustFade(plr, C_AQUA, C_DEEP, 1.3, x, y + h + 0.25, z, 0.25, 0, 0.25, 1)
    }
    for (var i = 0; i < cnt(40); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.6
      particle(plr, 'minecraft:end_rod', x, y + 1, z, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.3, 0)
    }

    particle(plr, 'minecraft:splash', S.hx - S.fx * 0.9, S.hy + 0.8, S.hz - S.fz * 0.9, 1.5, 0.5, 1.5, 0.2, cnt(60))
    dust(plr, C_PINK, 1.6, S.hx - S.fx * 0.9, S.hy + 0.6, S.hz - S.fz * 0.9, 1.2, 0.5, 1.2, cnt(20))
    dust(plr, C_PEARL, 1.6, S.hx - S.fx * 0.9, S.hy + 0.6, S.hz - S.fz * 0.9, 1.2, 0.5, 1.2, cnt(20))

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.aqua('[NxEterna] ').append(Text.white('The abyss gives up a pearl, and it becomes your heart. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function shock(plr, s) {
    if (s % 2 !== 0) return
    var R = 0.8 + s * 0.85
    ring(plr, C_AQUA, 1.3, plr.x, plr.y + 0.15, plr.z, R, 0.6)
    if (s >= 4) ring(plr, C_PEARL, 1.2, plr.x, plr.y + 0.25, plr.z, R - 3.4, 0.6)
    var n = cnt(10)
    for (var i = 0; i < n; i++) {
      var a = i * TAU / n
      particle(plr, 'minecraft:splash', plr.x + Math.cos(a) * R, plr.y + 0.2, plr.z + Math.sin(a) * R, 0.1, 0, 0.1, 0, 2)
    }
  }

  function aura(plr, S, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.1) {
      for (var st = 0; st < 3; st++) {
        var a = s * 0.2 + st * TAU / 3
        var y = plr.y + ((s * 0.05 + st * 0.8) % 2.4)
        dustFade(plr, C_AQUA, C_DEEP, 0.9, plr.x + Math.cos(a) * 0.9, y, plr.z + Math.sin(a) * 0.9, 0, 0, 0, 1)
        particle(plr, 'minecraft:bubble_pop', plr.x + Math.cos(a + 0.3) * 0.9, y, plr.z + Math.sin(a + 0.3) * 0.9, 0, 0, 0, 0, 1)
      }
    }
    if (k > 0.3 && s % 3 === 0) {
      particle(plr, 'minecraft:falling_water', plr.x + rnd(1.0), plr.y + 2.5, plr.z + rnd(1.0), 0, 0, 0, 0, 1)
    }
    if (k > 0.3 && s % 10 === 0) {
      particle(plr, 'minecraft:splash', plr.x + rnd(0.8), plr.y + 0.1, plr.z + rnd(0.8), 0.2, 0, 0.2, 0, cnt(3))
    }
    if (k > 0.3 && s % 4 === 0) {
      drawHeartP(plr, S, [plr.x, plr.y + 2.6, plr.z], 0.35, cnt(22), C_HEART, C_PEARL, 0.8)
    }
    if (s === 30) sound(plr, 'minecraft:block.conduit.ambient', 1.0, 0.9)
    if (s === 70) sound(plr, 'minecraft:block.amethyst_block.resonate', 1.0, 0.7)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, S) {
    if (t === 0) ritualStart(plr)
    if (t < T_FIN + 30) pin(plr, S.ox, S.oz)

    if (t < T_FIN && t % 3 === 0) funnel(plr, S, t)
    if (t < T_FIN && t % 2 === 0) rain(plr, S)
    if (t < T_FIN && t % 3 === 0) ripple(plr, S, t)

    if (t >= 8 && t < T_OPEN && t % 16 === 0) sound(plr, 'minecraft:block.bubble_column.whirlpool_ambient', 0.8, 0.7 + t * 0.005)

    if (t === T_EMERGE) emerge(plr, S)
    if (t > T_EMERGE && t < T_OPEN && t % 4 === 0) spray(plr, S)
    if (t === T_OPEN) openBurst(plr, S)
    if (t >= T_EMERGE && t < T_FIN && t % 3 === 0) drawClam(plr, S, t)
    if (t >= T_OPEN && t < T_FIN && t % 4 === 0) godrays(plr, S)

    if (t >= T_OPEN + 4 && t <= T_HEART + 6) streams(plr, S, t)
    if (t >= T_OPEN + 12 && t < T_FIN && t % 2 === 0) drawCore(plr, S, t)
    if (t === T_PEARL) sound(plr, 'minecraft:block.conduit.ambient', 1.2, 1.2)

    for (var b = 0; b < BEATS.length; b++) {
      if (t === BEATS[b]) beat(plr, b)
    }

    if (t === T_FIN) finale(plr, S)
    if (t >= T_FIN && t < T_FIN + 17) shock(plr, t - T_FIN)
    if (t > T_FIN) aura(plr, S, t)
  }

  return {
    start: function (plr) {
      var S = buildScene(plr)
      playFrames(plr, T_END, function (p, t) { frame(p, t, S) }, 'abyss')
    }
  }
})()

EFFECTS.cosmos = (function () {
  var C_WHITE = [1.0, 1.0, 1.0]
  var C_HOT = [1.0, 0.94, 0.78]
  var C_GOLD = [1.0, 0.82, 0.30]
  var C_ORANGE = [1.0, 0.50, 0.10]
  var C_MAG = [0.95, 0.20, 0.65]
  var C_VIOLET = [0.50, 0.20, 1.0]
  var C_BLUE = [0.25, 0.50, 1.0]
  var C_CYAN = [0.30, 0.95, 1.0]
  var C_VOID = [0.03, 0.0, 0.08]
  var C_HEART = [1.0, 0.30, 0.55]

  var HOLE_DIST = 7
  var HOLE_H = 7
  var TILT = -0.55
  var DISK_R = [1.5, 2.3, 3.1, 4.0, 4.9, 5.8]
  var DISK_COL = [
    [C_WHITE, C_HOT], [C_HOT, C_GOLD], [C_GOLD, C_ORANGE],
    [C_ORANGE, C_MAG], [C_MAG, C_VIOLET], [C_VIOLET, C_BLUE]
  ]
  var COMETS = 6
  var COMET_LEN = 54

  var T_DISK = 8
  var T_JETS = 36
  var T_COLLAPSE = 106
  var T_NOVA = 128
  var T_FLY = 150
  var T_FIN = 178
  var T_END = 255
  var BEATS = [138, 146, 154, 162, 168, 173]

  function smooth(u) {
    return u * u * (3 - 2 * u)
  }

  function buildScene(plr) {
    var fc = facing(plr)
    return {
      ox: plr.x, oy: plr.y, oz: plr.z,
      fx: fc.fx, fz: fc.fz, tx: fc.tx, tz: fc.tz,
      hx: plr.x + fc.fx * HOLE_DIST, hy: plr.y + HOLE_H, hz: plr.z + fc.fz * HOLE_DIST
    }
  }

  function diskPt(S, r, a, lift) {
    var c = Math.cos(TILT), s = Math.sin(TILT)
    var ca = Math.cos(a) * r, sa = Math.sin(a) * r
    return [S.hx + S.tx * ca + S.fx * c * sa, S.hy + s * sa + (lift || 0), S.hz + S.tz * ca + S.fz * c * sa]
  }

  function sphereShell(plr, c, R, n, colA, colB, scale) {
    for (var i = 0; i < n; i++) {
      var y = 1 - 2 * (i + 0.5) / n
      var rr = Math.sqrt(Math.max(0, 1 - y * y))
      var th = i * 2.399963
      dustFade(plr, colA, colB, scale, c[0] + Math.cos(th) * rr * R, c[1] + y * R, c[2] + Math.sin(th) * rr * R, 0, 0, 0, 1)
    }
  }

  function heartAt(plr, S, c, size, n, colA, colB, scale) {
    for (var i = 0; i < n; i++) {
      var th = Math.PI + i * TAU / n
      var hx = Math.pow(Math.sin(th), 3)
      var hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
      dustFade(plr, colA, colB, scale, c[0] + S.tx * hx * size, c[1] + hy * size, c[2] + S.tz * hx * size, 0, 0, 0, 1)
    }
  }

  function ritualStart(plr) {
    effect(plr, 'resistance', 14, 4)
    sound(plr, 'minecraft:block.respawn_anchor.charge', 1.2, 0.5)
    sound(plr, 'minecraft:entity.wither.ambient', 0.8, 0.4)
    sound(plr, 'minecraft:block.portal.ambient', 1.0, 0.5)
    plr.tell(Text.lightPurple('[NxEterna] ').append(Text.gray('Space itself begins to bend...')))
  }

  function atmosphere(plr, S, t) {
    var fade = (t < T_NOVA) ? clamp01(t / 30) : 0
    if (fade <= 0) return
    var n = cnt(Math.max(3, Math.round(9 * fade)))
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU
      var d = Math.sqrt(Math.random()) * 15
      var x = S.ox + Math.cos(a) * d
      var z = S.oz + Math.sin(a) * d
      dust(plr, C_VOID, 4.0, x, S.oy + 13 + rnd(1), z, 1.3, 0.3, 1.3, 1)
    }
    if (t % 8 === 0) {
      for (var j = 0; j < cnt(3); j++) {
        var b = Math.random() * TAU
        var dd = 4 + Math.random() * 10
        particle(plr, 'minecraft:end_rod', S.ox + Math.cos(b) * dd, S.oy + 6 + Math.random() * 8, S.oz + Math.sin(b) * dd, 0, 0, 0, 0, 1)
      }
    }
  }

  function galaxy(plr, S, t) {
    var rev = clamp01(t / 45)
    var n = cnt(24)
    for (var arm = 0; arm < 3; arm++) {
      for (var j = 0; j <= n; j++) {
        var u = j / n
        if (u > rev) break
        var r = 1.0 + u * 8.5
        var ang = arm * TAU / 3 + u * 3.4 + t * 0.03
        var x = S.ox + Math.cos(ang) * r
        var z = S.oz + Math.sin(ang) * r
        if (u < 0.35) dustFade(plr, C_HOT, C_GOLD, 1.1, x, S.oy + 0.1, z, 0.05, 0, 0.05, 1)
        else if (u < 0.7) dustFade(plr, C_CYAN, C_BLUE, 1.1, x, S.oy + 0.1, z, 0.08, 0, 0.08, 1)
        else dustFade(plr, C_VIOLET, C_MAG, 1.0, x, S.oy + 0.1, z, 0.1, 0, 0.1, 1)
      }
    }
    dust(plr, C_WHITE, 1.8, S.ox, S.oy + 0.15, S.oz, 0.4, 0, 0.4, cnt(3))
    for (var k = 0; k < cnt(2); k++) {
      var a2 = Math.random() * TAU
      var d2 = Math.random() * 9
      particle(plr, 'minecraft:end_rod', S.ox + Math.cos(a2) * d2, S.oy + 0.1, S.oz + Math.sin(a2) * d2, 0, 1, 0, 0.015, 0)
    }
  }

  function drawHole(plr, S, t) {
    var g = smooth(clamp01(t / 20))
    if (g < 0.03) return
    var k = clamp01((t - T_COLLAPSE) / (T_NOVA - T_COLLAPSE))
    var c = [S.hx, S.hy, S.hz]

    dust(plr, C_VOID, 4.0 * g, c[0], c[1], c[2], 0.25, 0.25, 0.25, cnt(8))
    particle(plr, 'minecraft:squid_ink', c[0], c[1], c[2], 0.2, 0.2, 0.2, 0.01, cnt(2))

    var R = 1.2 * g * (1 + 0.6 * k)
    var n = cnt(32)
    for (var i = 0; i < n; i++) {
      var a = i * TAU / n + t * 0.12
      dustFade(plr, C_WHITE, C_GOLD, 1.2, c[0] + S.tx * Math.cos(a) * R, c[1] + Math.sin(a) * R, c[2] + S.tz * Math.cos(a) * R, 0, 0, 0, 1)
    }

    if (k > 0) {
      dust(plr, C_WHITE, 2.5 + 1.5 * k, c[0], c[1], c[2], 0.3, 0.3, 0.3, cnt(4 + Math.round(6 * k)))
      particle(plr, 'minecraft:end_rod', c[0], c[1], c[2], 0.5 * k, 0.5 * k, 0.5 * k, 0.05, cnt(2 + Math.round(4 * k)))
    }
  }

  function drawDisk(plr, S, t) {
    var grow = smooth(clamp01((t - T_DISK) / 30))
    var k = clamp01((t - T_COLLAPSE) / (T_NOVA - T_COLLAPSE))
    var scale = grow * (1 - 0.85 * k)
    if (scale < 0.03) return

    for (var i = 0; i < DISK_R.length; i++) {
      var r = DISK_R[i] * scale
      var n = cnt(Math.round(12 + DISK_R[i] * 6))
      var om = 0.5 / Math.pow(DISK_R[i], 1.5)
      var ph = om * (t + 40 * k * k)
      var col = DISK_COL[i]
      for (var j = 0; j < n; j++) {
        var a = ph + j * TAU / n
        var p = diskPt(S, r, a, Math.sin(a * 3 + t * 0.1) * 0.12)
        dustFade(plr, col[0], col[1], 1.1, p[0], p[1], p[2], 0.02, 0.02, 0.02, 1)
      }
      if (Math.random() < 0.5) {
        var sa = Math.random() * TAU
        var sp = diskPt(S, r, sa, 0)
        particle(plr, 'minecraft:electric_spark', sp[0], sp[1], sp[2], 0.1, 0.1, 0.1, 0.05, 1)
      }
    }
  }

  function jets(plr, S, t) {
    var len = 10 * smooth(clamp01((t - T_JETS) / 24))
    if (len < 1) return
    for (var dir = -1; dir <= 1; dir += 2) {
      for (var h = 0.8; h <= len; h += 0.8) {
        var w = 0.2 + h * 0.04
        var a = h * 1.1 - t * 0.35 + (dir > 0 ? 0 : 2)
        var x = S.hx + S.tx * Math.cos(a) * w + S.fx * Math.sin(a) * w
        var z = S.hz + S.tz * Math.cos(a) * w + S.fz * Math.sin(a) * w
        dustFade(plr, C_CYAN, C_VIOLET, 1.0, x, S.hy + dir * h, z, 0.02, 0.02, 0.02, 1)
      }
      particle(plr, 'minecraft:end_rod', S.hx, S.hy + dir * len, S.hz, 0.1, 0.1, 0.1, 0.02, 1)
    }
  }

  function cometPos(S, i, u) {
    var ang = i * TAU / COMETS + u * 5.5
    var r = 0.5 + 15 * Math.pow(1 - u, 1.7)
    var y = S.hy + Math.sin(i * 2.3) * 6 * (1 - u) * (1 - u)
    return [S.hx + Math.cos(ang) * r, y, S.hz + Math.sin(ang) * r]
  }

  function comets(plr, S, t) {
    for (var i = 0; i < COMETS; i++) {
      var tt = t - 12 + i * 9
      if (tt < 0) continue
      var ph = tt % COMET_LEN
      var u = ph / COMET_LEN
      var h = cometPos(S, i, u)
      dust(plr, C_WHITE, 1.4, h[0], h[1], h[2], 0.02, 0.02, 0.02, 1)
      particle(plr, 'minecraft:end_rod', h[0], h[1], h[2], 0, 0, 0, 0, 1)
      for (var k = 1; k <= 5; k++) {
        var uu = u - k * 0.025
        if (uu < 0) break
        var p = cometPos(S, i, uu)
        dustFade(plr, C_ORANGE, C_VIOLET, 1.2 - k * 0.17, p[0], p[1], p[2], 0, 0, 0, 1)
      }
      if (ph >= COMET_LEN - 2) {
        dust(plr, C_WHITE, 2.0, S.hx, S.hy, S.hz, 0.5, 0.5, 0.5, cnt(5))
        sound(plr, 'minecraft:block.amethyst_block.chime', 0.7, 0.6 + i * 0.1)
      }
    }
  }

  function nova(plr, S) {
    sound(plr, 'minecraft:entity.generic.explode', 1.5, 0.5)
    sound(plr, 'minecraft:entity.warden.sonic_boom', 1.5, 0.6)
    sound(plr, 'minecraft:entity.ender_dragon.growl', 1.0, 0.5)
    sound(plr, 'minecraft:block.beacon.power_select', 1.5, 0.7)
    sound(plr, 'minecraft:item.totem.use', 0.8, 0.8)

    particle(plr, 'minecraft:flash', S.hx, S.hy, S.hz, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:flash', plr.x, plr.y + 1, plr.z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:explosion_emitter', S.hx, S.hy, S.hz, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:sonic_boom', S.hx, S.hy, S.hz, 0, 0, 0, 0, 1)

    for (var i = 0; i < cnt(60); i++) {
      var th = Math.random() * TAU
      var y = Math.random() * 2 - 1
      var rr = Math.sqrt(1 - y * y)
      var type = (i % 3 === 0) ? 'minecraft:firework' : 'minecraft:end_rod'
      particle(plr, type, S.hx, S.hy, S.hz, Math.cos(th) * rr, y, Math.sin(th) * rr, 0.45, 0)
    }
    effect(plr, 'glowing', 3, 0)
  }

  function novaShell(plr, S, s) {
    if (s % 2 !== 0 || s > 24) return
    var R = 1 + s * 0.85
    var c = [S.hx, S.hy, S.hz]
    sphereShell(plr, c, R, cnt(Math.min(110, 40 + Math.round(R * 5))), C_WHITE, C_ORANGE, 1.6)
    if (s >= 4) sphereShell(plr, c, R * 0.6, cnt(40), C_CYAN, C_VIOLET, 1.3)
    ring(plr, C_MAG, 1.3, S.hx, S.hy, S.hz, R, 0.7)
  }

  function heartCenter(S, plr, t) {
    if (t < T_FLY) return [S.hx, S.hy + Math.sin(t * 0.1) * 0.1, S.hz]
    var v = clamp01((t - T_FLY) / (T_FIN - T_FLY))
    var chest = [plr.x, plr.y + 1.3, plr.z]
    var p = lerp3([S.hx, S.hy, S.hz], chest, smooth(v))
    var side = Math.sin(v * TAU) * 1.2 * (1 - v)
    return [p[0] + S.tx * side, p[1] + Math.sin(v * Math.PI) * 1.5, p[2] + S.tz * side]
  }

  function heartSize(t) {
    var s = 2.4 * smooth(clamp01((t - T_NOVA) / 18))
    if (t >= T_FLY) s *= 1 - 0.7 * smooth(clamp01((t - T_FLY) / (T_FIN - T_FLY)))
    var pulse = 1
    for (var b = 0; b < BEATS.length; b++) {
      if (t >= BEATS[b] && t < BEATS[b] + 4) pulse = 1 + 0.2 * (1 - (t - BEATS[b]) / 4)
    }
    return s * pulse
  }

  function nebulaHeart(plr, S, t) {
    var size = heartSize(t)
    if (size < 0.05) return
    var c = heartCenter(S, plr, t)

    heartAt(plr, S, c, size, cnt(46), C_HEART, C_WHITE, 1.2)
    heartAt(plr, S, c, size * 0.72, cnt(30), C_MAG, C_VIOLET, 1.1)
    heartAt(plr, S, c, size * 0.45, cnt(18), C_CYAN, C_BLUE, 1.1)
    heartAt(plr, S, c, size * 0.2, cnt(8), C_WHITE, C_GOLD, 1.2)

    var pal = [C_HEART, C_MAG, C_VIOLET, C_CYAN, C_GOLD]
    for (var i = 0; i < cnt(8); i++) {
      var th = Math.PI + Math.random() * TAU
      var q = Math.sqrt(Math.random()) * size
      var hx = Math.pow(Math.sin(th), 3)
      var hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
      var col = pal[Math.floor(Math.random() * pal.length)]
      dust(plr, col, 1.6, c[0] + S.tx * hx * q, c[1] + hy * q, c[2] + S.tz * hx * q, 0.05, 0.05, 0.05, 1)
    }

    var R = size * 1.5
    var m = cnt(22)
    for (var j = 0; j < m; j++) {
      var a = j * TAU / m + t * 0.2
      dustFade(plr, C_GOLD, C_ORANGE, 1.0,
        c[0] + S.tx * Math.cos(a) * R + S.fx * Math.sin(a) * R * 0.5,
        c[1] + Math.sin(a) * R * 0.3,
        c[2] + S.tz * Math.cos(a) * R + S.fz * Math.sin(a) * R * 0.5, 0, 0, 0, 1)
    }

    if (t % 4 === 0) particle(plr, 'minecraft:end_rod', c[0] + rnd(size), c[1] + rnd(size), c[2] + rnd(size), 0, 0, 0, 0.01, 2)
    if (t >= T_FLY) {
      dustFade(plr, C_WHITE, C_HEART, 1.4, c[0], c[1], c[2], 0.2, 0.2, 0.2, cnt(3))
    }
  }

  function beat(plr, idx) {
    sound(plr, 'minecraft:entity.warden.heartbeat', 2.0, 0.7 + idx * 0.07)
    particle(plr, 'minecraft:end_rod', plr.x, plr.y + 1.2, plr.z, 0.3, 0.4, 0.3, 0.03, cnt(4))
    if (idx >= 3) effect(plr, 'glowing', 1, 0)
  }

  function finale(plr) {
    var x = plr.x, y = plr.y, z = plr.z
    sound(plr, 'minecraft:item.totem.use', 1.0, 1.0)
    sound(plr, 'minecraft:block.beacon.activate', 1.5, 0.9)
    sound(plr, 'minecraft:block.bell.use', 1.5, 0.8)
    sound(plr, 'minecraft:entity.ender_dragon.growl', 0.8, 1.3)
    sound(plr, 'minecraft:block.end_portal.spawn', 0.7, 1.4)
    sound(plr, 'minecraft:block.amethyst_cluster.break', 1.2, 0.7)

    particle(plr, 'minecraft:flash', x, y + 1, z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:totem_of_undying', x, y + 1, z, 0.3, 0.5, 0.3, 0.5, cnt(40))
    particle(plr, 'minecraft:heart', x, y + 1.6, z, 0.8, 0.6, 0.8, 0, cnt(14))

    for (var h = 0; h <= 18; h += 0.5) {
      dust(plr, C_WHITE, 1.8, x, y + h, z, 0.15, 0, 0.15, 1)
      dustFade(plr, C_CYAN, C_VIOLET, 1.4, x, y + h + 0.25, z, 0.25, 0, 0.25, 1)
    }
    for (var i = 0; i < cnt(45); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.6
      particle(plr, 'minecraft:end_rod', x, y + 1, z, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.35, 0)
    }

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.lightPurple('[NxEterna] ').append(Text.white('A dying star becomes your heart. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function shock(plr, s) {
    if (s % 2 !== 0) return
    ring(plr, C_MAG, 1.3, plr.x, plr.y + 0.15, plr.z, 0.8 + s * 0.85, 0.6)
    if (s >= 4) ring(plr, C_CYAN, 1.1, plr.x, plr.y + 0.25, plr.z, 0.8 + (s - 4) * 0.85, 0.6)
    if (s <= 12) sphereShell(plr, [plr.x, plr.y + 1, plr.z], 0.6 + s * 0.7, cnt(50), C_WHITE, C_VIOLET, 1.2)
  }

  function aura(plr, S, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.1) {
      var n = cnt(26)
      for (var i = 0; i < n; i++) {
        var a = i * TAU / n + s * 0.15
        dustFade(plr, C_GOLD, C_VIOLET, 0.9,
          plr.x + Math.cos(a) * 1.3,
          plr.y + 1.2 + Math.sin(a) * 1.3 * Math.sin(0.45),
          plr.z + Math.sin(a) * 1.3 * Math.cos(0.45), 0, 0, 0, 1)
      }
      for (var m = 0; m < 2; m++) {
        for (var tr = 0; tr <= 4; tr++) {
          var b = -s * 0.25 + m * Math.PI + tr * 0.12
          var mx = plr.x + Math.cos(b) * 1.6
          var my = plr.y + 1.2 + Math.sin(b) * 0.6
          var mz = plr.z + Math.sin(b) * 1.6
          if (tr === 0) {
            dust(plr, C_WHITE, 1.4, mx, my, mz, 0, 0, 0, 1)
            particle(plr, 'minecraft:end_rod', mx, my, mz, 0, 0, 0, 0, 1)
          } else {
            dustFade(plr, C_CYAN, C_BLUE, 1.2 - tr * 0.2, mx, my, mz, 0, 0, 0, 1)
          }
        }
      }
    }
    if (k > 0.3 && s % 4 === 0) {
      heartAt(plr, S, [plr.x, plr.y + 2.8, plr.z], 0.35, cnt(22), C_HEART, C_WHITE, 0.8)
    }
    if (k > 0.2 && s % 3 === 0) {
      for (var j = 0; j < cnt(2); j++) {
        particle(plr, 'minecraft:end_rod', plr.x + rnd(2.5), plr.y + 4 + Math.random() * 2, plr.z + rnd(2.5), 0, -1, 0, 0.03, 0)
      }
    }
    if (s === 30 || s === 70) sound(plr, 'minecraft:block.amethyst_block.resonate', 1.0, 0.5 + s * 0.004)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, S) {
    if (t === 0) ritualStart(plr)
    if (t < T_FIN + 40) pin(plr, S.ox, S.oz)

    if (t < T_NOVA) {
      if (t % 4 === 0) atmosphere(plr, S, t)
      if (t >= 4 && t % 2 === 0) drawHole(plr, S, t)
      if (t >= T_DISK && t % 2 === 0) drawDisk(plr, S, t)
      if (t >= T_JETS && t < T_NOVA - 4 && t % 2 === 0) jets(plr, S, t)
      if (t >= 12 && t <= T_COLLAPSE + 14 && t % 2 === 0) comets(plr, S, t)

      if (t === 20 || t === 40 || t === 60 || t === 80) sound(plr, 'minecraft:block.beacon.ambient', 1.0, 0.5 + t * 0.006)
      if (t >= T_COLLAPSE && t % 6 === 0) sound(plr, 'minecraft:block.respawn_anchor.charge', 1.2, 0.5 + (t - T_COLLAPSE) * 0.03)
      if (t === T_COLLAPSE) sound(plr, 'minecraft:entity.warden.roar', 0.8, 0.5)
    }
    if (t >= 6 && t < T_FIN && t % 4 === 0) galaxy(plr, S, t)

    if (t === T_NOVA) nova(plr, S)
    if (t >= T_NOVA && t <= T_NOVA + 24) novaShell(plr, S, t - T_NOVA)
    if (t >= T_NOVA && t < T_FIN && t % 2 === 0) nebulaHeart(plr, S, t)

    for (var b = 0; b < BEATS.length; b++) {
      if (t === BEATS[b]) beat(plr, b)
    }

    if (t === T_FIN) finale(plr)
    if (t >= T_FIN && t < T_FIN + 17) shock(plr, t - T_FIN)
    if (t > T_FIN) aura(plr, S, t)
  }

  return {
    start: function (plr) {
      var S = buildScene(plr)
      playFrames(plr, T_END, function (p, t) { frame(p, t, S) }, 'cosmos')
    }
  }
})()

EFFECTS.phoenix = (function () {
  var C_WHITE = [1.0, 0.98, 0.90]
  var C_YELLOW = [1.0, 0.95, 0.45]
  var C_GOLD = [1.0, 0.80, 0.22]
  var C_AMBER = [1.0, 0.62, 0.12]
  var C_ORANGE = [1.0, 0.45, 0.06]
  var C_RED = [0.90, 0.12, 0.05]
  var C_CRIMSON = [0.62, 0.05, 0.08]
  var C_EMBER = [0.38, 0.04, 0.02]
  var C_ASH = [0.28, 0.25, 0.25]
  var C_HEART = [1.0, 0.25, 0.30]
  var C_SKY = [0.95, 0.42, 0.10]

  var RAMP = [
    [C_WHITE, C_YELLOW], [C_YELLOW, C_GOLD], [C_GOLD, C_AMBER], [C_AMBER, C_ORANGE],
    [C_ORANGE, C_RED], [C_RED, C_CRIMSON], [C_CRIMSON, C_EMBER]
  ]

  var R_ORBIT = 11
  var LAG = 1.25

  var T_DIVE = 84
  var T_BURN = 108
  var T_ASH = 148
  var T_EGG = 152
  var T_CRACK = 184
  var T_HATCH = 206
  var T_FLY = 212
  var T_FIN = 228
  var T_END = 305
  var BEATS = [172, 181, 189, 196, 202, 209, 215, 220, 224, 227]

  function smooth(u) {
    return u * u * (3 - 2 * u)
  }

  function rp(v) {
    var i = Math.floor(clamp01(v) * RAMP.length)
    return RAMP[Math.min(RAMP.length - 1, i)]
  }

  function norm(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) + 0.0001
    return [v[0] / l, v[1] / l, v[2] / l]
  }

  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  }

  function sideOf(d) {
    var l = Math.sqrt(d[0] * d[0] + d[2] * d[2]) + 0.0001
    return [-d[2] / l, 0, d[0] / l]
  }

  function q(F, x, y, z) {
    return [
      F.p[0] + F.d[0] * x + F.sd[0] * y + F.up[0] * z,
      F.p[1] + F.d[1] * x + F.sd[1] * y + F.up[1] * z,
      F.p[2] + F.d[2] * x + F.sd[2] * y + F.up[2] * z
    ]
  }

  function vq(F, x, y, z) {
    return norm([
      F.d[0] * x + F.sd[0] * y + F.up[0] * z,
      F.d[1] * x + F.sd[1] * y + F.up[1] * z,
      F.d[2] * x + F.sd[2] * y + F.up[2] * z
    ])
  }

  function sphereShell(plr, c, R, n, colA, colB, scale) {
    for (var i = 0; i < n; i++) {
      var y = 1 - 2 * (i + 0.5) / n
      var rr = Math.sqrt(Math.max(0, 1 - y * y))
      var th = i * 2.399963
      dustFade(plr, colA, colB, scale, c[0] + Math.cos(th) * rr * R, c[1] + y * R, c[2] + Math.sin(th) * rr * R, 0, 0, 0, 1)
    }
  }

  function heartAt(plr, S, c, size, n, colA, colB, scale) {
    for (var i = 0; i < n; i++) {
      var th = Math.PI + i * TAU / n
      var hx = Math.pow(Math.sin(th), 3)
      var hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16
      dustFade(plr, colA, colB, scale, c[0] + S.tx * hx * size, c[1] + hy * size, c[2] + S.tz * hx * size, 0, 0, 0, 1)
    }
  }

  function flameRing(plr, cx, cy, cz, R) {
    var n = nPoints(TAU * R, 0.8)
    for (var i = 0; i < n; i++) {
      var a = i * TAU / n
      particle(plr, 'minecraft:flame', cx + Math.cos(a) * R, cy, cz + Math.sin(a) * R, 0, 1, 0, 0.03, 0)
    }
  }

  function ringR(plr, col, scale, cx, cy, cz, R, reveal, sp) {
    var n = nPoints(TAU * R, sp)
    for (var i = 0; i < n; i++) {
      var frac = i / n
      if (frac > reveal) break
      var a = frac * TAU
      dust(plr, col, scale, cx + Math.cos(a) * R, cy, cz + Math.sin(a) * R, 0, 0, 0, 1)
    }
  }

  function line(plr, col, scale, x1, y, z1, x2, z2, reveal, sp) {
    var len = Math.sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1))
    var n = nPoints(len, sp)
    for (var i = 0; i <= n; i++) {
      var frac = i / n
      if (frac > reveal) break
      dust(plr, col, scale, x1 + (x2 - x1) * frac, y, z1 + (z2 - z1) * frac, 0, 0, 0, 1)
    }
  }

  function buildScene(plr) {
    var fc = facing(plr)
    return {
      ox: plr.x, oy: plr.y, oz: plr.z,
      fx: fc.fx, fz: fc.fz, tx: fc.tx, tz: fc.tz,
      ex: plr.x + fc.fx * 2.3, ez: plr.z + fc.fz * 2.3,
      chest: [plr.x, plr.y + 1.3, plr.z]
    }
  }

  function pulseAt(t) {
    var p = 1
    for (var b = 0; b < BEATS.length; b++) {
      if (t >= BEATS[b] && t < BEATS[b] + 4) p = 1 + 0.16 * (1 - (t - BEATS[b]) / 4)
    }
    return p
  }

  function circ(S, tt) {
    var g = smooth(clamp01(tt / T_DIVE))
    var ang = 0.6 + tt * 0.07
    var r = R_ORBIT * (1 - 0.15 * g) + Math.max(0, 26 - tt) * 0.9
    var y = S.oy + 14.5 - 3.5 * g + Math.sin(tt * 0.1) * 1.0
    return [S.ox + Math.cos(ang) * r, y, S.oz + Math.sin(ang) * r]
  }

  function pathAt(S, tt) {
    if (tt <= T_DIVE) return circ(S, tt)
    if (tt <= T_BURN) {
      var u = (tt - T_DIVE) / (T_BURN - T_DIVE)
      return lerp3(circ(S, tt), S.chest, u * u)
    }
    return S.chest
  }

  function dirAt(S, tt) {
    var a = pathAt(S, tt + 0.6)
    var b = pathAt(S, tt - 0.6)
    return norm([a[0] - b[0], a[1] - b[1], a[2] - b[2]])
  }

  function bodyFrame(S, t, k) {
    var tt = t - k * LAG
    var P = pathAt(S, tt)
    var d = dirAt(S, tt)
    var sd0 = sideOf(d)
    var up0 = norm(cross(sd0, d))
    var bank = -0.38 * (1 - clamp01((tt - (T_DIVE - 12)) / 12))
    var cb = Math.cos(bank), sb = Math.sin(bank)
    var sd = [sd0[0] * cb + up0[0] * sb, sd0[1] * cb + up0[1] * sb, sd0[2] * cb + up0[2] * sb]
    var up = [up0[0] * cb - sd0[0] * sb, up0[1] * cb - sd0[1] * sb, up0[2] * cb - sd0[2] * sb]
    var amp = (k <= 7) ? 0.1 * k / 7 : 0.1 + 0.075 * (k - 7)
    var w1 = Math.sin(k * 0.5 - t * 0.17) * amp
    var w2 = Math.sin(k * 0.4 - t * 0.12 + 1.3) * amp * 0.5
    return {
      p: [P[0] + sd0[0] * w1 + up0[0] * w2, P[1] + sd0[1] * w1 + up0[1] * w2, P[2] + sd0[2] * w1 + up0[2] * w2],
      d: d, sd: sd, up: up, tt: tt
    }
  }

  function wing(plr, F, s, fl, bend, sc, fold, t) {
    var NF = 8
    var Lw = 3.7 * sc * (1 - 0.4 * fold)
    var sweep = (0.8 + 1.8 * fold) * sc
    var cf = Math.cos(fl), sf = Math.sin(fl)
    for (var i = 0; i < NF; i++) {
      var u = 0.12 + 0.88 * i / (NF - 1)
      var lx = -sweep * u * u
      var ly = s * cf * Lw * u
      var lz = 0.35 * sc + sf * Lw * u + 0.5 * sc * Math.sin(u * Math.PI) * (1 - fold) - bend * u * u * sc
      var A = q(F, lx, ly, lz)
      dust(plr, C_YELLOW, 1.5, A[0], A[1], A[2], 0.02, 0.02, 0.02, 1)

      var spread = 0.15 + 0.6 * u
      var dir = vq(F, -(1.05 - 0.45 * u), s * spread * cf, spread * sf - 0.1 - bend * 0.08 * u)
      var L = sc * (1.5 + 3.8 * Math.pow(u, 1.4)) * (1 - 0.25 * fold)

      var m = cnt(5)
      for (var j = 1; j <= m; j++) {
        var w = j / m
        var c = rp(0.2 + w * 0.6 + (i % 2) * 0.1 + u * 0.1)
        dustFade(plr, c[0], c[1], 1.5 - 0.5 * w, A[0] + dir[0] * L * w, A[1] + dir[1] * L * w, A[2] + dir[2] * L * w, 0.02, 0.02, 0.02, 1)
      }
      for (var j2 = 1; j2 <= 2; j2++) {
        var w2 = j2 / 2 * 0.5
        dustFade(plr, C_WHITE, C_YELLOW, 1.1,
          A[0] + dir[0] * L * w2 + F.up[0] * 0.12, A[1] + dir[1] * L * w2 + F.up[1] * 0.12, A[2] + dir[2] * L * w2 + F.up[2] * 0.12, 0, 0, 0, 1)
      }
      if ((t + i) % 6 === 0) {
        particle(plr, 'minecraft:small_flame', A[0] + dir[0] * L, A[1] + dir[1] * L, A[2] + dir[2] * L, 0.05, 0.05, 0.05, 0.01, 1)
      }
    }
  }

  function drawBird(plr, S, t) {
    var F = bodyFrame(S, t, 0)
    var fold = (t >= T_DIVE - 4) ? clamp01((t - (T_DIVE - 4)) / 6) : 0

    var h = q(F, 0, 0, 0.1)
    dust(plr, C_GOLD, 2.2, h[0], h[1], h[2], 0.1, 0.1, 0.1, cnt(3))
    dust(plr, C_WHITE, 1.2, h[0], h[1], h[2], 0.05, 0.05, 0.05, 1)

    var b1 = q(F, 0.42, 0, -0.02)
    var b2 = q(F, 0.78, 0, -0.1)
    var b3 = q(F, 0.92, 0, -0.3)
    dust(plr, C_AMBER, 1.4, b1[0], b1[1], b1[2], 0, 0, 0, 1)
    dust(plr, C_ORANGE, 1.3, b2[0], b2[1], b2[2], 0, 0, 0, 1)
    dust(plr, C_RED, 1.1, b3[0], b3[1], b3[2], 0, 0, 0, 1)

    for (var e = -1; e <= 1; e += 2) {
      var ey = q(F, 0.25, 0.22 * e, 0.2)
      dust(plr, C_WHITE, 1.2, ey[0], ey[1], ey[2], 0, 0, 0, 1)
    }

    for (var cr = 1; cr <= 6; cr++) {
      var sway = Math.sin(t * 0.3 + cr * 0.7) * 0.08 * cr
      var zc = 0.3 + 0.2 * cr - 0.04 * cr * cr
      var cc = rp(0.12 + cr * 0.1)
      var cp = q(F, -0.3 * cr, sway, zc)
      dustFade(plr, cc[0], cc[1], 1.6 - 0.15 * cr, cp[0], cp[1], cp[2], 0, 0, 0, 1)
      if (cr >= 3) {
        for (var sg = -1; sg <= 1; sg += 2) {
          var sp2 = q(F, -0.26 * cr, sway + sg * 0.16 * cr, zc - 0.15)
          dustFade(plr, cc[0], cc[1], 1.3 - 0.1 * cr, sp2[0], sp2[1], sp2[2], 0, 0, 0, 1)
        }
      }
    }

    var BR = [0.28, 0.36, 0.52, 0.68, 0.72, 0.62, 0.42]
    for (var k = 1; k <= 7; k++) {
      var F2 = bodyFrame(S, t, k)
      if (F2.tt < 0) break
      var r = BR[k - 1]
      for (var i = 0; i < 5; i++) {
        var ang = i * TAU / 5 + k
        var sn = Math.sin(ang)
        var pt = q(F2, 0, Math.cos(ang) * r, sn * r * 0.8)
        var bc = (sn < -0.3) ? rp(0.05) : rp(0.15 + k * 0.06)
        dustFade(plr, bc[0], bc[1], 1.5, pt[0], pt[1], pt[2], 0, 0, 0, 1)
      }
      if (k === 5) {
        for (var sg2 = -1; sg2 <= 1; sg2 += 2) {
          var reach = fold * 0.9
          for (var lg = 1; lg <= 3; lg++) {
            var lp = q(F2, 0.2 + reach * lg / 3, sg2 * 0.22, -0.4 - 0.25 * lg)
            dust(plr, C_AMBER, 1.3, lp[0], lp[1], lp[2], 0, 0, 0, 1)
          }
          var cl = q(F2, 0.5 + reach, sg2 * 0.22, -1.25)
          dust(plr, C_ORANGE, 1.6, cl[0], cl[1], cl[2], 0.08, 0.04, 0.08, 2)
        }
      }
    }

    if (t - 3 * LAG >= 0) {
      var F3 = bodyFrame(S, t, 3)
      var ph = t * 0.22
      var fl = (0.1 + Math.sin(ph) * 0.8) * (1 - fold) + 0.1 * fold
      var bend = Math.cos(ph) * 1.1 * (1 - fold)
      wing(plr, F3, -1, fl, bend, 1.15, fold, t)
      wing(plr, F3, 1, fl, bend, 1.15, fold, t)

      var nH = cnt(24)
      for (var hi = 0; hi < nH; hi++) {
        if ((hi + (t >> 1)) % 3 === 0) continue
        var ha = hi * TAU / nH
        var hc = Math.cos(ha) * 1.8, hs = Math.sin(ha) * 1.8
        dustFade(plr, C_YELLOW, C_GOLD, 1.0,
          F3.p[0] + F3.sd[0] * hc + F3.up[0] * hs,
          F3.p[1] + F3.sd[1] * hc + F3.up[1] * hs,
          F3.p[2] + F3.sd[2] * hc + F3.up[2] * hs, 0, 0, 0, 1)
      }
    }

    var TFS = []
    for (var tk = 8; tk <= 22; tk++) TFS[tk] = bodyFrame(S, t, tk)
    var OFFS = [-2, -1, 0, 1, 2]
    var LENS = [13, 16, 22, 16, 13]
    for (var rb = 0; rb < 5; rb++) {
      for (var tj = 8; tj <= LENS[rb]; tj++) {
        var TF = TFS[tj]
        if (TF.tt < 0) break
        var v = (tj - 7) / (LENS[rb] - 7)
        var off = OFFS[rb] * (0.12 + 0.07 * (tj - 7))
        var tp = q(TF, 0, off, 0.05 * Math.sin(tj * 0.8 + t * 0.2))
        var tc = rp(0.1 + v * 0.8)
        dustFade(plr, tc[0], tc[1], 1.7 - 0.9 * v, tp[0], tp[1], tp[2], 0, 0, 0, 1)
        if (tj === LENS[rb] && (t + rb) % 3 === 0) {
          particle(plr, 'minecraft:small_flame', tp[0], tp[1], tp[2], 0.05, 0.05, 0.05, 0.01, 1)
        }
      }
    }

    if (t % 4 === 0 && TFS[22].tt >= 0) {
      particle(plr, 'minecraft:flame', TFS[22].p[0], TFS[22].p[1], TFS[22].p[2], 0.2, 0.2, 0.2, 0.02, 2)
    }
    if (t % 6 === 0) particle(plr, 'minecraft:lava', h[0], h[1], h[2], 0.3, 0.3, 0.3, 0, 1)
  }

  function ritualStart(plr) {
    effect(plr, 'resistance', 18, 4)
    effect(plr, 'fire_resistance', 18, 0)
    sound(plr, 'minecraft:block.fire.ambient', 1.2, 0.6)
    sound(plr, 'minecraft:item.firecharge.use', 1.0, 0.6)
    sound(plr, 'minecraft:entity.blaze.ambient', 0.8, 0.5)
    plr.tell(Text.gold('[NxEterna] ').append(Text.gray('The sky catches fire...')))
  }

  function glow(plr, S, t) {
    var inten = clamp01(t / 30)
    var n = cnt(Math.max(2, Math.round(6 * inten)))
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU
      var d = Math.sqrt(Math.random()) * 14
      dust(plr, C_SKY, 4.0, S.ox + Math.cos(a) * d, S.oy + 14 + rnd(1), S.oz + Math.sin(a) * d, 1.3, 0.3, 1.3, 1)
    }
  }

  function mandala(plr, S, t) {
    var rev = clamp01(t / 40)
    var rot = t * 0.018
    var y = S.oy + 0.08
    ringR(plr, C_ORANGE, 1.2, S.ox, y, S.oz, 6.4, rev, 0.5)
    ringR(plr, C_GOLD, 1.0, S.ox, y + 0.02, S.oz, 5.9, rev, 0.6)
    ringR(plr, C_RED, 1.0, S.ox, y + 0.03, S.oz, 2.2, rev, 0.5)
    for (var k = 0; k < 8; k++) {
      var a1 = rot + k * TAU / 8
      var a2 = rot + (k + 3) * TAU / 8
      line(plr, (k % 2 === 0) ? C_GOLD : C_YELLOW, 1.1,
        S.ox + Math.cos(a1) * 4.6, y + 0.04, S.oz + Math.sin(a1) * 4.6,
        S.ox + Math.cos(a2) * 4.6, S.oz + Math.sin(a2) * 4.6, rev, 0.7)
      dust(plr, C_WHITE, 1.5, S.ox + Math.cos(a1) * 4.6, y + 0.1, S.oz + Math.sin(a1) * 4.6, 0.05, 0.05, 0.05, 2)
    }
    dust(plr, C_YELLOW, 1.8, S.ox, y + 0.1, S.oz, 0.5, 0, 0.5, cnt(3))
  }

  function pillarTop(S, k) {
    var a = k * TAU / 8
    return [S.ox + Math.cos(a) * 6.4, S.oy + 5.1, S.oz + Math.sin(a) * 6.4]
  }

  function pillars(plr, S, t) {
    var grow = smooth(clamp01((t - 6) / 38))
    var h = 5.0 * grow
    if (h < 0.3) return
    for (var k = 0; k < 8; k++) {
      var a = k * TAU / 8
      var px = S.ox + Math.cos(a) * 6.4
      var pz = S.oz + Math.sin(a) * 6.4
      var n = Math.max(2, Math.round(h / 0.55 * DENSITY))
      for (var i = 0; i <= n; i++) {
        var fr = i / n
        var w = 0.3 * (1 - 0.6 * fr)
        var an = fr * h * 2.2 + t * 0.3 + k
        dustFade(plr, C_YELLOW, C_RED, 1.4 - 0.5 * fr, px + Math.cos(an) * w, S.oy + 0.1 + h * fr, pz + Math.sin(an) * w, 0.02, 0, 0.02, 1)
      }
      particle(plr, 'minecraft:flame', px, S.oy + 0.1 + h, pz, 0.1, 0.12, 0.1, 0.02, 1)
    }
  }

  function corona(plr, S, t) {
    var fade = (t < T_DIVE) ? 1 : clamp01(1 - (t - T_DIVE) / 16)
    var rev = clamp01((t - 4) / 30) * fade
    if (rev <= 0.02) return
    var cy = S.oy + 16.5
    var rot = -t * 0.02
    ringR(plr, C_ORANGE, 1.5, S.ox, cy, S.oz, 7.5, rev, 0.7)
    ringR(plr, C_GOLD, 1.2, S.ox, cy + 0.05, S.oz, 5.0, rev, 0.7)
    ringR(plr, C_YELLOW, 1.0, S.ox, cy + 0.08, S.oz, 2.4, rev, 0.6)
    var rays = 16
    for (var k = 0; k < rays; k++) {
      if (k / rays > rev) break
      var a = rot + k * TAU / rays
      var r0 = 7.5
      var r1 = (k % 2 === 0) ? 10.5 : 9.0
      for (var j = 0; j <= 3; j++) {
        var r = r0 + (r1 - r0) * j / 3
        dustFade(plr, C_YELLOW, C_ORANGE, 1.3 - j * 0.2, S.ox + Math.cos(a) * r, cy, S.oz + Math.sin(a) * r, 0.02, 0, 0.02, 1)
      }
    }
    dust(plr, C_WHITE, 2.2, S.ox, cy, S.oz, 0.4, 0.1, 0.4, cnt(3))
  }

  function embers(plr, S) {
    for (var i = 0; i < cnt(3); i++) {
      var a = Math.random() * TAU
      var d = Math.random() * 6
      var x = S.ox + Math.cos(a) * d
      var z = S.oz + Math.sin(a) * d
      particle(plr, 'minecraft:small_flame', x, S.oy + 0.1, z, 0, 1, 0, 0.02, 0)
      if (i === 0) particle(plr, 'minecraft:lava', x, S.oy + 0.3, z, 0.1, 0.1, 0.1, 0, 1)
    }
  }

  function streamPos(S, k, u) {
    var r = 6.4 * Math.pow(1 - u, 1.3) + 0.25
    var ang = k * TAU / 8 + u * 2.2
    var y = S.oy + 5.1 + (1.3 - 5.1) * smooth(u) + Math.sin(u * Math.PI) * 1.0
    return [S.ox + Math.cos(ang) * r, y, S.oz + Math.sin(ang) * r]
  }

  function streams(plr, S, t) {
    for (var k = 0; k < 8; k++) {
      var ph = t - (T_DIVE - 26 + k * 3)
      if (ph < 0 || ph > 28) continue
      var u = ph / 28
      var hd = streamPos(S, k, u)
      dust(plr, C_WHITE, 1.5, hd[0], hd[1], hd[2], 0.02, 0.02, 0.02, 1)
      particle(plr, 'minecraft:flame', hd[0], hd[1], hd[2], 0, 0, 0, 0, 1)
      for (var j = 1; j <= 4; j++) {
        var uu = u - j * 0.04
        if (uu < 0) break
        var p = streamPos(S, k, uu)
        dustFade(plr, C_YELLOW, C_RED, 1.3 - j * 0.2, p[0], p[1], p[2], 0, 0, 0, 1)
      }
      if (ph >= 27) {
        particle(plr, 'minecraft:flame', S.chest[0], S.chest[1], S.chest[2], 0.3, 0.3, 0.3, 0.05, cnt(6))
        sound(plr, 'minecraft:entity.blaze.shoot', 0.6, 0.6 + k * 0.08)
      }
    }
  }

  function burn(plr, S) {
    sound(plr, 'minecraft:entity.generic.explode', 1.4, 0.6)
    sound(plr, 'minecraft:entity.blaze.shoot', 1.5, 0.5)
    sound(plr, 'minecraft:entity.ghast.warn', 1.0, 0.7)
    sound(plr, 'minecraft:item.firecharge.use', 1.5, 0.5)
    particle(plr, 'minecraft:flash', S.ox, S.oy + 1.3, S.oz, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:explosion', S.ox, S.oy + 1.3, S.oz, 0.3, 0.3, 0.3, 0, cnt(3))
    particle(plr, 'minecraft:lava', S.ox, S.oy + 1.3, S.oz, 0.8, 0.5, 0.8, 0.1, cnt(20))
    for (var i = 0; i < cnt(50); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.8
      particle(plr, 'minecraft:flame', S.ox, S.oy + 1.3, S.oz, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.35, 0)
    }
    ringR(plr, C_ORANGE, 1.4, S.ox, S.oy + 0.15, S.oz, 2.0, 1, 0.4)
    ringR(plr, C_RED, 1.4, S.ox, S.oy + 0.2, S.oz, 3.4, 1, 0.5)
    for (var h = 0; h <= 10; h += 0.6) {
      dustFade(plr, C_YELLOW, C_RED, 1.6, S.ox, S.oy + h, S.oz, 0.2, 0, 0.2, 1)
    }
    for (var k = 0; k < 8; k++) {
      var T = pillarTop(S, k)
      particle(plr, 'minecraft:flame', T[0], T[1] - 2, T[2], 0.2, 1.8, 0.2, 0.08, cnt(10))
      particle(plr, 'minecraft:lava', T[0], T[1] - 1, T[2], 0.3, 1.0, 0.3, 0, 2)
    }
    plr.tell(Text.gold('[NxEterna] ').append(Text.red('The phoenix consumes you.')))
  }

  function inferno(plr, S, t) {
    var s = t - T_BURN
    var k = s / (T_ASH - T_BURN)

    for (var st = 0; st < 3; st++) {
      for (var h = 0; h <= 4; h += 0.25) {
        var ang = h * 2.4 + st * TAU / 3 + s * 0.4
        var r = 1.3 * (1 - 0.5 * k) + h * 0.05
        dustFade(plr, C_YELLOW, C_RED, 1.4, plr.x + Math.cos(ang) * r, plr.y + h, plr.z + Math.sin(ang) * r, 0, 0, 0, 1)
      }
    }
    particle(plr, 'minecraft:flame', plr.x, plr.y + 0.2, plr.z, 0.5, 1.2, 0.5, 0.03, cnt(8))
    if (s % 4 === 0) particle(plr, 'minecraft:lava', plr.x + rnd(0.8), plr.y + 1.0 + Math.random() * 2, plr.z + rnd(0.8), 0, 0, 0, 0, 1)
    sphereShell(plr, [plr.x, plr.y + 1, plr.z], 3.2 * (1 - k) + 0.4, cnt(40), C_ORANGE, C_EMBER, 1.3)

    if (s % 12 === 0) sound(plr, 'minecraft:block.fire.ambient', 1.2, 0.7)
    if (s % 16 === 4) sound(plr, 'minecraft:entity.blaze.burn', 1.0, 0.6)
  }

  function ashStart(plr, S) {
    sound(plr, 'minecraft:block.fire.extinguish', 1.5, 0.6)
    sound(plr, 'minecraft:block.beacon.deactivate', 1.0, 0.8)
    particle(plr, 'minecraft:large_smoke', S.ox, S.oy + 1, S.oz, 0.6, 0.6, 0.6, 0.05, cnt(25))
    particle(plr, 'minecraft:poof', S.ox, S.oy + 0.5, S.oz, 0.5, 0.3, 0.5, 0.1, cnt(15))
    plr.tell(Text.gold('[NxEterna] ').append(Text.gray('Only ash remains...')))
  }

  function ashPhase(plr, S, t) {
    particle(plr, 'minecraft:ash', plr.x + rnd(2.5), plr.y + 3 + rnd(1), plr.z + rnd(2.5), 0, -0.2, 0, 0.02, cnt(4))
    particle(plr, 'minecraft:white_ash', plr.x + rnd(2.5), plr.y + 3 + rnd(1), plr.z + rnd(2.5), 0, -0.2, 0, 0.02, cnt(3))

    for (var i = 0; i < 5; i++) {
      var ph = (t - T_ASH + i * 6) % 30
      if (ph < 0) continue
      var u = ph / 30
      for (var k = 0; k <= 3; k++) {
        var uu = u - k * 0.04
        if (uu < 0) break
        var a = i * TAU / 5 + uu * 3
        var r = 5 * (1 - uu) * (1 - uu)
        var x = S.ex + Math.cos(a) * r
        var y = S.oy + 0.2 + uu * 1.0
        var z = S.ez + Math.sin(a) * r
        if (k === 0) dust(plr, C_ORANGE, 1.4, x, y, z, 0.02, 0.02, 0.02, 1)
        else dustFade(plr, C_GOLD, C_RED, 1.2 - k * 0.2, x, y, z, 0, 0, 0, 1)
      }
    }
    if ((t - T_ASH) % 20 === 0) sound(plr, 'minecraft:block.sand.fall', 0.8, 0.6)
  }

  function mound(plr, S, t) {
    var g = clamp01((t - T_ASH) / 14)
    for (var l = 0; l < 4; l++) {
      ring(plr, C_ASH, 1.8, S.ex, S.oy + 0.12 + 0.17 * l, S.ez, (1.15 - 0.3 * l) * g + 0.05, 0.4)
    }
    for (var i = 0; i < cnt(2); i++) {
      dustFade(plr, C_ORANGE, C_EMBER, 1.2, S.ex + rnd(0.9), S.oy + 0.25 + Math.random() * 0.4, S.ez + rnd(0.9), 0.02, 0.02, 0.02, 1)
    }
  }

  function egg(plr, S, t) {
    var g = smooth(clamp01((t - T_EGG) / 26))
    if (g < 0.04) return
    var pu = pulseAt(t)
    var H = 0.95 * g * pu
    var Rm = 0.6 * g * pu
    var cy = S.oy + 0.3 + 0.95 * g
    var heat = clamp01((t - T_EGG) / (T_HATCH - T_EGG))

    for (var l = -3; l <= 3; l++) {
      var v = l / 3
      var rr = Rm * Math.sqrt(Math.max(0, 1 - v * v)) * (1 - 0.16 * v) + 0.02
      var y = cy + v * H
      var n = (Math.abs(l) === 3) ? 1 : cnt(Math.max(6, Math.round(TAU * rr / 0.28)))
      var col = rp(0.75 - 0.7 * heat - 0.1 * v)
      for (var i = 0; i < n; i++) {
        var a = i * TAU / n + t * 0.04
        dustFade(plr, col[0], col[1], 1.3, S.ex + Math.cos(a) * rr, y, S.ez + Math.sin(a) * rr, 0, 0, 0, 1)
      }
    }

    dust(plr, C_WHITE, 1.6, S.ex, cy, S.ez, 0.12, 0.12, 0.12, 2)
    particle(plr, 'minecraft:small_flame', S.ex + rnd(0.3), cy + rnd(0.3), S.ez + rnd(0.3), 0.05, 0.05, 0.05, 0.01, 1)
    heartAt(plr, S, [S.ex, cy, S.ez], 0.3 * g * pu, cnt(14), C_HEART, C_WHITE, 1.0)

    if (t >= T_CRACK) {
      var cr = clamp01((t - T_CRACK) / (T_HATCH - T_CRACK))

      for (var c = 0; c < 5; c++) {
        var ca = c * TAU / 5 + 0.4
        var m = Math.floor(8 * cr) + 1
        for (var j = 0; j <= m; j++) {
          var vv = 0.95 - j * 0.28
          if (vv < -0.8) break
          var r2 = Rm * Math.sqrt(Math.max(0, 1 - vv * vv)) * (1 - 0.16 * vv) + 0.03
          var aa = ca + Math.sin(j * 2.1 + c) * 0.35
          dust(plr, C_WHITE, 1.3, S.ex + Math.cos(aa) * r2, cy + vv * H, S.ez + Math.sin(aa) * r2, 0, 0, 0, 1)
        }
      }

      var rays = Math.floor(6 * cr) + 1
      for (var rr2 = 0; rr2 < rays; rr2++) {
        var ar = rr2 * 2.399963 + 0.5
        var el = 0.3 + 0.5 * ((rr2 * 7) % 5) / 4
        var dx = Math.cos(ar) * Math.cos(el)
        var dy = Math.sin(el)
        var dz = Math.sin(ar) * Math.cos(el)
        var Lr = 2.0 + cr * 3.0
        for (var d = 0.6; d <= Lr; d += 0.5) {
          dustFade(plr, C_WHITE, C_GOLD, 1.3 - 0.15 * d, S.ex + dx * d, cy + dy * d, S.ez + dz * d, 0.02, 0.02, 0.02, 1)
        }
      }
      if (t % 4 === 0) particle(plr, 'minecraft:end_rod', S.ex + rnd(0.5), cy + rnd(0.5), S.ez + rnd(0.5), 0.2, 0.2, 0.2, 0.05, cnt(2))
    }
  }

  function hatch(plr, S) {
    var cy = S.oy + 1.25
    sound(plr, 'minecraft:block.turtle_egg.break', 1.6, 0.6)
    sound(plr, 'minecraft:entity.generic.explode', 1.2, 0.7)
    sound(plr, 'minecraft:entity.blaze.shoot', 1.5, 0.6)
    sound(plr, 'minecraft:entity.ender_dragon.flap', 1.6, 0.7)
    sound(plr, 'minecraft:block.beacon.power_select', 1.5, 0.9)

    particle(plr, 'minecraft:flash', S.ex, cy, S.ez, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:explosion', S.ex, cy, S.ez, 0.3, 0.3, 0.3, 0, cnt(2))
    for (var i = 0; i < cnt(40); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.8
      var type = (i % 3 === 0) ? 'minecraft:lava' : 'minecraft:flame'
      particle(plr, type, S.ex, cy, S.ez, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.3, 0)
    }
    dust(plr, C_ASH, 2.0, S.ex, cy, S.ez, 0.6, 0.5, 0.6, cnt(14))
    dust(plr, C_GOLD, 2.0, S.ex, cy, S.ez, 0.6, 0.5, 0.6, cnt(14))
    ringR(plr, C_ORANGE, 1.4, S.ex, S.oy + 0.15, S.ez, 1.6, 1, 0.4)
    for (var h = 0; h <= 12; h += 0.6) {
      dustFade(plr, C_WHITE, C_GOLD, 1.5, S.ex, S.oy + h, S.ez, 0.12, 0, 0.12, 1)
    }
    plr.tell(Text.gold('[NxEterna] ').append(Text.yellow('The egg cracks open!')))
  }

  function heartCenter(S, plr, t) {
    var cy0 = S.oy + 1.25
    if (t < T_FLY) {
      var e = smooth(clamp01((t - T_HATCH) / 6))
      return [S.ex, cy0 + 0.6 * e + Math.sin(t * 0.15) * 0.05, S.ez]
    }
    var v = clamp01((t - T_FLY) / (T_FIN - T_FLY))
    var start = [S.ex, cy0 + 0.6, S.ez]
    var p = lerp3(start, [plr.x, plr.y + 1.3, plr.z], smooth(v))
    var side = Math.sin(v * TAU) * 0.8 * (1 - v)
    return [p[0] + S.tx * side, p[1] + Math.sin(v * Math.PI) * 0.8, p[2] + S.tz * side]
  }

  function heartSize(t) {
    var s = 1.1 * smooth(clamp01((t - T_HATCH) / 10))
    if (t >= T_FLY) s *= 1 - 0.6 * smooth(clamp01((t - T_FLY) / (T_FIN - T_FLY)))
    return s * pulseAt(t)
  }

  function rebirthHeart(plr, S, t) {
    var size = heartSize(t)
    if (size < 0.05) return
    var c = heartCenter(S, plr, t)
    heartAt(plr, S, c, size, cnt(40), C_HEART, C_GOLD, 1.2)
    heartAt(plr, S, c, size * 0.65, cnt(22), C_ORANGE, C_YELLOW, 1.2)
    heartAt(plr, S, c, size * 0.3, cnt(9), C_WHITE, C_GOLD, 1.2)
    particle(plr, 'minecraft:small_flame', c[0] + rnd(size), c[1] + rnd(size), c[2] + rnd(size), 0.05, 0.05, 0.05, 0.01, cnt(2))
    if (t >= T_FLY) {
      dustFade(plr, C_WHITE, C_HEART, 1.4, c[0], c[1], c[2], 0.2, 0.2, 0.2, cnt(3))
    }
    if (t % 4 === 0) particle(plr, 'minecraft:lava', c[0] + rnd(size * 0.6), c[1] + rnd(size * 0.6), c[2] + rnd(size * 0.6), 0, 0, 0, 0, 1)
  }

  function rebirthWings(plr, S, t) {
    var grow = smooth(clamp01((t - T_HATCH) / 18))
    var fade = (t > T_FIN) ? clamp01(1 - (t - T_FIN) / (T_END - T_FIN - 30)) : 1
    var sc = 1.7 * grow * Math.pow(fade, 0.6)
    if (sc < 0.15) return
    var F = {
      p: [plr.x - S.fx * 0.25, plr.y + 1.35, plr.z - S.fz * 0.25],
      d: [S.fx, 0, S.fz], sd: [S.tx, 0, S.tz], up: [0, 1, 0]
    }
    var ph = t * 0.13
    var fl = 0.7 + Math.sin(ph) * 0.35
    var bend = Math.cos(ph) * 0.9
    var fold = (1 - grow) * 0.8
    wing(plr, F, -1, fl, bend, sc, fold, t)
    wing(plr, F, 1, fl, bend, sc, fold, t)
  }

  function beat(plr, idx) {
    sound(plr, 'minecraft:entity.warden.heartbeat', 2.0, 0.7 + idx * 0.06)
    particle(plr, 'minecraft:flame', plr.x, plr.y + 1.2, plr.z, 0.3, 0.4, 0.3, 0.03, cnt(5))
    if (idx >= 3) effect(plr, 'glowing', 1, 0)
  }

  function finale(plr, S) {
    var x = plr.x, y = plr.y, z = plr.z
    sound(plr, 'minecraft:item.totem.use', 1.0, 0.9)
    sound(plr, 'minecraft:block.beacon.activate', 1.5, 1.0)
    sound(plr, 'minecraft:entity.ghast.scream', 1.0, 1.4)
    sound(plr, 'minecraft:entity.generic.explode', 1.0, 0.8)
    sound(plr, 'minecraft:entity.ender_dragon.flap', 1.5, 0.7)
    sound(plr, 'minecraft:block.bell.use', 1.2, 1.2)

    particle(plr, 'minecraft:flash', x, y + 1, z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:explosion_emitter', x, y + 1, z, 0, 0, 0, 0, 1)
    particle(plr, 'minecraft:totem_of_undying', x, y + 1, z, 0.3, 0.5, 0.3, 0.5, cnt(40))
    particle(plr, 'minecraft:heart', x, y + 1.6, z, 0.8, 0.6, 0.8, 0, cnt(12))

    for (var h = 0; h <= 18; h += 0.5) {
      dust(plr, C_WHITE, 1.8, x, y + h, z, 0.15, 0, 0.15, 1)
      dustFade(plr, C_YELLOW, C_RED, 1.4, x, y + h + 0.25, z, 0.25, 0, 0.25, 1)
    }
    for (var i = 0; i < cnt(55); i++) {
      var th = Math.random() * TAU
      var ph = Math.random() * Math.PI * 0.7
      var type = (i % 2 === 0) ? 'minecraft:flame' : 'minecraft:end_rod'
      particle(plr, type, x, y + 1, z, Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), 0.35, 0)
    }

    applyHearts(plr)
    plr.heal(2)
    effect(plr, 'glowing', 12, 0)

    var hearts = Math.floor(plr.maxHealth / 2)
    plr.tell(Text.gold('[NxEterna] ').append(Text.white('From the ashes, a new heart is born. ')).append(Text.gray('(' + hearts + ' hearts)')))
  }

  function shock(plr, s) {
    if (s % 2 !== 0) return
    var R = 0.8 + s * 0.9
    ringR(plr, C_ORANGE, 1.3, plr.x, plr.y + 0.15, plr.z, R, 1, 0.6)
    flameRing(plr, plr.x, plr.y + 0.1, plr.z, R)
    if (s >= 4) ringR(plr, C_GOLD, 1.1, plr.x, plr.y + 0.25, plr.z, R - 3.6, 1, 0.6)
    if (s <= 12) sphereShell(plr, [plr.x, plr.y + 1, plr.z], 0.6 + s * 0.7, cnt(50), C_YELLOW, C_RED, 1.2)
  }

  function aura(plr, S, t) {
    var s = t - T_FIN
    var k = 1 - s / (T_END - T_FIN)

    if (k > 0.1) {
      for (var st = 0; st < 3; st++) {
        var a = s * 0.22 + st * TAU / 3
        var y = plr.y + ((s * 0.06 + st * 0.8) % 2.4)
        dustFade(plr, C_GOLD, C_RED, 0.9, plr.x + Math.cos(a) * 0.9, y, plr.z + Math.sin(a) * 0.9, 0, 0, 0, 1)
        particle(plr, 'minecraft:small_flame', plr.x + Math.cos(a + 0.3) * 0.9, y, plr.z + Math.sin(a + 0.3) * 0.9, 0, 1, 0, 0.01, 0)
      }
    }
    if (k > 0.3 && s % 4 === 0) {
      heartAt(plr, S, [plr.x, plr.y + 2.8, plr.z], 0.35, cnt(22), C_HEART, C_GOLD, 0.8)
    }
    if (k > 0.2 && s % 3 === 0) {
      particle(plr, 'minecraft:falling_lava', plr.x + rnd(2.2), plr.y + 2.6 + Math.random() * 1.5, plr.z + rnd(2.2), 0, 0, 0, 0, 1)
    }
    if (k > 0.3 && s % 5 === 0) {
      particle(plr, 'minecraft:lava', plr.x + rnd(1.0), plr.y + 0.5 + Math.random() * 2, plr.z + rnd(1.0), 0, 0, 0, 0, 1)
    }
    if (s === 30 || s === 70) sound(plr, 'minecraft:block.fire.ambient', 1.0, 0.8)
    if (s === 50) sound(plr, 'minecraft:block.amethyst_block.resonate', 1.0, 0.6)
    if (t === T_END) sound(plr, 'minecraft:entity.player.levelup', 0.8, 0.6)
  }

  function frame(plr, t, S) {
    if (t === 0) ritualStart(plr)
    if (t < T_FIN + 40) pin(plr, S.ox, S.oz)

    if (t < T_BURN && t % 4 === 0) {
      glow(plr, S, t)
      mandala(plr, S, t)
    }
    if (t >= 6 && t < T_BURN && t % 3 === 0) pillars(plr, S, t)
    if (t >= 4 && t <= T_DIVE + 16 && t % 4 === 0) corona(plr, S, t)
    if (t < T_BURN && t % 3 === 0) embers(plr, S)
    if (t >= T_DIVE - 26 && t <= T_BURN && t % 2 === 0) streams(plr, S, t)

    if (t >= 2 && t <= T_BURN && t % 2 === 0) drawBird(plr, S, t)
    if (t === 14 || t === 50) {
      sound(plr, 'minecraft:entity.parrot.imitate.blaze', 1.5, 0.6)
      sound(plr, 'minecraft:entity.ghast.warn', 1.0, 1.3)
    }
    if (t >= 6 && t < T_DIVE && t % 9 === 0) sound(plr, 'minecraft:entity.ender_dragon.flap', 1.0, 1.1 + t * 0.002)
    if (t === T_DIVE) {
      sound(plr, 'minecraft:entity.ghast.scream', 1.2, 1.0)
      sound(plr, 'minecraft:entity.ender_dragon.shoot', 1.0, 0.8)
    }
    if (t > T_DIVE && t < T_BURN && t % 6 === 0) sound(plr, 'minecraft:item.firecharge.use', 1.2, 0.6)

    if (t === T_BURN) burn(plr, S)
    if (t > T_BURN && t < T_ASH && t % 2 === 0) inferno(plr, S, t)
    if (t === T_ASH) ashStart(plr, S)
    if (t >= T_ASH && t < T_CRACK && t % 2 === 0) ashPhase(plr, S, t)
    if (t >= T_ASH && t < T_HATCH && t % 4 === 0) mound(plr, S, t)

    if (t === T_EGG) sound(plr, 'minecraft:block.amethyst_block.chime', 1.2, 0.7)
    if (t >= T_EGG && t < T_HATCH && t % 2 === 0) egg(plr, S, t)
    if (t >= T_CRACK && t < T_HATCH && (t - T_CRACK) % 5 === 0) {
      sound(plr, 'minecraft:block.turtle_egg.crack', 1.2, 0.6 + (t - T_CRACK) * 0.015)
    }
    if (t === T_HATCH) hatch(plr, S)

    if (t >= T_HATCH && t < T_FIN && t % 2 === 0) rebirthHeart(plr, S, t)
    if (t >= T_HATCH && t < T_END - 30 && t % 3 === 0) rebirthWings(plr, S, t)

    for (var b = 0; b < BEATS.length; b++) {
      if (t === BEATS[b]) beat(plr, b)
    }

    if (t === T_FIN) finale(plr, S)
    if (t >= T_FIN && t < T_FIN + 17) shock(plr, t - T_FIN)
    if (t > T_FIN) aura(plr, S, t)
  }

  return {
    start: function (plr) {
      var S = buildScene(plr)
      playFrames(plr, T_END, function (p, t) { frame(p, t, S) }, 'phoenix')
    }
  }
})()

function pickAuto(plr) {
  var order = AUTO_ORDER
  if (AUTO_STYLE === 'cycle') {
    return order[getHearts(plr) % order.length]
  }
  if (AUTO_STYLE === 'random') {
    return order[Math.floor(Math.random() * order.length)]
  }
  return EFFECTS[AUTO_STYLE] ? AUTO_STYLE : order[0]
}

function giveHeart(plr, style) {
  var name = style || pickAuto(plr)
  var fx = EFFECTS[name]
  if (!fx) throw 'unknown style: ' + name
  if (RITUALS[uuidOf(plr)]) throw plr.username + ' is already in a heart ritual, wait for it to finish'

  setHearts(plr, getHearts(plr) + 1)
  fx.start(plr)
}

function safeGive(ctx, getTarget, style) {
  var stage = 'start'
  try {
    stage = 'get player'
    var who = getTarget(ctx)

    stage = 'giveHeart'
    giveHeart(who, style)
    return 1
  } catch (e) {
    var msg = '[addheart] FAILED at "' + stage + '": ' + e
    console.error(msg)
    ctx.source.sendFailure(Text.of(msg))
    return 0
  }
}

function takeHeart(plr) {
  var n = getHearts(plr)
  if (n <= 0) throw plr.username + ' has no bonus hearts'
  setHearts(plr, n - 1)
  applyHearts(plr)
  if (plr.health > plr.maxHealth) plr.setHealth(plr.maxHealth)

  sound(plr, 'minecraft:block.beacon.deactivate', 1.2, 0.7)
  sound(plr, 'minecraft:entity.warden.heartbeat', 1.5, 0.5)
  particle(plr, 'minecraft:large_smoke', plr.x, plr.y + 1, plr.z, 0.3, 0.5, 0.3, 0.02, cnt(15))
  particle(plr, 'minecraft:damage_indicator', plr.x, plr.y + 1.5, plr.z, 0.3, 0.3, 0.3, 0.1, cnt(6))
  ring(plr, [0.35, 0.05, 0.08], 1.2, plr.x, plr.y + 0.15, plr.z, 1.2, 0.35)

  var hearts = Math.floor(plr.maxHealth / 2)
  plr.tell(Text.darkRed('[NxEterna] ').append(Text.gray('A heart fades away... ')).append(Text.gray('(' + hearts + ' hearts)')))
}

function getSelf(c) {
  return c.source.player
}

function styleList() {
  return AUTO_ORDER.join(', ')
}

function registerTargeted(event, literal, perm, action) {
  var Commands = event.commands
  var Arguments = event.arguments

  function exec(ctx, getTarget) {
    var stage = 'get player'
    try {
      var who = getTarget(ctx)
      stage = literal
      action(ctx, who)
      return 1
    } catch (e) {
      var msg = '[' + literal + '] FAILED at "' + stage + '": ' + e
      console.error(msg)
      ctx.source.sendFailure(Text.of(msg))
      return 0
    }
  }

  event.register(
    Commands.literal(literal)
      .requires(function (src) { return src.hasPermission(perm) })
      .executes(function (ctx) { return exec(ctx, getSelf) })
      .then(Commands.argument('target', Arguments.PLAYER.create(event))
        .requires(function (src) { return src.hasPermission(2) })
        .executes(function (ctx) {
          return exec(ctx, function (c) { return Arguments.PLAYER.getResult(c, 'target') })
        })
      )
  )
}

function registerCommand(event, literal, style) {
  registerTargeted(event, literal, 2, function (ctx, who) {
    giveHeart(who, style)
  })
}

function tryRegister(name, fn) {
  try {
    fn()
  } catch (e) {
    console.error('[addheart] could not register ' + name + ': ' + e)
  }
}

ServerEvents.commandRegistry(function (event) {
  tryRegister('addheart', function () { registerCommand(event, 'addheart', null) })

  AUTO_ORDER.forEach(function (name) {
    tryRegister('addheart_' + name, function () { registerCommand(event, 'addheart_' + name, name) })
  })

  tryRegister('addheart_random', function () {
    registerTargeted(event, 'addheart_random', 2, function (ctx, who) {
      giveHeart(who, AUTO_ORDER[Math.floor(Math.random() * AUTO_ORDER.length)])
    })
  })

  tryRegister('removeheart', function () {
    registerTargeted(event, 'removeheart', 2, function (ctx, who) {
      takeHeart(who)
    })
  })

  tryRegister('hearts', function () {
    registerTargeted(event, 'hearts', 0, function (ctx, who) {
      var n = getHearts(who)
      var busy = RITUALS[uuidOf(who)] ? ' (ritual in progress)' : ''
      ctx.source.sendSystemMessage(Text.gold('[NxEterna] ').append(Text.white(who.username + ' has ' + n + ' bonus heart' + (n === 1 ? '' : 's') + busy)))
    })
  })

  tryRegister('heartpreview', function () {
    var Commands = event.commands
    var Arguments = event.arguments
    event.register(
      Commands.literal('heartpreview')
        .requires(function (src) { return src.hasPermission(2) })
        .then(Commands.argument('style', Arguments.WORD.create(event))
          .executes(function (ctx) {
            try {
              var plr = ctx.source.player
              var name = String(Arguments.WORD.getResult(ctx, 'style'))
              if (!EFFECTS[name]) throw 'unknown style "' + name + '". Styles: ' + styleList()
              if (RITUALS[uuidOf(plr)]) throw 'a ritual is already running'
              EFFECTS[name].start(plr)
              return 1
            } catch (e) {
              ctx.source.sendFailure(Text.of('[heartpreview] ' + e))
              return 0
            }
          })
        )
    )
  })
})

PlayerEvents.respawned(function (event) {
  var plr = event.player
  setFrozen(plr, false)
  applyHearts(plr)
  plr.server.scheduleInTicks(2, function () {
    applyHearts(plr)
    plr.heal(plr.maxHealth)
  })
})

PlayerEvents.loggedIn(function (event) {
  var plr = event.player
  setFrozen(plr, false)
  applyHearts(plr)
  plr.server.scheduleInTicks(20, function () { applyHearts(plr) })
})
