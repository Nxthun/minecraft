// NxEterna: a boss kill counts for everyone who was there.
//
// Each player keeps their own quest book (the owner's choice), and FTB Quests credits a kill only to the player
// who dealt the last blow. Without this script each of the four friends would have to land their own killing blow
// on every story boss. Here every other player within NX_BOSS_CREDIT.range blocks of a dying boss gets the same
// kill credit FTB Quests gives the killer, under the same rule (the quest must already be unlocked for them).
//
// "Boss" = in the #c:bosses entity tag, or at least minHealth max health, or named in `extra`.
// Ordinary mobs are never shared, so "kill 15 zombies" stays personal.

const NX_BOSS_CREDIT = {
  range: 64,
  minHealth: 100,
  extra: ['twilightforest:knight_phantom']
}

const NxBcServerQuestFile = Java.loadClass('dev.ftb.mods.ftbquests.quest.ServerQuestFile')
const NxBcKillTask = Java.loadClass('dev.ftb.mods.ftbquests.quest.task.KillTask')
const NxBcTagKey = Java.loadClass('net.minecraft.tags.TagKey')
const NxBcRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const NxBcResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const NxBcBuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const NX_BC_BOSS_TAG = NxBcTagKey.create(NxBcRegistries.ENTITY_TYPE, NxBcResourceLocation.fromNamespaceAndPath('c', 'bosses'))

function nxBcIsBoss(entity) {
  if (!entity || !entity.isLiving()) return false
  const id = String(entity.type)   // in KubeJS `type` is the id string, not the EntityType
  if (NX_BOSS_CREDIT.extra.indexOf(id) >= 0) return true
  if (entity.getMaxHealth() >= NX_BOSS_CREDIT.minHealth) return true
  const type = NxBcBuiltInRegistries.ENTITY_TYPE.get(NxBcResourceLocation.parse(id))
  return type != null && type.is(NX_BC_BOSS_TAG)
}

EntityEvents.death(event => {
  try {
    nxBcShare(event)
  } catch (e) {
    console.error('[nx_boss_credit] ' + e)   // never let a credit problem disturb a death
  }
})

function nxBcShare(event) {
  const entity = event.entity
  if (entity.isPlayer() || !nxBcIsBoss(entity)) return
  const file = NxBcServerQuestFile.INSTANCE
  if (!file) return
  const tasks = file.collect(NxBcKillTask)
  if (tasks.isEmpty()) return

  // the killer's own team is credited by FTB Quests itself; never count a team twice
  const done = []
  const killer = event.source ? event.source.player : null
  // declared at function level: Rhino (KubeJS) throws "redeclaration of var" for a const inside an if block,
  // which aborted the whole share whenever a player landed the killing blow (seen live 26 Nov, 14:42)
  const own = killer ? file.getTeamData(killer) : null
  if (own && own.isPresent()) done.push(String(own.get().getTeamId()))

  const r2 = NX_BOSS_CREDIT.range * NX_BOSS_CREDIT.range
  entity.level.players.forEach(player => {
    if (player.isSpectator() || player.isFake()) return
    if (player.distanceToSqr(entity) > r2) return
    const found = file.getTeamData(player)
    if (!found.isPresent()) return
    const data = found.get()
    const team = String(data.getTeamId())
    if (done.indexOf(team) >= 0) return
    done.push(team)
    let counted = false
    tasks.forEach(task => {
      if (data.getProgress(task) >= task.getMaxProgress()) return
      if (!data.canStartTasks(task.getQuest())) return
      const before = data.getProgress(task)
      task.kill(data, entity)
      if (data.getProgress(task) > before) counted = true
    })
    if (counted) {
      player.tell(Text.gold('[NxEterna] ').append(Text.white('You were there. ')).append(entity.getDisplayName())
        .append(Text.white(' counts for your quest book too.')))
    }
  })
}
