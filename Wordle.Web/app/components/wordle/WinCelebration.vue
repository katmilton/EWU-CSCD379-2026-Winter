<template>
  <div class="win-overlay" :class="{ hiding: hiding }" role="dialog" aria-live="polite">
    <canvas ref="canvasRef" class="confetti-canvas"></canvas>
    <div class="win-content">
      <h1 class="win-title">Congrats!</h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({ duration: { type: Number, default: 1200 } })
const emit = defineEmits(['closed'])

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let particles: any[] = []
const hiding = ref(false)

function rand(min:number, max:number) { return Math.random() * (max - min) + min }

function makeParticles(w:number, h:number) {
  particles = []
  const count = 120
  const colors = ['#FF5A5F','#FFB400','#00A699','#7B61FF','#FF6F91','#00C2A8']
  for (let i = 0; i < count; i++) {
    const size = rand(6, 14)
    particles.push({
      x: w/2 + rand(-w*0.15, w*0.15),
      y: h*0.25 + rand(-20,20),
      vx: rand(-6,6),
      vy: rand(-8, -2),
      ax: 0,
      ay: 0.18,
      size,
      spin: rand(-0.2,0.2),
      rot: rand(0,Math.PI*2),
      color: colors[Math.floor(Math.random()*colors.length)],
      ttl: rand(1800, 2600),
      age: 0,
      opacity: 1,
    })
  }
}

function draw() {
  if (!ctx || !canvasRef.value) return
  const c = canvasRef.value
  ctx.clearRect(0,0,c.width, c.height)
  for (const p of particles) {
    p.vy += p.ay
    p.x += p.vx
    p.y += p.vy
    p.rot += p.spin
    p.age += 16
    p.opacity = Math.max(0, 1 - p.age / p.ttl)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.globalAlpha = p.opacity
    ctx.fillStyle = p.color
    ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6)
    ctx.restore()
  }
}

function animate() {
  draw()
  raf = requestAnimationFrame(animate)
}

function resizeCanvas() {
  const c = canvasRef.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  c.width = Math.floor(c.clientWidth * dpr)
  c.height = Math.floor(c.clientHeight * dpr)
  ctx = c.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)
}

function start() {
  const c = canvasRef.value!
  resizeCanvas()
  makeParticles(c.clientWidth, c.clientHeight)
  animate()
  playClap()
  setTimeout(() => {
    hiding.value = true
    setTimeout(() => emit('closed'), 450)
  }, props.duration)
}

function stop() {
  if (raf) cancelAnimationFrame(raf)
}

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.style.width = '100%'
    canvasRef.value.style.height = '100%'
  }
  start()
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  stop()
  window.removeEventListener('resize', resizeCanvas)
})

function playClap() {
  try {
    const A = window.AudioContext || (window as any).webkitAudioContext
    const actx = new (A)()
    const bufferSize = Math.floor(actx.sampleRate * 0.18)
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random()*2 - 1) * (1 - i / bufferSize)
    const s = actx.createBufferSource()
    s.buffer = buffer
    const g = actx.createGain(); g.gain.value = 0.8
    s.connect(g).connect(actx.destination)
    s.start(0)
    setTimeout(() => {
      const buffer2 = actx.createBuffer(1, Math.floor(actx.sampleRate*0.12), actx.sampleRate)
      const data2 = buffer2.getChannelData(0)
      for (let i=0;i<data2.length;i++) data2[i] = (Math.random()*2-1) * (1 - i/data2.length) * 0.6
      const s2 = actx.createBufferSource()
      s2.buffer = buffer2
      const g2 = actx.createGain(); g2.gain.value = 0.5
      s2.connect(g2).connect(actx.destination)
      s2.start(0)
    }, 70)
  } catch (e) {
    // ignore audio failures (autoplay policies may block until user interaction)
  }
}
</script>

<style scoped>
.win-overlay {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1400;
  opacity: 1;
  transition: opacity 150ms linear;
}
.win-overlay.hiding { opacity: 0; }
.confetti-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.win-content { pointer-events: auto; position: relative; z-index: 2; text-align: center; }
.win-title { font-size: 5rem; color: red; text-shadow: grey 0 6px 18px; margin: 0; }
</style>
