export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
    '~/assets/css/main.css',
    '~/assets/css/notebook-fonts.css',
  ],

  typescript: {
    strict: true,
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/notebook',
        '/notebook/early-years',
        '/en',
        '/en/notebook',
        '/en/notebook/early-years',
        '/archive',
        '/people/antony-santos',
        '/stories/early-years',
        '/museum',
        '/museum/notebook',
        '/museum/notebook/early-years',
      ],
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      titleTemplate: '%s · AntonySantos.com',
      meta: [
        {
          name: 'description',
          content: 'Mayimbe es la plataforma de producción de AntonySantos.com, un museo digital interactivo y archivo cultural.',
        },
      ],
    },
  },
})
