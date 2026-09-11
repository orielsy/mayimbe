<script setup lang="ts">
import NotebookSheet from '~/components/notebook/NotebookSheet.vue'
import { notebookSheetWear } from '~/components/notebook/notebookWear'
import '~/assets/css/notebook-page-turner.css'

useHead({
  title: 'Notebook Handwriting Font Lab',
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Dancing+Script:wght@400..700&family=Kalam:wght@300;400;700&family=Marck+Script&family=Patrick+Hand&display=swap',
    },
  ],
})

const labWear = notebookSheetWear(1, 8)

const fontSamples = [
  {
    name: 'Segoe Script',
    family: '"Segoe Script", "Segoe Print", cursive',
    note: 'Current baseline',
  },
  {
    name: 'Caveat',
    family: '"Caveat", cursive',
    note: 'Loose, natural handwriting',
  },
  {
    name: 'Kalam',
    family: '"Kalam", cursive',
    note: 'Handwritten but highly readable',
  },
  {
    name: 'Marck Script',
    family: '"Marck Script", cursive',
    note: 'More flowing and traditional',
  },
  {
    name: 'Dancing Script',
    family: '"Dancing Script", cursive',
    note: 'Expressive cursive',
  },
  {
    name: 'Patrick Hand',
    family: '"Patrick Hand", cursive',
    note: 'Informal notebook handwriting',
  },
] as const
</script>

<template>
  <main class="font-lab">
    <header class="font-lab__header">
      <div>
        <p class="font-lab__eyebrow">Notebook paper typography</p>
        <h1>Handwriting comparison</h1>
        <p>
          Same paper, copy, size, line height, and spacing. Only the handwriting
          face changes.
        </p>
      </div>

      <NuxtLink class="font-lab__back" to="/notebook">
        Back to notebook
      </NuxtLink>
    </header>

    <section class="font-lab__grid" aria-label="Handwriting font samples">
      <article
        v-for="sample in fontSamples"
        :key="sample.name"
        class="font-sample"
      >
        <header class="font-sample__label">
          <strong>{{ sample.name }}</strong>
          <span>{{ sample.note }}</span>
        </header>

        <div class="font-sample__paper">
          <NotebookSheet :wear="labWear">
            <div
              class="font-sample__copy"
              :style="{ fontFamily: sample.family }"
            >
              <p class="font-sample__date">12 de mayo</p>
              <h2>Apuntes del cuaderno</h2>
              <p class="font-sample__body">
                Hay historias que no viven en una sola fotografía. Se quedan en
                las esquinas de una página, en una fecha escrita deprisa y en una
                nota que alguien decidió no borrar.
              </p>
              <p class="font-sample__note">
                Volver a escuchar esta historia.
              </p>
              <p class="font-sample__numbers">1989 · 1994 · 2001</p>
            </div>
          </NotebookSheet>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.font-lab {
  min-height: 100dvh;
  padding: clamp(1.25rem, 3vw, 3rem);
  color: #e8e0d4;
  background:
    radial-gradient(circle at 50% 0%, rgba(99, 69, 45, .24), transparent 42%),
    #120e0b;
}

.font-lab__header {
  width: min(100%, 84rem);
  margin: 0 auto clamp(1.5rem, 4vw, 3rem);
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.font-lab__eyebrow {
  margin: 0 0 .45rem;
  font-size: .72rem;
  letter-spacing: .18em;
  text-transform: uppercase;
  opacity: .58;
}

.font-lab__header h1 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(1.8rem, 4vw, 3.4rem);
  font-weight: 500;
}

.font-lab__header p:not(.font-lab__eyebrow) {
  max-width: 46rem;
  margin: .65rem 0 0;
  line-height: 1.55;
  opacity: .72;
}

.font-lab__back {
  flex: none;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid rgba(232, 224, 212, .35);
  padding-bottom: .15rem;
}

.font-lab__grid {
  width: min(100%, 84rem);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1.5rem, 3vw, 3rem);
  align-items: start;
}

.font-sample {
  min-width: 0;
}

.font-sample__label {
  min-height: 3.2rem;
  margin-bottom: .75rem;
  display: flex;
  flex-direction: column;
  gap: .2rem;
}

.font-sample__label strong {
  font-size: .95rem;
  letter-spacing: .04em;
}

.font-sample__label span {
  font-size: .78rem;
  opacity: .55;
}

.font-sample__paper {
  width: min(100%, 23rem);
  margin-inline: auto;
  aspect-ratio: 3 / 4;
  position: relative;
  container-type: inline-size;
  filter: drop-shadow(0 24px 34px rgba(0, 0, 0, .48));
}

.font-sample__copy {
  position: relative;
  z-index: 10;
  height: 100%;
  padding: 12% 11% 9%;
  display: flex;
  flex-direction: column;
  color: rgba(54, 39, 27, .9);
  font-size: 5.2cqw;
  line-height: 1.42;
}

.font-sample__date {
  margin: 0;
  font-size: .72em;
  opacity: .66;
}

.font-sample__copy h2 {
  margin: 8% 0 0;
  font: inherit;
  font-size: 1.42em;
  line-height: 1.05;
}

.font-sample__body {
  margin: 10% 0 0;
}

.font-sample__note {
  margin: auto 0 0;
  font-size: 1.08em;
  transform: rotate(-1.2deg);
}

.font-sample__numbers {
  margin: 8% 0 0;
  font-size: .78em;
  opacity: .64;
}

@media (max-width: 980px) {
  .font-lab__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .font-lab__header {
    align-items: start;
    flex-direction: column;
  }

  .font-lab__grid {
    grid-template-columns: 1fr;
  }

  .font-sample__paper {
    width: min(92vw, 23rem);
  }
}
</style>
