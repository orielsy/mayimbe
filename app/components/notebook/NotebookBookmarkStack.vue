<script setup lang="ts">
interface NotebookBookmark {
  target: string
  label: string
}

const props = withDefaults(defineProps<{
  bookmarks?: readonly NotebookBookmark[]
  activeBookmark?: string
  disabled?: boolean
  interactive?: boolean
  ariaLabel?: string
}>(), {
  bookmarks: () => [],
  disabled: false,
  interactive: true,
  ariaLabel: 'Notebook sections',
})

const emit = defineEmits<{
  select: [target: string]
}>()
</script>

<template>
  <nav
    v-if="interactive && props.bookmarks.length"
    class="pn-bookmarks"
    :aria-label="ariaLabel"
  >
    <button
      v-for="bookmark in props.bookmarks"
      :key="bookmark.target"
      type="button"
      :class="[
        'pn-bookmark',
        { 'is-active': activeBookmark === bookmark.target },
      ]"
      :aria-current="activeBookmark === bookmark.target ? 'page' : undefined"
      :disabled="disabled"
      @click.stop="emit('select', bookmark.target)"
    >
      <span>{{ bookmark.label }}</span>
    </button>
  </nav>

  <div
    v-else-if="props.bookmarks.length"
    class="pn-bookmarks"
    aria-hidden="true"
  >
    <span
      v-for="bookmark in props.bookmarks"
      :key="bookmark.target"
      class="pn-bookmark"
    >
      <span>{{ bookmark.label }}</span>
    </span>
  </div>
</template>

<style scoped>
.pn-bookmarks {
  position: absolute;
  top: auto;
  bottom: -1.7rem;
  left: 2%;
  right: 2%;
  z-index: 5;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: center;
  gap: .28rem;
}

.pn-bookmark {
  box-sizing: border-box;
  flex: 0 0 auto;
  width: auto;
  min-width: 0;
  min-height: 2.25rem;
  padding: 1.6rem .55rem .45rem;
  border: 1px solid rgba(75, 52, 30, .48);
  border-radius: 0 0 .42rem .42rem;
  background:
    linear-gradient(90deg, rgba(255, 250, 226, .22), transparent 38%),
    #b99a67;
  box-shadow:
    -2px 2px 5px rgba(42, 28, 15, .2),
    inset 0 0 0 1px rgba(255, 245, 211, .14);
  color: #382817;
  font-family: "Dancing Script", cursive;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.05;
  text-align: center;
  text-transform: none;
  text-shadow:
    0 1px 0 rgba(255, 247, 222, .42),
    0 0 .45px rgba(49, 31, 15, .42);
  white-space: nowrap;
  writing-mode: horizontal-tb;
  text-orientation: mixed;
  transition:
    transform 160ms ease,
    filter 160ms ease,
    box-shadow 160ms ease;
}

.pn-bookmark:nth-child(2) { background-color: #aa895d; }
.pn-bookmark:nth-child(3) { background-color: #c2a878; }
.pn-bookmark:nth-child(4) { background-color: #9d8059; }

button.pn-bookmark {
  cursor: pointer;
}

button.pn-bookmark:disabled {
  cursor: default;
}

button.pn-bookmark:hover:not(:disabled),
button.pn-bookmark:focus-visible {
  filter: brightness(1.06);
}

button.pn-bookmark:focus-visible {
  outline: 2px solid #d8c39a;
  outline-offset: 2px;
}

.pn-bookmark.is-active {
  transform: translateY(.35rem);
  filter: brightness(1.07) saturate(1.04);
  box-shadow:
    0 4px 8px rgba(42, 28, 15, .3),
    inset 0 0 0 1px rgba(255, 245, 211, .28);
}

@media (min-width: 900px) {
  .pn-bookmarks {
    top: 12%;
    bottom: auto;
    right: auto;
    left: calc(100% - .9rem);
    width: 7.25rem;
    gap: .5rem;
    flex-direction: column;
    align-items: stretch;
  }

  .pn-bookmark {
    flex: none;
    width: 100%;
    min-height: 1.9rem;
    padding: .4rem .75rem .4rem 1rem;
    border-right: 1px solid rgba(75, 52, 30, .48);
    border-left: 0;
    border-radius: .42rem;
    font-size: 1rem;
    text-align: left;
  }

  .pn-bookmark.is-active {
    transform: translateX(.35rem);
  }
}
</style>
