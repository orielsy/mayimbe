<script setup lang="ts">
import { computed, ref } from 'vue'
import MuseumDesk from './MuseumDesk.vue'
import NotebookExhibit from './NotebookExhibit.vue'

interface NotebookExhibitHandle {
  closeForDesk: () => Promise<void>
}

const { state } = useMuseum()
const { go } = useMuseumNavigator()
const { locale, switchLocale } = useSiteLocale()
const { putDown } = useNotebookArtifactTransition()

const notebookExhibit = ref<NotebookExhibitHandle | null>(null)
const returningToDesk = ref(false)

const copy = computed(() => locale.value === 'es'
  ? {
      stage: 'Museo Mayimbe',
      returnDesk: 'Volver al escritorio del museo',
      desk: 'Escritorio',
      language: 'Idioma',
      unavailableEyebrow: 'Exhibición no disponible',
      unavailable: 'Este objeto todavía no forma parte de la versión activa del museo.',
    }
  : {
      stage: 'Mayimbe museum shell',
      returnDesk: 'Return to museum desk',
      desk: 'Desk',
      language: 'Language',
      unavailableEyebrow: 'Unavailable exhibit',
      unavailable: 'This object is not part of the active museum build yet.',
    })

const activeTarget = computed(() => (
  state.value.destination.kind === 'exhibit'
    ? state.value.destination.target
    : undefined
))

const isFocused = computed(() => Boolean(state.value.activeExhibit))

async function returnToDesk() {
  if (returningToDesk.value) return
  returningToDesk.value = true

  try {
    if (state.value.activeExhibit === 'notebook') {
      await notebookExhibit.value?.closeForDesk()
      await putDown()
      return
    }

    await go({ kind: 'desk' })
  } finally {
    returningToDesk.value = false
  }
}
</script>

<template>
  <section
    class="museum-stage"
    :class="{ 'museum-stage--focused': isFocused }"
    :aria-label="copy.stage"
  >
    <div class="museum-language" role="group" :aria-label="copy.language">
      <button
        type="button"
        class="museum-language__choice"
        :aria-pressed="locale === 'es'"
        @click="switchLocale('es')"
      >
        ES
      </button>
      <span aria-hidden="true" class="museum-language__divider">·</span>
      <button
        type="button"
        class="museum-language__choice"
        :aria-pressed="locale === 'en'"
        @click="switchLocale('en')"
      >
        EN
      </button>
    </div>

    <MuseumDesk v-if="!isFocused" />

    <button
      v-if="isFocused"
      type="button"
      class="museum-return"
      :aria-label="copy.returnDesk"
      :disabled="returningToDesk"
      @click="returnToDesk"
    >
      <span aria-hidden="true">←</span>
      <span>{{ copy.desk }}</span>
    </button>

    <NotebookExhibit
      v-if="state.activeExhibit === 'notebook'"
      ref="notebookExhibit"
      :target="activeTarget"
      @request-desk="returnToDesk"
    />

    <div v-else-if="isFocused" class="exhibit-placeholder">
      <p class="eyebrow">{{ copy.unavailableEyebrow }}</p>
      <h2>{{ copy.unavailable }}</h2>
    </div>
  </section>
</template>

<style scoped>
.museum-language {
  position: absolute;
  top: .75rem;
  right: .75rem;
  z-index: 31;
  display: inline-flex;
  align-items: center;
  gap: .28rem;
  min-height: 2.3rem;
  padding: .35rem .55rem;
  border: 1px solid rgba(229, 210, 179, .12);
  border-radius: 999px;
  background: rgba(18, 13, 9, .38);
  backdrop-filter: blur(8px);
}

.museum-language__choice {
  padding: .1rem .15rem;
  border: 0;
  background: transparent;
  color: rgba(241, 234, 223, .52);
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .1em;
  cursor: pointer;
  transition: color 140ms ease, opacity 140ms ease;
}

.museum-language__choice[aria-pressed='true'] {
  color: rgba(241, 234, 223, .96);
}

.museum-language__choice:hover,
.museum-language__choice:focus-visible {
  color: #fff;
}

.museum-language__choice:focus-visible {
  outline: 1px solid #d8c39a;
  outline-offset: 2px;
}

.museum-language__divider {
  color: rgba(241, 234, 223, .3);
}

@media (max-width: 640px) {
  .museum-language {
    top: .45rem;
    right: .45rem;
    min-height: 2rem;
    padding: .25rem .45rem;
  }
}
</style>
