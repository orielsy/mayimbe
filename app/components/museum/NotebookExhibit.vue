<script setup lang="ts">
import { ref } from 'vue'
import NotebookExperience from '~/components/notebook/NotebookExperience.vue'

defineProps<{ target?: unknown }>()

const emit = defineEmits<{
  requestDesk: []
}>()

interface NotebookExperienceHandle {
  closeForDesk: () => Promise<void>
}

const experience = ref<NotebookExperienceHandle | null>(null)

async function closeForDesk() {
  await experience.value?.closeForDesk()
}

defineExpose({ closeForDesk })
</script>

<template>
  <NotebookExperience
    ref="experience"
    :target="target"
    @request-desk="emit('requestDesk')"
  />
</template>
