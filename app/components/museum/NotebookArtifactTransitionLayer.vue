<script setup lang="ts">
import { computed } from 'vue'
import NotebookCoverFront from '~/components/notebook/NotebookCoverFront.vue'
import '~/assets/css/notebook-page-turner.css'

const { state, active } = useNotebookArtifactTransition()

const useTargetRect = computed(() => (
  state.value.phase === 'travel' || state.value.phase === 'settle'
))

const currentRect = computed(() => (
  useTargetRect.value && state.value.to
    ? state.value.to
    : state.value.from
))

const presentation = computed<'full' | 'desk'>(() => {
  if (state.value.direction === 'pickup') {
    return state.value.phase === 'start' || state.value.phase === 'lift'
      ? 'desk'
      : 'full'
  }

  if (state.value.direction === 'putdown') {
    return state.value.phase === 'travel' || state.value.phase === 'settle'
      ? 'desk'
      : 'full'
  }

  return 'full'
})

const artifactStyle = computed(() => {
  const rect = currentRect.value
  if (!rect) return undefined

  let rotation = rect.rotation
  let transform = `rotate(${rotation}deg)`

  if (state.value.phase === 'lift') {
    if (state.value.direction === 'pickup') {
      rotation *= 0.5
      transform = `translateY(-14px) scale(1.025) rotate(${rotation}deg)`
    } else {
      transform = `translateY(-8px) scale(1.015) rotate(${rotation}deg)`
    }
  } else if (state.value.phase === 'travel' && state.value.direction === 'putdown') {
    transform = `translateY(-5px) scale(1.01) rotate(${rotation}deg)`
  }

  return {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform,
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="active && state.from"
      :class="[
        'museum-notebook-transition-layer',
        `is-${state.phase}`,
        state.direction ? `is-${state.direction}` : null,
      ]"
      aria-hidden="true"
    >
      <div class="museum-notebook-transition-veil" />
      <div
        class="museum-notebook-transition-artifact"
        :style="artifactStyle"
      >
        <NotebookCoverFront :presentation="presentation" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.museum-notebook-transition-layer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
}

.museum-notebook-transition-veil {
  position: absolute;
  inset: 0;
  background: rgba(11, 7, 5, .72);
  opacity: 0;
  backdrop-filter: blur(0);
  transition:
    opacity 180ms ease,
    backdrop-filter 180ms ease;
}

.museum-notebook-transition-artifact {
  --cover-foil: oklch(0.79 0.075 78);
  --cover-foil-highlight: oklch(0.9 0.055 83);
  --cover-foil-shadow: oklch(0.2 0.035 55);
  position: absolute;
  overflow: hidden;
  border-radius: 3px 6px 6px 3px;
  container-type: inline-size;
  transform-origin: center center;
  will-change: left, top, width, height, transform, box-shadow;
  box-shadow: 0 16px 22px rgba(0, 0, 0, .48);
  transition-property: left, top, width, height, transform, box-shadow;
  transition-timing-function: cubic-bezier(.2, .72, .2, 1);
}

.museum-notebook-transition-artifact :deep(.pn-cover) {
  width: 100%;
  height: 100%;
}

.is-start .museum-notebook-transition-artifact,
.is-start .museum-notebook-transition-veil {
  transition: none;
}

/* Match the shadow of the exact artifact that the overlay replaces. */
.is-start.is-pickup .museum-notebook-transition-artifact {
  box-shadow: 0 26px 28px rgba(0, 0, 0, .52);
}

.is-start.is-putdown .museum-notebook-transition-artifact {
  box-shadow: 0 34px 48px rgba(0, 0, 0, .6);
}

.is-lift .museum-notebook-transition-artifact {
  transition-duration: 180ms;
  box-shadow: 0 38px 56px rgba(0, 0, 0, .32);
}

.is-lift .museum-notebook-transition-veil {
  opacity: .72;
  backdrop-filter: blur(1.5px);
}

.is-travel .museum-notebook-transition-artifact {
  transition-duration: 540ms;
}

.is-travel.is-pickup .museum-notebook-transition-artifact {
  box-shadow: 0 42px 62px rgba(0, 0, 0, .3);
}

.is-travel.is-putdown .museum-notebook-transition-artifact {
  box-shadow: 0 20px 28px rgba(0, 0, 0, .4);
}

.is-travel .museum-notebook-transition-veil {
  opacity: .5;
  backdrop-filter: blur(1px);
  transition-duration: 540ms;
}

.is-settle .museum-notebook-transition-artifact {
  transition-duration: 140ms;
}

/* Land on the same shadow values as the destination artifact. */
.is-settle.is-putdown .museum-notebook-transition-artifact {
  box-shadow: 0 26px 28px rgba(0, 0, 0, .52);
}

.is-settle.is-pickup .museum-notebook-transition-artifact {
  box-shadow: 0 34px 48px rgba(0, 0, 0, .6);
}

.is-settle .museum-notebook-transition-veil {
  opacity: 0;
  backdrop-filter: blur(0);
  transition-duration: 140ms;
}

@media (prefers-reduced-motion: reduce) {
  .museum-notebook-transition-layer {
    display: none;
  }
}
</style>
