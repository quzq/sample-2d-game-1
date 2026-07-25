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
  ctx.fillStyle = player.grounded ? '#f6d365' : '#fda085'
  ctx.fillRect(player.x, player.y, player.w, player.h)
  ctx.fillStyle = '#241915'
  ctx.fillRect(player.x + 6, player.y + 4, 2, 2)

  // Obstacles.
  ctx.fillStyle = '#d84a4a'
  for (const block of world.blocks) {
    ctx.fillRect(block.x, block.y, block.w, block.h)
    ctx.fillStyle = '#9c2626'
    ctx.fillRect(block.x, block.y, block.w, 3)
    ctx.fillStyle = '#d84a4a'
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
