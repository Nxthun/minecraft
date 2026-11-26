const MARKET_GREETINGS = [
  'Welcome, traveler. Everything has a price.',
  'Got coin to spend? See what you can buy.',
  'Rare goods for those with gold.',
  'Step inside, have a look around. Nothing is free.'
]

const marketLastUse = {}

BlockEvents.rightClicked('farmingforblockheads:market', event => {
  const player = event.player
  const id = String(player.stringUuid)
  const now = event.level.time
  if (marketLastUse[id] && now - marketLastUse[id] < 40) return
  marketLastUse[id] = now

  const name = player.username
  const text = MARKET_GREETINGS[Math.floor(Math.random() * MARKET_GREETINGS.length)]
  const x = event.block.x + 0.5
  const y = event.block.y + 1.2
  const z = event.block.z + 0.5

  event.server.runCommandSilent(`playsound minecraft:entity.villager.trade neutral ${name} ${x} ${y} ${z} 1 1`)
  event.server.runCommandSilent(`particle minecraft:happy_villager ${x} ${y} ${z} 0.3 0.3 0.3 0.02 15`)
  event.server.runCommandSilent(`title ${name} actionbar {"text":"${text}","color":"gold"}`)
})
