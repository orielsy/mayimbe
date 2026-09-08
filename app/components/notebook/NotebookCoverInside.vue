<script setup lang="ts">
import { notebookAsset } from './notebookAssets'
</script>

<template>
  <div class="pn-cover pn-cover--inside">
    <img
      :src="notebookAsset('cover-brick-inside').path"
      alt=""
      aria-hidden="true"
      class="pn-fill-image"
    >
    <span aria-hidden="true" class="pn-cover__spine-shade pn-cover__spine-shade--right" />
  </div>
</template>
