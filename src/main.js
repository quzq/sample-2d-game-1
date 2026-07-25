// sample-2d-game-1
//
// This is intentionally a plain Web Canvas game.
// No framework. No engine. No build step.
//
// The goal is to make a small game that runs in the browser first,
// then later test how easily it can be wrapped by capacitor-canvas-game-kit.

const LOGICAL_WIDTH = 256
const LOGICAL_HEIGHT = 240

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

// Keep the game world in logical pixels.
// The CSS can scale the canvas, but the game still thinks in 256x240.
canvas.width = LOGICAL_WIDTH
canvas.height = LOGICAL_HEIGHT

const keys = new Set()

window.addEventListener('keydown', (event) => {
  keys.add(event.code)

  // Prevent Space from scrolling the page.
  if (event.code === 'Space') {
    event.preventDefault()
  }
})

window.addEventListener('keyup', (event) => {
  keys.delete(event.code)
})

function readInput() {
  return {
    left: keys.has('ArrowLeft') || keys.has('KeyA'),
    right: keys.has('ArrowRight') || keys.has('KeyD'),
    jump: keys.has('Space') || keys.has('KeyZ'),
    restart: keys.has('KeyR'),
    pause: keys.has('KeyP'),
  }
}

function createSvgImage(svg) {
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return image
}

// These tiny SVG sprites are embedded on purpose.
// The sample remains a plain Web Canvas game with no asset pipeline.
// Later, the mobile wrapper can still treat it like a normal Canvas game.
const penguinRunImage = createSvgImage(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 20">
  <rect width="16" height="20" fill="none"/>
  <ellipse cx="8" cy="10" rx="6" ry="8" fill="#202838"/>
  <ellipse cx="8" cy="11" rx="4" ry="6" fill="#f4f1df"/>
  <circle cx="6" cy="6" r="1" fill="#f5f5f5"/>
  <circle cx="10" cy="6" r="1" fill="#f5f5f5"/>
  <rect x="7" y="7" width="2" height="1" fill="#f59f28"/>
  <path d="M2 11 L0 15 L4 14 Z" fill="#202838"/>
  <path d="M14 11 L16 15 L12 14 Z" fill="#202838"/>
  <rect x="4" y="18" width="3" height="1" fill="#f59f28"/>
  <rect x="9" y="18" width="3" height="1" fill="#f59f28"/>
</svg>`)

const penguinJumpImage = createSvgImage(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 20">
  <rect width="16" height="20" fill="none"/>
  <ellipse cx="8" cy="10" rx="6" ry="8" fill="#202838"/>
  <ellipse cx="8" cy="11" rx="4" ry="6" fill="#fff5d6"/>
  <circle cx="6" cy="6" r="1" fill="#f5f5f5"/>
  <circle cx="10" cy="6" r="1" fill="#f5f5f5"/>
  <rect x="7" y="7" width="2" height="1" fill="#ffb13b"/>
  <path d="M3 10 L0 7 L2 14 Z" fill="#202838"/>
  <path d="M13 10 L16 7 L14 14 Z" fill="#202838"/>
  <rect x="3" y="17" width="4" height="1" fill="#ffb13b"/>
  <rect x="9" y="17" width="4" height="1" fill="#ffb13b"/>
</svg>`)

const penguinFallImage = createSvgImage(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 20">
  <rect width="16" height="20" fill="none"/>
  <ellipse cx="8" cy="10" rx="6" ry="8" fill="#202838"/>
  <ellipse cx="8" cy="11" rx="4" ry="6" fill="#f4f1df"/>
  <circle cx="6" cy="6" r="1" fill="#f5f5f5"/>
  <circle cx="10" cy="6" r="1" fill="#f5f5f5"/>
  <rect x="7" y="7" width="2" height="1" fill="#f59f28"/>
  <path d="M2 12 L0 16 L5 15 Z" fill="#202838"/>
  <path d="M14 12 L16 16 L11 15 Z" fill="#202838"/>
  <rect x="4" y="18" width="3" height="1" fill="#f59f28"/>
  <rect x="9" y="18" width="3" height="1" fill="#f59f28"/>
</svg>`)

const rockImage = createSvgImage(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="none"/>
  <path d="M3 20 L2 13 L7 5 L15 3 L22 10 L21 20 Z" fill="#7b7f87"/>
  <path d="M7 5 L11 10 L2 13 Z" fill="#a5a9b0"/>
  <path d="M15 3 L22 10 L13 9 Z" fill="#8f949c"/>
  <path d="M7 20 L13 9 L21 20 Z" fill="#5f646b"/>
  <path d="M3 20 L7 13 L11 20 Z" fill="#6d7279"/>
</svg>`)

const player = {
  x: 34,
  y: 178,
  w: 10,
  h: 14,
  vx: 0,
  vy: 0,
  grounded: false,
  jumpWasDown: false,
}

const world = {
  time: 0,
  score: 0,
  bestScore: Number(localStorage.getItem('sample-2d-game-1.bestScore') || 0),
  speed: 54,
  spawnTimer: 0,
  coinTimer: 1.2,
  gameOver: false,
  paused: false,
  pauseWasDown: false,
  blocks: [],
  coins: [],
  dust: [],
}

function resetGame() {
  player.x = 34
  player.y = 178
  player.vx = 0
  player.vy = 0
  player.grounded = false
  player.jumpWasDown = false

  world.time = 0
  world.score = 0
  world.speed = 54
  world.spawnTimer = 0
  world.coinTimer = 1.2
  world.gameOver = false
  world.paused = false
  world.pauseWasDown = false
  world.blocks = []
  world.coins = []
  world.dust = []
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

function spawnBlock() {
  const height = 10 + Math.floor(Math.random() * 16)
  const width = 10 + Math.floor(Math.random() * 12)

  world.blocks.push({
    x: LOGICAL_WIDTH + 8,
    y: 192 - height,
    w: width,
    h: height,
  })
}

function spawnCoin() {
  world.coins.push({
    x: LOGICAL_WIDTH + 8,
    y: 120 + Math.floor(Math.random() * 48),
    w: 6,
    h: 6,
    taken: false,
  })
}

function addDust(x, y) {
  world.dust.push({ x, y, life: 0.25 })
}

function update(dt) {
  const input = readInput()

  if (input.pause && !world.pauseWasDown && !world.gameOver) {
    world.paused = !world.paused
  }
  world.pauseWasDown = input.pause

  if (world.gameOver) {
    if (input.restart) {
      resetGame()
    }
    return
  }

  if (world.paused) {
    return
  }

  world.time += dt
  world.score += dt * 10
  world.speed = 54 + world.time * 2.4

  // Horizontal movement is deliberately simple.
  // This makes the sample easy to move into a later InputState wrapper.
  const moveSpeed = 86
  player.vx = 0

  if (input.left) player.vx -= moveSpeed
  if (input.right) player.vx += moveSpeed

  const jumpDown = input.jump
  const justPressedJump = jumpDown && !player.jumpWasDown

  if (justPressedJump && player.grounded) {
    player.vy = -154
    player.grounded = false
    addDust(player.x + player.w / 2, player.y + player.h)
  }

  player.jumpWasDown = jumpDown

  // Gravity and ground collision.
  player.vy += 420 * dt
  player.x += player.vx * dt
  player.y += player.vy * dt

  player.x = Math.max(8, Math.min(LOGICAL_WIDTH - player.w - 8, player.x))

  const groundY = 192
  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h
    player.vy = 0
    player.grounded = true
  }

  world.spawnTimer -= dt
  if (world.spawnTimer <= 0) {
    spawnBlock()
    world.spawnTimer = Math.max(0.55, 1.35 - world.time * 0.018)
  }

  world.coinTimer -= dt
  if (world.coinTimer <= 0) {
    spawnCoin()
    world.coinTimer = 1.7 + Math.random() * 0.8
  }

  for (const block of world.blocks) {
    block.x -= world.speed * dt

    if (rectsOverlap(player, block)) {
      world.gameOver = true
      world.bestScore = Math.max(world.bestScore, Math.floor(world.score))
      localStorage.setItem('sample-2d-game-1.bestScore', String(world.bestScore))
    }
  }

  world.blocks = world.blocks.filter((block) => block.x + block.w > -8)

  for (const coin of world.coins) {
    coin.x -= world.speed * dt

    if (!coin.taken && rectsOverlap(player, coin)) {
      coin.taken = true
      world.score += 100
    }
  }

  world.coins = world.coins.filter((coin) => !coin.taken && coin.x + coin.w > -8)

  for (const dust of world.dust) {
    dust.life -= dt
    dust.x -= 18 * dt
    dust.y += 8 * dt
  }
  world.dust = world.dust.filter((dust) => dust.life > 0)
}

function drawPixelText(text, x, y, align = 'left') {
  ctx.font = '8px monospace'
  ctx.textBaseline = 'top'
  ctx.textAlign = align
  ctx.fillText(text, x, y)
}

function getPlayerImage() {
  if (player.grounded) return penguinRunImage
  if (player.vy < 0) return penguinJumpImage
  return penguinFallImage
}

function drawPlayer() {
  const image = getPlayerImage()

  if (image.complete) {
    ctx.drawImage(image, player.x - 3, player.y - 5, 16, 20)
    return
  }

  // Fallback for the first frame before the embedded SVG finishes decoding.
  ctx.fillStyle = '#202838'
  ctx.fillRect(player.x, player.y, player.w, player.h)
}

function drawRock(block) {
  if (rockImage.complete) {
    ctx.drawImage(rockImage, block.x - 2, block.y - 2, block.w + 4, block.h + 4)
    return
  }

  ctx.fillStyle = '#7b7f87'
  ctx.fillRect(block.x, block.y, block.w, block.h)
}

function render() {
  ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)

  // Sky.
  ctx.fillStyle = '#111a33'
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)

  // Far simple background.
  ctx.fillStyle = '#1d2a4d'
  for (let i = 0; i < 8; i += 1) {
    const x = (i * 44 - (world.time * 10) % 44) | 0
    ctx.fillRect(x, 148, 28, 44)
  }

  // Ground.
  ctx.fillStyle = '#4c3a24'
  ctx.fillRect(0, 192, LOGICAL_WIDTH, 48)
  ctx.fillStyle = '#7a5c35'
  ctx.fillRect(0, 192, LOGICAL_WIDTH, 4)

  // Dust.
  ctx.fillStyle = '#c9b07a'
  for (const dust of world.dust) {
    ctx.globalAlpha = Math.max(0, dust.life / 0.25)
    ctx.fillRect(dust.x - 1, dust.y - 1, 2, 2)
  }
  ctx.globalAlpha = 1

  // Player.
  drawPlayer()

  // Obstacles.
  for (const block of world.blocks) {
    drawRock(block)
  }

  // Coins.
  ctx.fillStyle = '#ffd54a'
  for (const coin of world.coins) {
    ctx.fillRect(coin.x + 1, coin.y, 4, 6)
    ctx.fillRect(coin.x, coin.y + 1, 6, 4)
  }

  // HUD.
  ctx.fillStyle = '#f5f5f5'
  drawPixelText(`SCORE ${Math.floor(world.score)}`, 8, 8)
  drawPixelText(`BEST ${world.bestScore}`, LOGICAL_WIDTH - 8, 8, 'right')

  if (world.paused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
    ctx.fillStyle = '#f5f5f5'
    drawPixelText('PAUSED', LOGICAL_WIDTH / 2, 104, 'center')
    drawPixelText('PRESS P TO RESUME', LOGICAL_WIDTH / 2, 120, 'center')
  }

  if (world.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)'
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
    ctx.fillStyle = '#f5f5f5'
    drawPixelText('GAME OVER', LOGICAL_WIDTH / 2, 96, 'center')
    drawPixelText(`SCORE ${Math.floor(world.score)}`, LOGICAL_WIDTH / 2, 112, 'center')
    drawPixelText('PRESS R TO RESTART', LOGICAL_WIDTH / 2, 132, 'center')
  }
}

let lastTime = performance.now()

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000)
  lastTime = now

  update(dt)
  render()

  requestAnimationFrame(frame)
}

resetGame()
requestAnimationFrame(frame)
