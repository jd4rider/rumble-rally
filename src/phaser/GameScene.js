import Phaser from 'phaser'
import Matter from 'matter-js'
import { W, H, button, text, fade } from './common.js'
import { ring, flashAt, popText, grains } from './fx.js'
import { sfx } from '../sound.js'
import { data, persist } from './save.js'
import { levelData, WORLDS, worldOf, TOTAL_LEVELS } from '../game.js'
import { createSim, DT } from '../sim.js'

const BTN = { w: 170, h: 120 }

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game')
  }

  init(d) {
    this.n = Phaser.Math.Clamp(d?.level ?? 1, 1, TOTAL_LEVELS)
  }

  create() {
    const lvl = levelData(this.n)
    this.lvl = lvl
    const world = WORLDS[worldOf(this.n)]
    this.world = world
    this.sim = createSim(Matter, lvl)
    this.acc = 0
    this.ended = false
    this.leaving = false
    this.input.enabled = true
    this.input.keyboard.enabled = true
    this.elapsed = 0
    this.cameras.main.fadeIn(250, 4, 20, 36)

    this.drawSky(world)
    this.drawHills(world, lvl)
    this.drawTerrain(world, lvl)

    this.crateImgs = this.sim.crates.map((b) => this.add.image(b.position.x, b.position.y, 'crate').setDisplaySize(34, 34).setDepth(3))
    this.starImgs = lvl.stars.map((s, i) => {
      const img = this.add.image(s.x, s.y, 'star').setDepth(4)
      this.tweens.add({ targets: img, scale: 1.18, angle: 8, duration: 600 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      this.add.image(s.x, s.y, 'glow').setTint(0xfde047).setBlendMode('ADD').setAlpha(0.45).setDepth(3).setScale(0.8)
      return img
    })
    this.add.image(lvl.flag.x, lvl.flag.y, 'flag').setOrigin(0.12, 1).setDepth(3)

    const c = this.sim.chassis
    const off = { x: c.position.x - lvl.start.x, y: c.position.y - lvl.start.y }
    this.carImg = this.add.image(c.position.x, c.position.y, 'car').setDepth(6)
    this.carImg.setOrigin((60 + off.x) / 120, (50 + off.y) / 76)
    this.wheelImgs = this.sim.wheels.map((w) => this.add.image(w.position.x, w.position.y, 'wheel').setDepth(5).setDisplaySize(42, 42))

    const cam = this.cameras.main
    cam.setScroll(c.position.x - W * 0.3, c.position.y - H * 0.6)
    this.camX = cam.scrollX
    this.camY = cam.scrollY

    this.keys = this.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', r: 'R', esc: 'ESC' })
    this.input.keyboard.addCapture('LEFT,RIGHT,UP,DOWN,SPACE')
    this.input.addPointer(3)
    this.keys.r.removeAllListeners()
    this.keys.esc.removeAllListeners()
    this.keys.r.on('down', () => this.restart())
    this.keys.esc.on('down', () => fade(this, 'levels', { page: Math.floor((this.n - 1) / 10) }))

    this.buildHud(world)
    this.intro(world)
  }

  drawSky(world) {
    const key = `sky${world.name}`
    if (!this.textures.exists(key)) {
      const t = this.textures.createCanvas(key, 8, H)
      const ctx = t.getContext()
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, world.sky[0])
      g.addColorStop(1, world.sky[1])
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 8, H)
      t.refresh()
    }
    this.add.image(W / 2, H / 2, key).setDisplaySize(W, H).setScrollFactor(0).setDepth(-100)
    for (let i = 0; i < 6; i++) {
      const cloud = this.add.ellipse(Phaser.Math.Between(0, W * 2), Phaser.Math.Between(40, 220), Phaser.Math.Between(120, 220), 46, 0xffffff, 0.35)
      cloud.setScrollFactor(0.06).setDepth(-95)
    }
  }

  drawHills(world, lvl) {
    const g = this.add.graphics().setScrollFactor(0.3).setDepth(-50)
    g.fillStyle(world.hill, 0.75)
    g.beginPath()
    const span = lvl.width * 0.3 + W + 400
    g.moveTo(-200, H + 600)
    for (let x = -200; x <= span; x += 40) g.lineTo(x, 380 + Math.sin(x / 210) * 70 + Math.sin(x / 83) * 22)
    g.lineTo(span, H + 600)
    g.closePath()
    g.fillPath()
    const g2 = this.add.graphics().setScrollFactor(0.6).setDepth(-40)
    g2.fillStyle(world.hill, 0.9)
    g2.beginPath()
    const span2 = lvl.width * 0.6 + W + 400
    g2.moveTo(-200, H + 600)
    for (let x = -200; x <= span2; x += 40) g2.lineTo(x, 470 + Math.sin(x / 140 + 2) * 55 + Math.sin(x / 61) * 14)
    g2.lineTo(span2, H + 600)
    g2.closePath()
    g2.fillPath()
  }

  drawTerrain(world, lvl) {
    const g = this.add.graphics().setDepth(2)
    for (const line of lvl.lines) {
      g.fillStyle(world.dirt, 1)
      g.beginPath()
      g.moveTo(line[0][0], line[0][1])
      for (const [x, y] of line) g.lineTo(x, y)
      g.lineTo(line.at(-1)[0], lvl.killY + 400)
      g.lineTo(line[0][0], lvl.killY + 400)
      g.closePath()
      g.fillPath()
      g.lineStyle(14, world.top, 1)
      g.beginPath()
      g.moveTo(line[0][0], line[0][1] + 4)
      for (const [x, y] of line) g.lineTo(x, y + 4)
      g.strokePath()
    }
  }

  buildHud(world) {
    const D = 50
    this.add.rectangle(W / 2, 22, W - 40, 8, 0x000000, 0.3).setScrollFactor(0).setDepth(D)
    this.bar = this.add.rectangle(20, 22, 2, 8, 0xfde047).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1)
    this.hudText = text(this, 20, 38, '', 26, '#fff', { fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setScrollFactor(0).setDepth(D)
    this.starText = text(this, W / 2, 38, '', 30, '#fde047', { fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D)
    const small = { w: 56, h: 48, size: 22, color: 0x1f2937 }
    button(this, W - 130, 62, '↻', () => this.restart(), small).setScrollFactor(0).setDepth(D)
    button(this, W - 60, 62, '☰', () => fade(this, 'levels', { page: Math.floor((this.n - 1) / 10) }), small).setScrollFactor(0).setDepth(D)

    this.btnL = this.makeArrow(24 + BTN.w / 2, H - 24 - BTN.h / 2, '◀')
    this.btnR = this.makeArrow(W - 24 - BTN.w / 2, H - 24 - BTN.h / 2, '▶')
    this.touch = { left: false, right: false }
  }

  makeArrow(x, y, label) {
    const c = this.add.container(x, y).setScrollFactor(0).setDepth(60)
    const bg = this.add.graphics()
    const draw = (on) => {
      bg.clear()
      bg.fillStyle(on ? 0xfacc15 : 0x000000, on ? 0.75 : 0.35).fillRoundedRect(-BTN.w / 2, -BTN.h / 2, BTN.w, BTN.h, 24)
      bg.lineStyle(4, 0xffffff, on ? 0.9 : 0.5).strokeRoundedRect(-BTN.w / 2, -BTN.h / 2, BTN.w, BTN.h, 24)
    }
    draw(false)
    const t = text(this, 0, 0, label, 64, '#fff').setOrigin(0.5)
    c.add([bg, t])
    c.draw = draw
    c.rect = new Phaser.Geom.Rectangle(x - BTN.w / 2 - 12, y - BTN.h / 2 - 40, BTN.w + 24, BTN.h + 64)
    return c
  }

  intro(world) {
    const t = text(this, W / 2, 230, `Level ${this.n}\n${world.name}`, 54, '#fff', { fontStyle: 'bold', align: 'center', stroke: '#000', strokeThickness: 8 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(70)
      .setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, y: 250, duration: 300, hold: 700, yoyo: true, onComplete: () => t.destroy() })
  }

  restart() {
    if (this.leaving) return
    this.leaving = true
    this.scene.restart({ level: this.n })
  }

  readInput() {
    const k = this.keys
    let left = k.left.isDown || k.a.isDown
    let right = k.right.isDown || k.d.isDown
    let tl = false
    let tr = false
    for (const p of this.input.manager.pointers) {
      if (!p.isDown) continue
      if (this.btnL.rect.contains(p.x, p.y)) tl = true
      if (this.btnR.rect.contains(p.x, p.y)) tr = true
    }
    if (tl !== this.btnL.on) this.btnL.draw((this.btnL.on = tl))
    if (tr !== this.btnR.on) this.btnR.draw((this.btnR.on = tr))
    left ||= tl
    right ||= tr
    return { left, right }
  }

  update(_, delta) {
    const sim = this.sim
    const input = this.ended ? { left: false, right: false } : this.readInput()
    this.acc += Math.min(delta, 100)
    while (this.acc >= DT) {
      this.acc -= DT
      sim.step(input)
      if (sim.state.status === 'play') this.elapsed += DT / 1000
      this.stepFx(input)
    }
    this.handleEvents()
    this.syncVisuals()
    this.updateHud()
  }

  stepFx(input) {
    const s = this.sim
    if (s.state.status !== 'play') return
    const driving = input.left || input.right
    if (driving && s.state.steps % 5 === 0) {
      s.wheels.forEach((w, i) => {
        if (s.state.contacts[i]) grains(this, w.position.x, w.position.y + 18, this.world.top, 2, 120, true)
      })
    }
  }

  handleEvents() {
    const s = this.sim
    for (const e of s.state.events.splice(0)) {
      if (e.type === 'star') {
        this.starImgs[e.i].setVisible(false)
        sfx.coin()
        popText(this, e.x, e.y - 20, `★ ${s.state.got.size}/3`, '#fde047', 30)
        ring(this, e.x, e.y, 0xfde047, 120, 500)
        flashAt(this, e.x, e.y, 220, 0xfde047)
        grains(this, e.x, e.y, [0xfde047, 0xffffff, 0xfb923c], 22, 320)
      } else if ((e.type === 'crash' || e.type === 'fall') && !this.ended) {
        this.ended = true
        const x = e.x ?? s.chassis.position.x
        const y = e.y ?? s.chassis.position.y
        sfx.wrong()
        if (e.type === 'crash') {
          flashAt(this, x, y, 420, 0xfb923c)
          ring(this, x, y, 0xfef08a, 260, 600, 10)
          grains(this, x, y, [0xef4444, 0xfb923c, 0xfde047, 0xffffff], 50, 520)
          this.cameras.main.shake(300, 0.012)
        }
        this.time.delayedCall(700, () => this.panel(false))
      } else if (e.type === 'win' && !this.ended) {
        this.ended = true
        sfx.win()
        const f = this.lvl.flag
        for (let i = 0; i < 5; i++) this.time.delayedCall(i * 150, () => grains(this, f.x + Phaser.Math.Between(-80, 80), f.y - 120 - i * 10, [0xfde047, 0xf472b6, 0x38bdf8, 0x4ade80], 26, 420))
        this.time.delayedCall(1100, () => this.panel(true))
      }
    }
  }

  syncVisuals() {
    const s = this.sim
    const c = s.chassis
    this.carImg.setPosition(c.position.x, c.position.y).setRotation(c.angle)
    s.wheels.forEach((w, i) => this.wheelImgs[i].setPosition(w.position.x, w.position.y).setRotation(w.angle))
    s.crates.forEach((b, i) => this.crateImgs[i].setPosition(b.position.x, b.position.y).setRotation(b.angle))
    if (this.ended && s.state.status === 'crashed') this.carImg.setAlpha(0.9)
    const cam = this.cameras.main
    const vx = c.velocity.x
    const tx = c.position.x - W * 0.32 + Phaser.Math.Clamp(vx * 18, -100, 260)
    const ty = c.position.y - H * 0.62
    this.camX += (tx - this.camX) * 0.1
    this.camY += (ty - this.camY) * 0.08
    cam.setScroll(this.camX, this.camY)
  }

  updateHud() {
    const s = this.sim
    this.hudText.setText(`Level ${this.n}   ⏱ ${this.elapsed.toFixed(1)}s`)
    this.starText.setText('★'.repeat(s.state.got.size) + '☆'.repeat(3 - s.state.got.size))
    const p = Phaser.Math.Clamp(s.chassis.position.x / this.lvl.flag.x, 0, 1)
    this.bar.width = Math.max(2, p * (W - 40))
  }

  panel(win) {
    if (this.leaving) return
    const D = 80
    const got = this.sim.state.got.size
    const earned = win ? Math.max(1, got) : 0
    let best = false
    if (win) {
      data.stars[this.n] = Math.max(data.stars[this.n] || 0, earned)
      if (this.n + 1 > data.unlocked && this.n < TOTAL_LEVELS) data.unlocked = this.n + 1
      const prev = data.best[this.n]
      if (!prev || this.elapsed < prev) {
        data.best[this.n] = Math.round(this.elapsed * 10) / 10
        best = !!prev
      }
      persist()
    }
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setScrollFactor(0).setDepth(D)
    const box = this.add.container(W / 2, H / 2).setScrollFactor(0).setDepth(D + 1)
    const bg = this.add.graphics()
    bg.fillStyle(0x0c1a2e, 0.96).fillRoundedRect(-300, -190, 600, 380, 28)
    bg.lineStyle(4, win ? 0xfde047 : 0xef4444, 1).strokeRoundedRect(-300, -190, 600, 380, 28)
    box.add(bg)
    box.add(text(this, 0, -140, win ? 'Level complete!' : 'Crashed!', 48, win ? '#fde047' : '#fca5a5', { fontStyle: 'bold' }).setOrigin(0.5))
    if (win) {
      for (let i = 0; i < 3; i++) {
        const st = this.add.image((i - 1) * 90, -50, 'star').setScale(i < earned ? 1.5 : 1.1).setTint(i < earned ? 0xffffff : 0x334155)
        box.add(st)
        if (i < earned) this.tweens.add({ targets: st, scale: 1.8, duration: 300, delay: 200 + i * 220, yoyo: true, ease: 'Back.Out' })
      }
      const sub = `${this.elapsed.toFixed(1)}s${best ? ' · new best!' : ''}  ·  ${got}/3 stars collected`
      box.add(text(this, 0, 25, sub, 20, '#cbd5e1').setOrigin(0.5))
    } else {
      box.add(text(this, 0, -40, 'Take it slow on the hills and lean in the air.', 20, '#cbd5e1').setOrigin(0.5))
    }
    const y = win ? 110 : 60
    const retry = button(this, win ? -190 : -120, y, '↻ Retry', () => this.restart(), { w: 170, h: 60, size: 24, color: 0x0284c7 })
    const menu = button(this, win ? 0 : 120, y, '☰ Levels', () => fade(this, 'levels', { page: Math.floor((this.n - 1) / 10) }), { w: 170, h: 60, size: 24, color: 0x475569 })
    box.add([retry, menu])
    if (win && this.n < TOTAL_LEVELS) box.add(button(this, 190, y, 'Next ▶', () => fade(this, 'game', { level: this.n + 1 }), { w: 170, h: 60, size: 24, color: 0xea580c }))
    box.setScale(0.7).setAlpha(0)
    this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' })
    shade.setAlpha(0)
    this.tweens.add({ targets: shade, alpha: 0.5, duration: 260 })
    this.input.keyboard.once('keydown-ENTER', () => (win && this.n < TOTAL_LEVELS ? fade(this, 'game', { level: this.n + 1 }) : this.restart()))
  }
}
