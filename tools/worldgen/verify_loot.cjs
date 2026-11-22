const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const script = path.join(__dirname, '../../extras/nxterra/kubejs/server_scripts/nxterra_structure_loot.js')
const constants = new Proxy({}, { get: () => constants })
const scope = vm.createContext({
  Java: { loadClass: () => constants },
  LootJS: { modifiers: () => {} },
  Item: { of: (id, count) => ({ id, count, isEmpty: () => false }) }
})
vm.runInContext(fs.readFileSync(script, 'utf8') + '\nthis.rule = {nxProfiles, nxDistanceBand, nxRollContainer, nxGoldenOdds, nxElderheartOdds, nxBookLevels};', scope)
const rule = scope.rule
const random = (first, rest, integer) => {
  let index = 0
  return {
    nextDouble: () => index++ === 0 ? first : rest,
    nextInt: n => Math.min(integer, n - 1)
  }
}

const band = distance => rule.nxDistanceBand(true, 800 - distance, -400, 800, -400)
assert.deepEqual([1499, 1500, 3999, 4000, 7999, 8000].map(band), [0, 1, 1, 2, 2, 3])
assert.equal(rule.nxDistanceBand(false, 10000, 0, 0, 0), 0)
assert.equal(rule.nxDistanceBand(true, 900, 1200, 0, 0), 1)

for (const profile of rule.nxProfiles) {
  assert.equal(new Set(profile.support).size, 4, profile.structure)
  for (let band = 0; band < 4; band++) {
    let golden = 0
    let elderheart = 0
    for (let roll = 0; roll < 1000; roll++) {
      const rewards = rule.nxRollContainer(profile, band, random(profile.completion ? (roll + 0.5) / 1000 : 0.99, 0.99, roll % 3), () => null)
      assert.equal(rewards.length, 3 + roll % 3)
      assert.ok(rewards.every(stack => stack.count >= 1))
      golden += Number(rewards[0].id === 'nxterra:golden_bloom_dice')
      elderheart += Number(rewards[0].id === 'nxterra:elderheart_dice')
    }
    assert.equal(golden, profile.completion ? 1000 * rule.nxGoldenOdds[profile.tier][band] : 0, profile.structure)
    assert.equal(elderheart, profile.completion && profile.tier === 3 ? 1000 * rule.nxElderheartOdds[band] : 0)
  }
}

const mapped = rule.nxProfiles.find(profile => profile.map === 'rare')
const fallback = rule.nxRollContainer(mapped, 0, random(0.9, 0.01, 0), () => null)
assert.ok(fallback[0].id.includes('enchanted_book'))
assert.match(fallback[0].id, /minecraft:power":1/)
const far = rule.nxRollContainer(mapped, 3, random(0.9, 0.01, 2), () => null)
assert.match(far[0].id, /minecraft:power":2/)
assert.equal(far.length, 6)
const map = { id: 'minecraft:filled_map', count: 1 }
assert.equal(rule.nxRollContainer(mapped, 1, random(0.9, 0.01, 0), () => map)[0], map)
console.log('Verified band boundaries, loot support counts, focus rewards, Golden and Elderheart odds, and map fallback across ' + rule.nxProfiles.length + ' profiles')
