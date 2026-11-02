// The car physics, shared by the game and by the tests. Matter is injected so both can use the same engine.
export const DT = 1000 / 60
const WHEEL_R = 21
const ACC = 0.011
const MAX_SPIN = 0.38
const AIR_TURN = 0.0085
const MAX_AIR_SPIN = 0.045

export function createSim(Matter, level) {
  const { Engine, Bodies, Body, Composite, Constraint, Events, Vertices } = Matter
  const engine = Engine.create({ enableSleeping: false })
  engine.positionIterations = 8
  engine.velocityIterations = 6
  const world = engine.world

  // Terrain: thin convex slabs under each line segment.
  const ground = []
  for (const line of level.lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const [x1, y1] = line[i]
      const [x2, y2] = line[i + 1]
      const verts = [{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x2, y: y2 + 140 }, { x: x1, y: y1 + 140 }]
      const c = Vertices.centre(verts)
      const body = Bodies.fromVertices(c.x, c.y, [verts], { isStatic: true, friction: 1, restitution: 0, label: 'ground' })
      ground.push(body)
    }
  }
  Composite.add(world, ground)

  const crates = level.crates.map((c) =>
    Bodies.rectangle(c.x, c.y, c.s, c.s, { density: 0.00008, friction: 0.15, restitution: 0.05, label: 'crate' }),
  )
  Composite.add(world, crates)

  const stars = level.stars.map((s, i) => Bodies.circle(s.x, s.y, 22, { isStatic: true, isSensor: true, label: 'star', plugin: { i } }))
  Composite.add(world, stars)
  const flag = Bodies.rectangle(level.flag.x, level.flag.y - 70, 50, 140, { isStatic: true, isSensor: true, label: 'flag' })
  Composite.add(world, flag)

  // The car: a hull with a cabin on top (touching anything with either one is a crash) and two wheels.
  const group = Body.nextGroup(true)
  const { x, y } = level.start
  const hull = Bodies.rectangle(x, y, 104, 24, { collisionFilter: { group }, chamfer: { radius: 6 } })
  const cabin = Bodies.rectangle(x - 4, y - 24, 58, 24, { collisionFilter: { group } })
  const chassis = Body.create({ parts: [hull, cabin], collisionFilter: { group }, friction: 0.2, label: 'chassis' })
  Body.setDensity(chassis, 0.0016)
  Body.setInertia(chassis, chassis.inertia * 2.2)
  const mkWheel = (dx) =>
    Bodies.circle(x + dx, y + 18, WHEEL_R, { collisionFilter: { group }, friction: 1.4, frictionStatic: 2, restitution: 0, density: 0.0016, frictionAir: 0.004, label: 'wheel' })
  const wheels = [mkWheel(-36), mkWheel(36)]
  Composite.add(world, [chassis, ...wheels])
  wheels.forEach((w, i) =>
    Composite.add(
      world,
      Constraint.create({ bodyA: chassis, pointA: { x: (i ? 1 : -1) * 36, y: 18 }, bodyB: w, pointB: { x: 0, y: 0 }, stiffness: 0.9, damping: 0.1, length: 0 }),
    ),
  )

  const state = { status: 'play', got: new Set(), steps: 0, contacts: [0, 0], events: [] }
  const emit = (e) => state.events.push(e)
  const isTerrain = (b) => b.label === 'ground' || b.label === 'crate'

  Events.on(engine, 'collisionStart', (ev) => {
    for (const { bodyA, bodyB } of ev.pairs) {
      for (const [a, b] of [[bodyA, bodyB], [bodyB, bodyA]]) {
        if (a.parent === chassis) {
          if (b.label === 'ground' && state.status === 'play') {
            state.status = 'crashed'
            emit({ type: 'crash', x: chassis.position.x, y: chassis.position.y })
          } else if (b.label === 'flag' && state.status === 'play') {
            state.status = 'won'
            emit({ type: 'win' })
          } else if (b.label === 'star') collect(b)
        } else if (a.label === 'wheel') {
          const i = wheels.indexOf(a)
          if (isTerrain(b)) state.contacts[i]++
          else if (b.label === 'star') collect(b)
          else if (b.label === 'flag' && state.status === 'play') {
            state.status = 'won'
            emit({ type: 'win' })
          }
        }
      }
    }
  })
  Events.on(engine, 'collisionEnd', (ev) => {
    for (const { bodyA, bodyB } of ev.pairs) {
      for (const [a, b] of [[bodyA, bodyB], [bodyB, bodyA]]) {
        if (a.label === 'wheel' && isTerrain(b)) {
          const i = wheels.indexOf(a)
          state.contacts[i] = Math.max(0, state.contacts[i] - 1)
        }
      }
    }
  })

  function collect(star) {
    const i = star.plugin.i
    if (state.got.has(i)) return
    state.got.add(i)
    emit({ type: 'star', i, x: star.position.x, y: star.position.y })
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

  function step(input) {
    if (state.status !== 'play') {
      Engine.update(engine, DT)
      return
    }
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    if (dir) {
      for (const w of wheels) Body.setAngularVelocity(w, clamp(w.angularVelocity + dir * ACC, -MAX_SPIN, MAX_SPIN))
      if (state.contacts[0] + state.contacts[1] === 0) {
        Body.setAngularVelocity(chassis, clamp(chassis.angularVelocity + dir * AIR_TURN, -MAX_AIR_SPIN, MAX_AIR_SPIN))
      }
    }
    Engine.update(engine, DT)
    state.steps++
    if (chassis.position.y > level.killY && state.status === 'play') {
      state.status = 'crashed'
      emit({ type: 'fall' })
    }
  }

  return { engine, world, chassis, wheels, crates, stars, ground, state, step, level }
}

// A simple driver for tests: full throttle, but ease off when the nose lifts too high.
export function botInput(sim) {
  const a = sim.chassis.angle
  if (sim.state.contacts[0] + sim.state.contacts[1] === 0) {
    const ahead = a + sim.chassis.angularVelocity * 8
    return { right: ahead < 0.12, left: ahead > 0.3 }
  }
  return { right: a > -0.5 || Math.abs(sim.chassis.velocity.x) < 1.2, left: false }
}
