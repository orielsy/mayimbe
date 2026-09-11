<script setup lang="ts">
import type { SourceEntity } from '~~/core/archive'

const route = useRoute()
const archive = useArchive()
const slug = String(route.params.slug)
const story = archive.stories.find((candidate) => candidate.slug === slug && candidate.status === 'published')

if (!story) {
  throw createError({ statusCode: 404, statusMessage: 'Story not found' })
}

const museumPath = story.id === 'story:early-years' ? '/notebook/early-years' : null
const paragraphs = story.body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
const sources = (story.sources ?? [])
  .map((id) => archive.byId[id])
  .filter((entity): entity is SourceEntity => entity?.type === 'source')

useSeoMeta({
  title: story.title.en ?? story.title.es ?? story.slug,
  description: story.summary?.en ?? story.summary?.es,
})
</script>

<template>
  <article class="page">
    <p class="eyebrow">Archive / Story</p>
    <h1>{{ story.title.en ?? story.title.es }}</h1>
    <p v-if="story.summary?.en" class="lede">{{ story.summary.en }}</p>

    <div class="panel">
      <p v-for="paragraph in paragraphs" :key="paragraph">{{ paragraph }}</p>
    </div>

    <section v-if="sources.length" class="panel" aria-labelledby="story-sources">
      <p class="eyebrow">Provenance</p>
      <h2 id="story-sources">Sources</h2>
      <ul>
        <li v-for="source in sources" :key="source.id">
          <a v-if="source.url" :href="source.url" target="_blank" rel="noreferrer">{{ source.title }}</a>
          <span v-else>{{ source.title }}</span>
          <span v-if="source.publication"> — {{ source.publication }}</span>
        </li>
      </ul>
    </section>

    <div class="actions">
      <NuxtLink v-if="museumPath" class="button" :to="museumPath">
        Experience in the Cuaderno
      </NuxtLink>
      <NuxtLink class="button" to="/archive">Back to archive</NuxtLink>
    </div>
  </article>
</template>
