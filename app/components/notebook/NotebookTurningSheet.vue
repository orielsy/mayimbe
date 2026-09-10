<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import NotebookTurnFace from './NotebookTurnFace.vue'
import type { NotebookTurn } from './notebookMachine'

const COVER_MS = 620
const PAGE_MS = 460

const props = defineProps<{
  turn: NotebookTurn
  reduced: boolean
}>()

const emit = defineEmits<{
  done: [key: number]
}>()

const leafRef = ref<HTMLDivElement | null>(null)
const shadeRef = ref<HTMLSpanElement | null>(null)

let timer: number | null = null
let leafAnimation: Animation | null = null
let shadeAnimation: Animation | null = null
let disposed = false
let finished = false

const leaf = computed(() =>
  props.turn.kind === 'open' || props.turn.kind === 'close'
    ? -1
    : props.turn.kind === 'backward'
      ? props.turn.to
      : props.turn.from,
)

const startDeg = computed(() =>
  props.turn.kind === 'close'
    ? -180
    : props.turn.kind === 'backward'
      ? -180
      : 0,
)

function finish() {
  if (disposed || finished) return
  finished = true
  emit('done', props.turn.key)
}

onMounted(() => {
  const element = leafRef.value
  const isCover = props.turn.kind === 'open' || props.turn.kind === 'close'
  const duration = props.reduced ? 0 : isCover ? COVER_MS : PAGE_MS

  if (!element || duration === 0) {
    finish()
    return
  }

  const from = props.turn.kind === 'open'
    ? 0
    : props.turn.kind === 'close'
      ? -180
      : props.turn.kind === 'forward'
        ? 0
        : -180

  const to = props.turn.kind === 'open'
    ? -180
    : props.turn.kind === 'close'
      ? 0
      : props.turn.kind === 'forward'
        ? -180
        : 0

  leafAnimation = element.animate(
    [{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }],
    {
      duration,
      easing: 'cubic-bezier(0.34, 0.08, 0.2, 1)',
      fill: 'forwards',
    },
  )

  shadeAnimation = shadeRef.value?.animate(
    [{ opacity: 0 }, { opacity: 0.75, offset: 0.5 }, { opacity: 0 }],
    { duration, easing: 'linear', fill: 'forwards' },
  ) ?? null

  leafAnimation.onfinish = finish
  timer = window.setTimeout(finish, duration + 300)
})

onBeforeUnmount(() => {
  disposed = true
  if (timer !== null) window.clearTimeout(timer)
  leafAnimation?.cancel()
  shadeAnimation?.cancel()
})
</script>

<template>
  <div
    ref="leafRef"
    :data-turning="turn.kind"
    class="pn-turn"
    :style="{ transform: `rotateY(${startDeg}deg)` }"
    aria-hidden="true"
  >
    <NotebookTurnFace :index="leaf" pad-page />
    <NotebookTurnFace :index="leaf" back pad-page />
    <span ref="shadeRef" class="pn-turn-shade" />
  </div>
</template>
