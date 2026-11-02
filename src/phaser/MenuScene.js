import Phaser from 'phaser'
import { W, H, background, button, text, fade } from './common.js'
import { data } from './save.js'
import { TOTAL_LEVELS, PACK, WORLDS } from '../game.js'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu')
  }

  create() {
    background(this, WORLDS[0].sky, 0xfef9c3)
    this.cameras.main.fadeIn(300, 4, 20, 36)
    const g = this.add.graphics()
    g.fillStyle(0x4ade80, 1)
    g.beginPath()
    g.moveTo(0, H)
    for (let x = 0; x <= W; x += 20) g.lineTo(x, 600 + Math.sin(x / 150) * 24 + Math.sin(x / 47) * 6)
    g.lineTo(W, H)
    g.closePath()
    g.fillPath()
    g.lineStyle(10, 0x16a34a, 1)
    g.beginPath()
    for (let x = 0; x <= W; x += 20) g.lineTo(x, 600 + Math.sin(x / 150) * 24 + Math.sin(x / 47) * 6)
    g.strokePath()

    const car = this.add.container(-120, 0)
    const body = this.add.image(0, 0, 'car').setOrigin(0.5, 0.65)
    const wa = this.add.image(-36, 26, 'wheel').setScale(0.8)
    const wb = this.add.image(36, 26, 'wheel').setScale(0.8)
    car.add([wa, wb, body]).setScale(1.5)
    this.tweens.add({ targets: wa, angle: 360 * 6, duration: 9000, repeat: -1 })
    this.tweens.add({ targets: wb, angle: 360 * 6, duration: 9000, repeat: -1 })
    this.tweens.add({ targets: body, y: 3, duration: 160, yoyo: true, repeat: -1 })
    this.tweens.add({
      targets: car,
      x: W + 120,
      duration: 9000,
      repeat: -1,
      onUpdate: () => car.setY(600 + Math.sin(car.x / 150) * 24 + Math.sin(car.x / 47) * 6 - 52),
    })

    const title = text(this, W / 2, 130, 'Rumble Rally', 96, '#fff', { fontStyle: 'bold', stroke: '#9a3412', strokeThickness: 14 }).setOrigin(0.5)
    this.tweens.add({ targets: title, scale: 1.03, angle: 1, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    text(this, W / 2, 216, 'Drive. Flip. Grab the stars. Reach the flag.', 28, '#fff7ed', { stroke: '#9a3412', strokeThickness: 5 }).setOrigin(0.5)

    const done = Object.keys(data.stars).length
    const stars = Object.values(data.stars).reduce((a, b) => a + b, 0)
    const next = Math.min(data.unlocked, TOTAL_LEVELS)
    button(this, W / 2, 320, next > 1 ? `▶  Continue · Level ${next}` : '▶  Play', () => fade(this, 'game', { level: next }), { w: 440, h: 70, size: 30, color: 0xea580c })
    button(this, W / 2, 410, '🗺  Levels', () => fade(this, 'levels', { page: Math.floor((next - 1) / PACK) }), { w: 440, h: 62, size: 26, color: 0x0284c7 })
    text(this, W / 2, 468, `${done}/${TOTAL_LEVELS} levels · ${stars}★`, 20, '#fff', { stroke: '#075985', strokeThickness: 4 }).setOrigin(0.5)
    text(this, W / 2, H - 28, '←  → keys to drive  ·  on touch screens tap the arrow buttons  ·  R restart', 17, '#fff', { stroke: '#075985', strokeThickness: 4 }).setOrigin(0.5)
  }
}
