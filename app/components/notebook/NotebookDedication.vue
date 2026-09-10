<script setup lang="ts">
import { notebookAsset } from './notebookAssets'
</script>

<template>
  <div class="pn-cover pn-cover--inside pn-dedication-board">
    <img
      :src="notebookAsset('cover-brick-inside').path"
      alt=""
      aria-hidden="true"
      class="pn-fill-image"
    >

    <div class="pn-dedication-board__copy">
      <p class="pn-dedication">
        Para Antony, con mucho cariño.
        <span>De parte de Orielsy Díaz</span>
      </p>
    </div>

    <span aria-hidden="true" class="pn-cover__spine-shade pn-cover__spine-shade--left" />
  </div>
</template>

<style scoped>
.pn-dedication {
  font-family: "Dancing Script", cursive;
  font-weight: 500;
}
</style>
