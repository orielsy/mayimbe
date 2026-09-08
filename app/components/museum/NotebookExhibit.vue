<script setup lang="ts">
import NotebookExperience from '~/components/notebook/NotebookExperience.vue'

defineProps<{ target?: unknown }>()
</script>

<template>
  <NotebookExperience :target="target" />
</template>
