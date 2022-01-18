$(document).ready(function() {

  const WORLD_WIDTH = 100
  const WORLD_HEIGHT = 30

  const SPEED = 0.05
  const SPEED_SCALE_INCREASE = 0.00001

  const JUMP_SPEED = 0.45
  const GRAVITY = 0.0015
  const DINO_FRAME_COUNT = 2
  const FRAME_TIME = 100
  
  const CACTUS_INTERVAL_MIN = 500
  const CACTUS_INTERVAL_MAX = 2000

  const worldElem = document.querySelector('[data-world]')
  const groundElems = document.querySelectorAll('[data-ground]')
  const scoreElem = document.querySelector('[data-score]')
  const startScreenElem = document.querySelector('[data-start-screen]')
  const dinoElem = document.querySelector('[data-dino]')

  // load images
  let images = $('.world img, .imgload img'),
      preloaded = 0,
      total = images.length;
  images.on("load", function() {
    if (++preloaded === total) {
      console.log("loaded")
    }
  });

  // update
  let lastTime
  let speedScale
  let score = 0

  // cactus
  let nextCactusTime
  
  // dino
  let isJumping
  let dinoFrame
  let currentFrameTime
  let yVelocity


  // initialize
  setPixelToWorldScale()
  $(window).resize(setPixelToWorldScale)
  document.addEventListener("keydown", handleStart, { once: true })
  document.addEventListener("touchstart", handleStart, { once: true })
  

  
  function update(time) {
    if (lastTime == null) {
      lastTime = time
      window.requestAnimationFrame(update)
      return
    }
    const delta = time - lastTime

    updateGround(delta, speedScale)
    updateDino(delta, speedScale)
    updateCactus(delta, speedScale)
    updateSpeedScale(delta)
    updateScore(delta)
    if (checkLose()) return handleLose()

    lastTime = time
    window.requestAnimationFrame(update)
  }

  function checkLose() {
    const dinoRect = getDinoRect()
    return getCactusRects().some(rect => isCollision(rect, dinoRect))
  }

  function isCollision(rect1, rect2) {
    return (
      rect1.left < rect2.right &&
      rect1.top < rect2.bottom &&
      rect1.right > rect2.left &&
      rect1.bottom > rect2.top
    )
  }

  function updateSpeedScale(delta) {
    speedScale += delta * SPEED_SCALE_INCREASE
  }

  function updateScore(delta) {
    score += delta *0.01
    scoreElem.textContent = Math.floor(score)
  }

  function handleStart() {
    lastTime = null
    speedScale = 1
    score = 0
    setupGround()
    setupDino()
    setupCactus()
    startScreenElem.classList.add("hide")
    window.requestAnimationFrame(update)
  }

  function handleLose() {
    setDinoLose()
    setTimeout(() => {
      document.addEventListener("keydown", handleStart, { once: true })
      document.addEventListener("touchstart", handleStart, { once: true })
      startScreenElem.classList.remove("hide")
    }, 100)
  }


  // Cactus
  function setupCactus() {
    nextCactusTime = CACTUS_INTERVAL_MIN
    document.querySelectorAll("[data-cactus]").forEach(cactus => {
      cactus.remove()
    })
  }

  function updateCactus(delta, speedScale) {
    document.querySelectorAll("[data-cactus]").forEach(cactus => {
      incrementCustomProperty(cactus, "--left", delta * speedScale * SPEED * -1)
      if (getCustomProperty(cactus, "--left") <= -100) {
        cactus.remove()
      }
    })

    if (nextCactusTime <= 0) {
      createCactus()
      nextCactusTime =
        randomNumberBetween(CACTUS_INTERVAL_MIN, CACTUS_INTERVAL_MAX) / speedScale
    }
    nextCactusTime -= delta
  }

  function getCactusRects() {
    return [...document.querySelectorAll("[data-cactus]")].map(cactus => {
      return cactus.getBoundingClientRect()
    })
  }

  function createCactus() {
    const cactus = document.createElement("img")
    cactus.dataset.cactus = true
    cactus.src = "images/cactus.png"
    cactus.classList.add("cactus")
    setCustomProperty(cactus, "--left", 100)
    worldElem.append(cactus)
  }

  function randomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }


  // Dino setup and update
  function setupDino() {
    isJumping = false
    dinoFrame = 0
    currentFrameTime = 0
    yVelocity = 0
    setCustomProperty(dinoElem, '--bottom', 0)
    document.removeEventListener("keydown", onJump)
    document.removeEventListener("touchmove", onJumpMobile)
    document.addEventListener("keydown", onJump)
    document.addEventListener("touchmove", onJumpMobile)
  }

  function updateDino(delta, speedScale) {
    handleRun(delta, speedScale)
    handleJump(delta)
  }

  function getDinoRect() {
    return dinoElem.getBoundingClientRect()
  }

  function setDinoLose() {
    dinoElem.src = `images/dino-lose.png`
  }

  function handleRun(delta, speedScale) {
    if (isJumping) {
      dinoElem.src = `images/dino-stationary.png`
      return
    }

    if (currentFrameTime >= FRAME_TIME) {
      dinoFrame = (dinoFrame + 1) % DINO_FRAME_COUNT
      dinoElem.src = `images/dino-run-${dinoFrame}.png`
      currentFrameTime -= FRAME_TIME
    }
    currentFrameTime += delta * speedScale
  }

  function handleJump(delta) {
    if (!isJumping) return

    incrementCustomProperty(dinoElem, "--bottom", yVelocity * delta)

    if (getCustomProperty(dinoElem, "--bottom") <= 0) {
      setCustomProperty(dinoElem, "--bottom", 0)
      isJumping = false
    }

    yVelocity -= GRAVITY * delta
  }

  function onJump(e) {
    if (e.code !== "Space" || isJumping) return

    yVelocity = JUMP_SPEED
    isJumping = true
  }
  function onJumpMobile(e) {
    if (isJumping) return

    yVelocity = JUMP_SPEED
    isJumping = true
  }


  // Ground setup and update
  function setupGround() {
    setCustomProperty(groundElems[0], '--left', 0)
    setCustomProperty(groundElems[1], '--left', 300)
  }

  function updateGround(delta, speedScale) {
    Array.from(groundElems).forEach(ground => {
      incrementCustomProperty(ground, "--left", delta * speedScale * speedScale * SPEED * -1)

      if (getCustomProperty(ground, "--left") <= -300) {
        incrementCustomProperty(ground, "--left", 600)
      }
    })
  }


  // World Scale
  function setPixelToWorldScale(){
    let worldToPixelScale
    if((window.innerWidth / window.innerHeight) < (WORLD_WIDTH / WORLD_HEIGHT)) {
      worldToPixelScale = window.innerWidth / WORLD_WIDTH
    } else {
      worldToPixelScale = window.innerHeight / WORLD_HEIGHT
    }
    worldElem.style.width = `${WORLD_WIDTH * worldToPixelScale}px`
    worldElem.style.height = `${WORLD_HEIGHT * worldToPixelScale}px`
    console.log("worldToPixelScale "+worldToPixelScale)
  }


  // Custom Property
  function getCustomProperty(elem, prop) {
    return parseFloat(getComputedStyle(elem).getPropertyValue(prop)) || 0
  }
  function setCustomProperty(elem, prop, value) {
    elem.style.setProperty(prop, value)
  }
  function incrementCustomProperty(elem, prop, inc) {
    setCustomProperty(elem, prop, getCustomProperty(elem, prop) + inc)
  }
})