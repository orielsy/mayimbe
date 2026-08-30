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

    <h2>Stories</h2>
    <div class="grid">
      <article v-for="story in archive.stories.filter((item) => item.status === 'published')" :key="story.id" class="panel">
        <p class="eyebrow">Story</p>
        <h3>{{ story.title.en ?? story.title.es }}</h3>
        <p v-if="story.summary?.en">{{ story.summary.en }}</p>
        <p class="muted"><code>{{ story.id }}</code></p>
        <NuxtLink class="button" :to="`/stories/${story.slug}`">Read archive story</NuxtLink>
      </article>
    </div>

    <h2>People</h2>
    <div class="grid">
      <article v-for="person in archive.people" :key="person.id" class="panel">
        <p class="eyebrow">Person</p>
        <h3>{{ person.name }}</h3>
        <p class="muted"><code>{{ person.id }}</code></p>
        <NuxtLink class="button" :to="`/people/${person.slug}`">Open archive record</NuxtLink>
      </article>
    </div>
  </section>
</template>
