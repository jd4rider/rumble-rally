import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { generateLevel, TOTAL_LEVELS, worldOf, WORLDS } from './game.js'
import { createSim, botInput } from './sim.js'

const Matter = createRequire(import.meta.url)('matter-js')

test('levels are deterministic and well formed', () => {
  for (const n of [1, 37, 120, TOTAL_LEVELS]) {
    const a = generateLevel(n)
    assert.deepEqual(a, generateLevel(n))
    assert.equal(a.stars.length, 3)
    assert.ok(a.flag.x > 1000 && a.width >= a.flag.x)
    assert.ok(a.lines.every((l) => l.length > 1))
  }
  assert.notDeepEqual(generateLevel(5).lines, generateLevel(6).lines)
})

test('worlds cover every level', () => {
  assert.equal(worldOf(1), 0)
  assert.equal(worldOf(TOTAL_LEVELS), WORLDS.length - 1)
})

test('a bot can finish a spread of levels', () => {
  for (const n of [1, 12, 25, 60, 99, 140, 175, TOTAL_LEVELS]) {
    const sim = createSim(Matter, generateLevel(n))
    let steps = 0
    while (sim.state.status === 'play' && steps++ < 60 * 120) sim.step(botInput(sim))
    assert.equal(sim.state.status, 'won', `level ${n}`)
  }
})

test('crashing on the roof ends the run', () => {
  const lvl = generateLevel(3)
  const sim = createSim(Matter, lvl)
  for (let i = 0; i < 400 && sim.state.status === 'play'; i++) sim.step({ left: true, right: false })
  assert.notEqual(sim.state.status, 'won')
})
