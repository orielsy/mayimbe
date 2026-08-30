<script setup lang="ts">
const archive = useArchive()

useSeoMeta({
  title: 'Archive',
  description: 'Conventional archive access for AntonySantos.com.',
})
</script>

<template>
  <section class="page">
    <p class="eyebrow">Archive</p>
    <h1>What Mayimbe knows.</h1>
    <p class="lede">
      The archive is the conventional, semantic interface to the same knowledge that powers the museum. Missing historical information is valid; only material we can actually support belongs here.
    </p>

    <div class="grid">
      <article v-for="person in archive.people" :key="person.id" class="panel">
        <p class="eyebrow">Person</p>
        <h2>{{ person.name }}</h2>
        <p class="muted"><code>{{ person.id }}</code></p>
        <NuxtLink class="button" :to="`/people/${person.slug}`">Open archive record</NuxtLink>
      </article>
    </div>
  </section>
</template>
