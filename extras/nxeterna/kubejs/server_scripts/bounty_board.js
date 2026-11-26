// Bounty Board NPC
const BOUNTY_NPC_TAG = 'bounty_npc'
const BOUNTY_NPC_NAME = 'Bounty Master'
const BOUNTY_COIN = 'magic_coins:gold_coin'
const BOUNTY_BONUS = 5
const BOUNTY_TALK_WINDOW = 1200

// Pools
const BOUNTY_POOL = {
  easy: [
    { id: 'zombie', type: 'kill', target: 'minecraft:zombie', count: 15, label: 'Slay 15 Zombies' },
    { id: 'skeleton', type: 'kill', target: 'minecraft:skeleton', count: 15, label: 'Slay 15 Skeletons' },
    { id: 'spider', type: 'kill', target: 'minecraft:spider', count: 10, label: 'Slay 10 Spiders' },
    { id: 'creeper', type: 'kill', target: 'minecraft:creeper', count: 8, label: 'Slay 8 Creepers' },
    { id: 'logs', type: 'deliver', item: '#minecraft:logs', count: 64, label: 'Deliver 64 Logs' },
    { id: 'wheat', type: 'deliver', item: 'minecraft:wheat', count: 32, label: 'Deliver 32 Wheat' },
    { id: 'leather', type: 'deliver', item: 'minecraft:leather', count: 16, label: 'Deliver 16 Leather' },
    { id: 'coal', type: 'deliver', item: 'minecraft:coal', count: 32, label: 'Deliver 32 Coal' }
  ],
  medium: [
    { id: 'witch', type: 'kill', target: 'minecraft:witch', count: 4, label: 'Slay 4 Witches' },
    { id: 'enderman', type: 'kill', target: 'minecraft:enderman', count: 8, label: 'Slay 8 Endermen' },
    { id: 'pillager', type: 'kill', target: 'minecraft:pillager', count: 8, label: 'Slay 8 Pillagers' },
    { id: 'blaze', type: 'kill', target: 'minecraft:blaze', count: 10, label: 'Slay 10 Blazes' },
    { id: 'iron', type: 'deliver', item: 'minecraft:iron_ingot', count: 32, label: 'Deliver 32 Iron Ingots' },
    { id: 'gold', type: 'deliver', item: 'minecraft:gold_ingot', count: 16, label: 'Deliver 16 Gold Ingots' },
    { id: 'andesite', type: 'deliver', item: 'create:andesite_alloy', count: 32, label: 'Deliver 32 Andesite Alloy' },
    { id: 'brass', type: 'deliver', item: 'create:brass_ingot', count: 16, label: 'Deliver 16 Brass Ingots' }
  ],
  hard: [
    { id: 'wither_skeleton', type: 'kill', target: 'minecraft:wither_skeleton', count: 12, label: 'Slay 12 Wither Skeletons' },
    { id: 'evoker', type: 'kill', target: 'minecraft:evoker', count: 2, label: 'Slay 2 Evokers' },
    { id: 'ravager', type: 'kill', target: 'minecraft:ravager', count: 2, label: 'Slay 2 Ravagers' },
    { id: 'precision', type: 'deliver', item: 'create:precision_mechanism', count: 3, label: 'Deliver 3 Precision Mechanisms' },
    { id: 'tubes', type: 'deliver', item: 'create:electron_tube', count: 8, label: 'Deliver 8 Electron Tubes' },
    { id: 'sturdy', type: 'deliver', item: 'create:sturdy_sheet', count: 8, label: 'Deliver 8 Sturdy Sheets' },
    { id: 'diamonds', type: 'deliver', item: 'minecraft:diamond', count: 8, label: 'Deliver 8 Diamonds' }
  ]
}
const BOUNTY_TIERS = [
  { key: 'easy', name: 'Easy', color: 'green', reward: 3 },
  { key: 'medium', name: 'Medium', color: 'yellow', reward: 6 },
  { key: 'hard', name: 'Hard', color: 'red', reward: 12 }
]

// Helpers
const bountyDay = () => Math.floor((Date.now() + 3600000) / 86400000)

const bountyRand = seed => {
  let a = seed % 233280
  return () => {
    a = (a * 9301 + 49297) % 233280
    return a / 233280
  }
}

const bountyHash = str => {
  let h = 7
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 2147483647
  return h
}

const bountyFind = (tier, id) => BOUNTY_POOL[tier].filter(b => b.id === id)[0]

const bountyState = player => {
  const day = bountyDay()
  const raw = String(player.persistentData.getString('forbidden_bounty') || '')
  let state = null
  if (raw.length > 0) {
    try { state = JSON.parse(raw) } catch (e) { state = null }
  }
  if (!state || state.day !== day) {
    const rand = bountyRand(bountyHash(String(player.stringUuid) + ':' + day))
    state = {
      day: day,
      ids: BOUNTY_TIERS.map(t => {
        const pool = BOUNTY_POOL[t.key]
        return pool[Math.floor(rand() * pool.length)].id
      }),
      prog: [0, 0, 0],
      done: [false, false, false],
      bonus: false
    }
    bountySave(player, state)
  }
  return state
}

const bountySave = (player, state) => player.persistentData.putString('forbidden_bounty', JSON.stringify(state))

const bountyCount = (player, item) => {
  const ing = Ingredient.of(item)
  const inv = player.inventory
  let n = 0
  for (let i = 0; i < inv.getContainerSize(); i++) {
    const st = inv.getItem(i)
    if (!st.isEmpty() && ing.test(st)) n += st.getCount()
  }
  return n
}

const bountyTake = (player, item, count) => {
  const ing = Ingredient.of(item)
  const inv = player.inventory
  let left = count
  for (let i = 0; i < inv.getContainerSize() && left > 0; i++) {
    const st = inv.getItem(i)
    if (st.isEmpty() || !ing.test(st)) continue
    const take = Math.min(left, st.getCount())
    st.shrink(take)
    left -= take
  }
  inv.setChanged()
}

const bountyRaw = (player, parts) =>
  player.server.runCommandSilent('tellraw ' + player.username + ' ' + JSON.stringify(parts))

// Menu
const bountyMenu = player => {
  const state = bountyState(player)
  bountyRaw(player, [{ text: '━━━━━━ ', color: 'dark_gray' }, { text: 'Bounty Board', color: 'gold', bold: true }, { text: ' ━━━━━━', color: 'dark_gray' }])
  BOUNTY_TIERS.forEach((tier, i) => {
    const b = bountyFind(tier.key, state.ids[i])
    const line = [{ text: '[' + tier.name + '] ', color: tier.color, bold: true }, { text: b.label, color: 'white' }]
    if (b.type === 'kill' && !state.done[i]) {
      line.push({ text: ' (' + Math.min(state.prog[i], b.count) + '/' + b.count + ')', color: 'gray' })
    }
    line.push({ text: '  ' + tier.reward + ' Gold', color: 'gold' })
    if (state.done[i]) {
      line.push({ text: '  ✔ Done', color: 'dark_green' })
    } else {
      const ready = b.type === 'deliver' || state.prog[i] >= b.count
      line.push({
        text: b.type === 'deliver' ? '  [Deliver]' : '  [Claim]',
        color: ready ? 'aqua' : 'dark_gray',
        clickEvent: { action: 'run_command', value: '/bounty claim ' + (i + 1) },
        hoverEvent: { action: 'show_text', contents: { text: ready ? 'Click to turn in' : 'Not finished yet', color: 'gray' } }
      })
    }
    bountyRaw(player, line)
  })
  bountyRaw(player, [{ text: 'Finish all three for +' + BOUNTY_BONUS + ' Gold. New bounties every day at midnight.', color: 'gray', italic: true }])
}

// Claim
const bountyClaim = (player, slot) => {
  const now = player.server.tickCount
  const talked = player.persistentData.getInt('forbidden_bounty_talk')
  if (now - talked > BOUNTY_TALK_WINDOW || talked === 0) {
    player.tell(Text.red('Talk to the ' + BOUNTY_NPC_NAME + ' to turn in bounties.'))
    return
  }
  const state = bountyState(player)
  const i = slot - 1
  if (i < 0 || i > 2) return
  if (state.done[i]) {
    player.tell(Text.gray('This bounty is already done.'))
    return
  }
  const tier = BOUNTY_TIERS[i]
  const b = bountyFind(tier.key, state.ids[i])

  if (b.type === 'kill') {
    if (state.prog[i] < b.count) {
      player.tell(Text.yellow('Not yet: ' + state.prog[i] + '/' + b.count + '.'))
      return
    }
  } else {
    const have = bountyCount(player, b.item)
    if (have < b.count) {
      player.tell(Text.yellow('You need ' + (b.count - have) + ' more.'))
      return
    }
    bountyTake(player, b.item, b.count)
  }

  state.done[i] = true
  player.give(Item.of(BOUNTY_COIN, tier.reward))
  player.tell(Text.gold('Bounty complete! +' + tier.reward + ' Gold Coins'))
  player.server.runCommandSilent('playsound minecraft:entity.villager.celebrate neutral ' + player.username + ' ~ ~ ~ 1 1')

  if (!state.bonus && state.done[0] && state.done[1] && state.done[2]) {
    state.bonus = true
    player.give(Item.of(BOUNTY_COIN, BOUNTY_BONUS))
    player.tell(Text.gold('All bounties done today! Bonus +' + BOUNTY_BONUS + ' Gold Coins'))
    player.server.runCommandSilent('playsound minecraft:ui.toast.challenge_complete master ' + player.username + ' ~ ~ ~ 1 1')
  }
  bountySave(player, state)
  bountyMenu(player)
}

// NPC interaction
ItemEvents.entityInteracted(event => {
  const npc = event.target
  if (!npc.tags.contains(BOUNTY_NPC_TAG)) return
  event.cancel()
  if (String(event.hand) !== 'MAIN_HAND') return
  const player = event.player
  player.persistentData.putInt('forbidden_bounty_talk', Math.max(1, player.server.tickCount))
  player.server.runCommandSilent('playsound minecraft:entity.villager.ambient neutral ' + player.username + ' ~ ~ ~ 1 1')
  bountyMenu(player)
})

// Kill tracking
EntityEvents.death(event => {
  const killer = event.source.entity
  if (!killer || !killer.isPlayer()) return
  const type = String(event.entity.type)
  const state = bountyState(killer)
  let changed = false
  BOUNTY_TIERS.forEach((tier, i) => {
    if (state.done[i]) return
    const b = bountyFind(tier.key, state.ids[i])
    if (b.type !== 'kill' || b.target !== type || state.prog[i] >= b.count) return
    state.prog[i]++
    changed = true
    const msg = state.prog[i] >= b.count
      ? { text: 'Bounty ready! Return to the ' + BOUNTY_NPC_NAME + '.', color: 'gold' }
      : { text: b.label + ': ' + state.prog[i] + '/' + b.count, color: 'yellow' }
    killer.server.runCommandSilent('title ' + killer.username + ' actionbar ' + JSON.stringify(msg))
  })
  if (changed) bountySave(killer, state)
})

// NPC looks at players
ServerEvents.tick(event => {
  if (event.server.tickCount % 10 !== 0) return
  event.server.runCommandSilent('execute as @e[type=minecraft:villager,tag=' + BOUNTY_NPC_TAG + '] at @s if entity @p[distance=..8] run tp @s ~ ~ ~ facing entity @p[distance=..8] eyes')
})

// Commands
ServerEvents.commandRegistry(event => {
  const Commands = event.commands
  const claim = Commands.literal('claim')
  ;[1, 2, 3].forEach(n => {
    claim.then(Commands.literal(String(n)).executes(ctx => {
      const player = ctx.source.player
      if (player) bountyClaim(player, n)
      return 1
    }))
  })

  event.register(Commands.literal('bounty')
    .then(claim)
    .then(Commands.literal('spawn').requires(s => s.hasPermission(2)).executes(ctx => {
      const player = ctx.source.player
      if (!player) return 0
      const nbt = '{NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,CustomNameVisible:1b,' +
        'CustomName:\'{"text":"' + BOUNTY_NPC_NAME + '","color":"gold","bold":true}\',Tags:["' + BOUNTY_NPC_TAG + '"],' +
        'VillagerData:{profession:"minecraft:cartographer",level:5,type:"minecraft:plains"},Offers:{Recipes:[]}}'
      player.server.runCommandSilent('execute as ' + player.username + ' at @s run summon minecraft:villager ~ ~ ~ ' + nbt)
      player.tell(Text.green(BOUNTY_NPC_NAME + ' spawned.'))
      return 1
    }))
    .then(Commands.literal('remove').requires(s => s.hasPermission(2)).executes(ctx => {
      const player = ctx.source.player
      if (!player) return 0
      player.server.runCommandSilent('execute as ' + player.username + ' at @s run kill @e[type=minecraft:villager,tag=' + BOUNTY_NPC_TAG + ',distance=..5]')
      return 1
    }))
    .then(Commands.literal('reset').requires(s => s.hasPermission(2)).executes(ctx => {
      const player = ctx.source.player
      if (!player) return 0
      player.persistentData.remove('forbidden_bounty')
      player.tell(Text.green('Your bounties were reset.'))
      return 1
    }))
  )
})
