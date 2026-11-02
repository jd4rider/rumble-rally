
export const W = 1280
export const H = 720
export const FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'

function canvas(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return
  const t = scene.textures.createCanvas(key, w, h)
  draw(t.getContext(), w, h)
  t.refresh()
}

const OUT = '#1c1033'

function drawCar(ctx) {
  ctx.lineJoin = 'round'
  // texture is 120x76; the hull's centre sits at (60, 50)
  ctx.fillStyle = '#ef4444'
  ctx.strokeStyle = OUT
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(8, 38, 104, 26, 9)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#f87171'
  ctx.beginPath()
  ctx.roundRect(8, 38, 104, 8, 6)
  ctx.fill()
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.roundRect(104, 44, 10, 10, 3)
  ctx.fill()
  ctx.fillStyle = '#f97316'
  ctx.fillRect(6, 46, 7, 10)
  ctx.fillStyle = '#dc2626'
  ctx.strokeStyle = OUT
  ctx.beginPath()
  ctx.moveTo(24, 38)
  ctx.lineTo(32, 12)
  ctx.lineTo(80, 12)
  ctx.lineTo(92, 38)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#bae6fd'
  ctx.beginPath()
  ctx.moveTo(32, 36)
  ctx.lineTo(38, 17)
  ctx.lineTo(76, 17)
  ctx.lineTo(85, 36)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // a cat driver
  ctx.fillStyle = '#f59e0b'
  ctx.beginPath()
  ctx.moveTo(48, 22)
  ctx.lineTo(50, 12)
  ctx.lineTo(56, 18)
  ctx.lineTo(66, 18)
  ctx.lineTo(72, 12)
  ctx.lineTo(74, 22)
  ctx.lineTo(74, 34)
  ctx.lineTo(48, 34)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#1c1033'
  ctx.beginPath()
  ctx.arc(55, 26, 2.4, 0, 7)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(67, 26, 2.4, 0, 7)
  ctx.fill()
  ctx.fillStyle = '#f472b6'
  ctx.fillRect(59, 29, 4, 3)
}

function drawWheel(ctx) {
  ctx.translate(26, 26)
  ctx.fillStyle = '#1f2937'
  ctx.strokeStyle = OUT
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, 0, 22, 0, 7)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#d1d5db'
  ctx.beginPath()
  ctx.arc(0, 0, 12, 0, 7)
  ctx.fill()
  ctx.strokeStyle = '#6b7280'
  ctx.lineWidth = 3
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12)
    ctx.stroke()
  }
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(0, 0, 4, 0, 7)
  ctx.fill()
}

function drawCrate(ctx) {
  ctx.fillStyle = '#d97706'
  ctx.strokeStyle = OUT
  ctx.lineWidth = 3
  ctx.fillRect(2, 2, 60, 60)
  ctx.strokeRect(2, 2, 60, 60)
  ctx.strokeStyle = '#92400e'
  ctx.lineWidth = 5
  ctx.strokeRect(10, 10, 44, 44)
  ctx.beginPath()
  ctx.moveTo(10, 10)
  ctx.lineTo(54, 54)
  ctx.moveTo(54, 10)
  ctx.lineTo(10, 54)
  ctx.stroke()
}

function drawStar(ctx) {
  ctx.translate(32, 33)
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 12 : 28
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r)
  }
  ctx.closePath()
  ctx.fillStyle = '#fde047'
  ctx.fill()
  ctx.lineWidth = 3.5
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#a16207'
  ctx.stroke()
}

function drawFlag(ctx) {
  ctx.fillStyle = '#e5e7eb'
  ctx.strokeStyle = OUT
  ctx.lineWidth = 3
  ctx.fillRect(6, 4, 8, 136)
  ctx.strokeRect(6, 4, 8, 136)
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      ctx.fillStyle = (r + c) % 2 ? '#111827' : '#f9fafb'
      ctx.fillRect(14 + c * 12, 6 + r * 12, 12, 12)
    }
  ctx.strokeRect(14, 6, 60, 48)
}

export function makeTextures(scene) {
  canvas(scene, 'car', 120, 76, drawCar)
  canvas(scene, 'wheel', 52, 52, drawWheel)
  canvas(scene, 'crate', 64, 64, drawCrate)
  canvas(scene, 'star', 64, 66, drawStar)
  canvas(scene, 'flag', 80, 142, drawFlag)
  canvas(scene, 'heart', 32, 32, (ctx) => {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(16, 28)
    ctx.bezierCurveTo(-6, 14, 6, -2, 16, 9)
    ctx.bezierCurveTo(26, -2, 38, 14, 16, 28)
    ctx.fill()
  })
  canvas(scene, 'spark', 16, 16, (ctx) => {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(8, 8, 8, 0, Math.PI * 2)
    ctx.fill()
  })
  canvas(scene, 'glow', 128, 128, (ctx) => {
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 128)
  })
}

export function background(scene, [c1, c2], tint = 0x7dd3fc) {
  const key = `bg${c1}${c2}`
  canvas(scene, key, 8, H, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 8, H)
  })
  scene.add.image(W / 2, H / 2, key).setDisplaySize(W, H).setDepth(-100)
  scene.add
    .particles(0, 0, 'spark', {
      x: { min: 0, max: W },
      y: H + 10,
      speedY: { min: -60, max: -20 },
      speedX: { min: -10, max: 10 },
      lifespan: 9000,
      scale: { start: 0.4, end: 0.1 },
      alpha: { start: 0.35, end: 0 },
      frequency: 240,
      tint,
    })
    .setDepth(-90)
}

export function button(scene, x, y, label, fn, { w = 200, h = 54, size = 22, color = 0x0284c7, textColor = '#fff' } = {}) {
  const box = scene.add.container(x, y)
  const bg = scene.add.graphics()
  const draw = (fill, alpha) => {
    bg.clear()
    bg.fillStyle(fill, alpha).fillRoundedRect(-w / 2, -h / 2, w, h, 14)
    bg.lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(-w / 2, -h / 2, w, h, 14)
  }
  draw(color, 0.92)
  const t = scene.add.text(0, 0, label, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color: textColor }).setOrigin(0.5)
  box.add([bg, t])
  box.setSize(w, h).setInteractive({ useHandCursor: true })
  box.on('pointerover', () => draw(color, 1))
  box.on('pointerout', () => draw(color, 0.92))
  box.on('pointerdown', () => {
    scene.tweens.add({ targets: box, scale: 0.94, duration: 70, yoyo: true })
    fn()
  })
  box.setLabel = (s) => t.setText(s)
  return box
}

export const text = (scene, x, y, str, size = 22, color = '#fff', extra = {}) =>
  scene.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, ...extra })

export function fade(scene, to, data) {
  scene.input.enabled = false
  scene.cameras.main.fadeOut(220, 4, 20, 36)
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(to, data))
}

