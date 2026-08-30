<script setup lang="ts">
useSeoMeta({
  title: 'Mayimbe',
})
</script>

<template>
  <section class="page">
    <p class="eyebrow">Production foundation</p>
    <h1>Experience on top. Archive underneath.</h1>
    <p class="lede">
      Mayimbe is the production platform for AntonySantos.com. This first implementation is intentionally plain: it proves the museum shell, semantic navigation, archive pipeline, and static build before the finished art pieces are integrated.
    </p>
    <div class="actions">
      <NuxtLink class="button" to="/museum">Enter the museum shell</NuxtLink>
      <NuxtLink class="button" to="/archive">Open the archive</NuxtLink>
    </div>
  </section>
</template>
