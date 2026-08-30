<script setup lang="ts">
const route = useRoute()
const archive = useArchive()
const slug = String(route.params.slug)
const person = archive.people.find((candidate) => candidate.slug === slug)

if (!person) {
  throw createError({ statusCode: 404, statusMessage: 'Archive record not found' })
}

useSeoMeta({
  title: person.name,
  description: person.summary?.en ?? `Archive record for ${person.name}.`,
})
</script>

<template>
  <article class="page">
    <p class="eyebrow">Archive / Person</p>
    <h1>{{ person.name }}</h1>
    <p v-if="person.summary?.en" class="lede">{{ person.summary.en }}</p>
    <p v-else class="lede">
      This first record is intentionally minimal. The archive does not require biographical details that have not yet been sourced and entered.
    </p>

    <div class="panel">
      <p><strong>Stable ID:</strong> <code>{{ person.id }}</code></p>
      <p><strong>Canonical name:</strong> {{ person.name }}</p>
    </div>

    <div class="actions">
      <NuxtLink class="button" to="/museum/notebook/early-years">Experience this in the museum</NuxtLink>
      <NuxtLink class="button" to="/archive">Back to archive</NuxtLink>
    </div>
  </article>
</template>
