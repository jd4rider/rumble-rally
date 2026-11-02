import Phaser from 'phaser'
import { W, H, background, button, text, fade } from './common.js'
import { data } from './save.js'
import { WORLDS, PACK, PACKS, TOTAL_LEVELS, worldOf } from '../game.js'

export default class LevelsScene extends Phaser.Scene {
  constructor() {
    super('levels')
  }

  init(d) {
    this.page = Phaser.Math.Clamp(d?.page ?? 0, 0, PACKS - 1)
  }

  create() {
    const first = this.page * PACK + 1
    const w = WORLDS[worldOf(first)]
    background(this, w.sky, 0xffffff)
    this.cameras.main.fadeIn(250, 4, 20, 36)
    text(this, W / 2, 56, w.name, 46, '#fff', { fontStyle: 'bold', stroke: '#0c4a6e', strokeThickness: 7 }).setOrigin(0.5)
    text(this, W / 2, 100, `Levels ${first}–${Math.min(TOTAL_LEVELS, first + PACK - 1)} of ${TOTAL_LEVELS}`, 18, '#fff', { stroke: '#0c4a6e', strokeThickness: 4 }).setOrigin(0.5)
    const stars = Object.values(data.stars).reduce((a, b) => a + b, 0)
    text(this, W - 28, 36, `${stars} ★`, 28, '#fde047', { fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(1, 0.5)
    button(this, 100, 40, '◀ Menu', () => fade(this, 'menu'), { w: 150, h: 46, size: 20, color: 0x374151 })

    const size = 190
    const gap = 26
    const left = (W - (5 * size + 4 * gap)) / 2
    for (let i = 0; i < PACK; i++) {
      const n = first + i
      if (n > TOTAL_LEVELS) break
      const open = n <= data.unlocked
      const x = left + (i % 5) * (size + gap) + size / 2
      const y = 150 + Math.floor(i / 5) * (size - 10 + gap) + size / 2 - 20
      const box = this.add.container(x, y)
      const g = this.add.graphics()
      g.fillStyle(open ? w.accent : 0x1f2f44, open ? 0.95 : 0.8).fillRoundedRect(-size / 2, -size / 2 + 10, size, size - 20, 20)
      g.lineStyle(3, 0xffffff, open ? 0.7 : 0.15).strokeRoundedRect(-size / 2, -size / 2 + 10, size, size - 20, 20)
      box.add(g)
      box.add(text(this, 0, -20, String(n), 54, open ? '#fff' : '#53657d', { fontStyle: 'bold' }).setOrigin(0.5))
      if (open) {
        const got = data.stars[n] || 0
        for (let s = 0; s < 3; s++) box.add(text(this, (s - 1) * 38, 38, '★', 34, s < got ? '#fde047' : '#00000055').setOrigin(0.5))
        box.setSize(size, size).setInteractive({ useHandCursor: true })
        box.on('pointerdown', () => {
          this.tweens.add({ targets: box, scale: 0.94, duration: 70, yoyo: true })
          fade(this, 'game', { level: n })
        })
        if (n === data.unlocked) this.tweens.add({ targets: box, scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      } else {
        box.add(text(this, 0, 36, '🔒', 32).setOrigin(0.5))
      }
    }

    const go = (d) => this.scene.restart({ page: Phaser.Math.Clamp(this.page + d, 0, PACKS - 1) })
    const nav = { w: 120, h: 52, size: 20, color: 0x075985 }
    const last = Math.floor((Math.min(data.unlocked, TOTAL_LEVELS) - 1) / PACK)
    const y = H - 46
    if (this.page > 0) {
      button(this, 90, y, '◀ Prev', () => go(-1), nav)
      if (this.page > 4) button(this, 220, y, '−5', () => go(-5), { ...nav, w: 90, color: 0x0f4c75 })
    }
    if (this.page < PACKS - 1) {
      button(this, W - 90, y, 'Next ▶', () => go(1), nav)
      if (this.page < PACKS - 5) button(this, W - 220, y, '+5', () => go(5), { ...nav, w: 90, color: 0x0f4c75 })
    }
    if (this.page !== last) button(this, W / 2, y, 'Current', () => this.scene.restart({ page: last }), { ...nav, w: 140, color: 0xea580c })
  }
}
