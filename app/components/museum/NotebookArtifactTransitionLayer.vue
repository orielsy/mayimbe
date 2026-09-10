<script setup lang="ts">
import { computed } from 'vue'
import NotebookCoverFront from '~/components/notebook/NotebookCoverFront.vue'
import { NOTEBOOK_BOOKMARKS } from '~/components/notebook/notebookTargets'
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

        <div class="museum-notebook-transition-bookmarks">
          <span
            v-for="bookmark in NOTEBOOK_BOOKMARKS"
            :key="bookmark.target"
            class="museum-notebook-transition-bookmark"
          >
            <span>{{ bookmark.label }}</span>
          </span>
        </div>
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
  overflow: visible;
  border-radius: 3px 6px 6px 3px;
  container-type: inline-size;
  transform-origin: center center;
  will-change: left, top, width, height, transform, box-shadow;
  box-shadow: 0 16px 22px rgba(0, 0, 0, .48);
  transition-property: left, top, width, height, transform, box-shadow;
  transition-timing-function: cubic-bezier(.2, .72, .2, 1);
}

.museum-notebook-transition-artifact :deep(.pn-cover) {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.museum-notebook-transition-bookmarks {
  position: absolute;
  top: auto;
  bottom: -.9rem;
  left: 2%;
  right: 2%;
  z-index: 0;
  display: flex;
  flex-direction: row;
  gap: .28rem;
  align-items: stretch;
  opacity: 0;
  transform: translateX(-.2rem);
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

.museum-notebook-transition-bookmark {
  box-sizing: border-box;
  flex: 1 1 0;
  width: auto;
  min-width: 0;
  min-height: 2.25rem;
  padding: .72rem .3rem .45rem;
  border: 1px solid rgba(75, 52, 30, .48);
  border-radius: 0 0 .42rem .42rem;
  background:
    linear-gradient(90deg, rgba(255, 250, 226, .22), transparent 38%),
    #b99a67;
  box-shadow:
    -2px 2px 5px rgba(42, 28, 15, .2),
    inset 0 0 0 1px rgba(255, 245, 211, .14);
  color: #493722;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: .02em;
  line-height: 1.05;
  text-align: center;
  text-transform: uppercase;
  writing-mode: horizontal-tb;
  text-orientation: mixed;
}

.museum-notebook-transition-bookmark:nth-child(2) { background-color: #aa895d; }
.museum-notebook-transition-bookmark:nth-child(3) { background-color: #c2a878; }
.museum-notebook-transition-bookmark:nth-child(4) { background-color: #9d8059; }

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

.is-start.is-putdown .museum-notebook-transition-bookmarks {
  opacity: 1;
  transform: translateX(0);
  transition: none;
}

.is-lift .museum-notebook-transition-artifact {
  transition-duration: 180ms;
  box-shadow: 0 38px 56px rgba(0, 0, 0, .32);
}

.is-lift .museum-notebook-transition-veil {
  opacity: .72;
  backdrop-filter: blur(1.5px);
}

.is-lift.is-putdown .museum-notebook-transition-bookmarks {
  opacity: .35;
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

.is-travel.is-putdown .museum-notebook-transition-bookmarks {
  opacity: 0;
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

.is-settle.is-pickup .museum-notebook-transition-bookmarks {
  opacity: 1;
  transform: translateX(0);
}

.is-settle .museum-notebook-transition-veil {
  opacity: 0;
  backdrop-filter: blur(0);
  transition-duration: 140ms;
}

@media (min-width: 900px) {
  .museum-notebook-transition-bookmarks {
    top: 12%;
    bottom: auto;
    right: auto;
    left: calc(100% - .9rem);
    width: 7.25rem;
    gap: .5rem;
    flex-direction: column;
    align-items: stretch;
  }

  .museum-notebook-transition-bookmark {
    flex: none;
    width: 100%;
    min-width: 0;
    min-height: 1.9rem;
    padding: .4rem .75rem .4rem 1rem;
    border-right: 1px solid rgba(75, 52, 30, .48);
    border-left: 0;
    border-radius: .42rem;
    font-size: .9rem;
    letter-spacing: .04em;
    writing-mode: horizontal-tb;
    text-orientation: mixed;
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .museum-notebook-transition-layer {
    display: none;
  }
}
</style>