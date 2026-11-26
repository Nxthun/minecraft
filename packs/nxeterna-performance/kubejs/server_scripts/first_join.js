// NxEterna first join: one path, run once per player (stage 'first_join').
// Gives the quest book, food, and the Keeper's letter (design/keeper-letter.md), then prints the greeting.
// The letter's {direction} is the compass direction from the Hearth to the snow peak.
var NX_KEEPER_DIRECTION = 'north-east'
var NX_KEEPER_LETTER = [
  '{name},',
  'If you are reading this, the valley is yours now. I kept it as long as I could.',
  'Sleep here. The beds are aired and the door bolts from inside. The first nights are the worst.',
  'The book I left you is my own notes, everything I learned the slow way. Open it first: it holds a keepsake for you. Choose the one that suits you.',
  'I left pages of my old survey in the places I mapped. Gather them if you want the whole story.',
  'And look at the mountain to the {direction}. Something lives up there. It has waited a long time for someone. Go when you are ready, not before.',
  'T. Wren, the last Keeper'
]

var nxKeeperLetter = function (name) {
  var paras = NX_KEEPER_LETTER.map(function (p) { return p.replace(/\{name\}/g, name).replace(/\{direction\}/g, NX_KEEPER_DIRECTION) })
  return nxBook('To ' + name, 'T. Wren', nxPaginate(paras))
}


// Put the letter in hotbar slot 1 and the quest book in slot 2 (other mods hand out guide books at login too).
// Names are prefixed because all server scripts share one scope in this pack.
var nxFirstJoinArrange = function (player) {
  var nxFjInv = player.inventory
  var nxFjFind = function (id) {
    for (var i = 0; i < 36; i++) { var s = nxFjInv.getItem(i); if (!s.isEmpty() && String(s.id) == id) return i }
    return -1
  }
  var nxFjSwap = function (a, b) {
    if (a < 0 || a === b) return
    var sa = nxFjInv.getItem(a).copy(), sb = nxFjInv.getItem(b).copy()
    nxFjInv.setItem(a, sb); nxFjInv.setItem(b, sa)
  }
  nxFjSwap(nxFjFind('minecraft:written_book'), 0)
  nxFjSwap(nxFjFind('ftbquests:book'), 1)
}

// New players arrive on the path from the river, facing the fire and the tents (the world spawn angle is not applied on a first join here).
var NX_SPAWN_FACING = { x: -1030.5, y: 64, z: 699.5, yaw: -90, pitch: 0, r: 6 }

PlayerEvents.loggedIn(event => {
  const { player, server } = event

  if (!player.stages.has('first_join')) {
    player.stages.add('first_join')
    if (Math.abs(player.x - NX_SPAWN_FACING.x) < NX_SPAWN_FACING.r && Math.abs(player.z - NX_SPAWN_FACING.z) < NX_SPAWN_FACING.r) {
      server.runCommandSilent('execute in minecraft:overworld run tp ' + player.username + ' ' + NX_SPAWN_FACING.x + ' ' + NX_SPAWN_FACING.y + ' ' + NX_SPAWN_FACING.z + ' ' + NX_SPAWN_FACING.yaw + ' ' + NX_SPAWN_FACING.pitch)
    }

    // 1. Items: quest book, food, the Keeper's letter
    player.give('ftbquests:book')
    player.give(Item.of('minecraft:cooked_beef', 5))
    try {
      player.give(nxKeeperLetter(player.username))
    } catch (e) {
      console.error('[first_join] could not give the Keeper letter to ' + player.username + ': ' + e)
    }
    // A thank-you to the friends who tested the old pack: one gift box (four Common packs and a Legendary one).
    try {
      if (Item.exists('nxeterna_packs:thank_you_box')) player.give('nxeterna_packs:thank_you_box')
    } catch (e) {
      console.error('[first_join] could not give the thank-you box to ' + player.username + ': ' + e)
    }

    // 2. Greeting after 2 seconds (40 ticks)
    server.scheduleInTicks(40, callback => {
      // Other mods hand out their guide books at login too. Put the letter in the first hotbar slot (the one a new
      // player is holding) and the quest book next to it, so the first thing in hand is the letter, not a mod manual.
      try {
        nxFirstJoinArrange(player)
      } catch (e) {
        console.error('[first_join] could not arrange the hotbar for ' + player.username + ': ' + e)
      }
      player.tell('§6--------------------------------------------------')
      player.tell('§e §6§lNxEterna')
      player.tell('§b A world that stays. Dragons on the peaks, old beasts in the valleys.')
      player.tell('§b Build a home, open your quest book, and see how far the road goes.')
      player.tell('§7§o There is a letter for you in your pack, and a small thank-you.')
      player.tell('§6--------------------------------------------------')
    })
  }
})

// Operator re-issue (lost letter, testing): /keeper_letter <player>
ServerEvents.commandRegistry(event => {
  const Commands = event.commands
  const $EntityArg = Java.loadClass('net.minecraft.commands.arguments.EntityArgument')
  event.register(Commands.literal('keeper_letter').requires(s => s.hasPermission(2))
    .then(Commands.argument('target', $EntityArg.player()).executes(ctx => {
      const p = $EntityArg.getPlayer(ctx, 'target')
      p.give(nxKeeperLetter(p.username))
      return 1
    })))
})
