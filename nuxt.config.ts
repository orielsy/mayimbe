export default defineNuxtConfig({
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/archive',
        '/people/antony-santos',
        '/stories/early-years',
        '/museum',
        '/museum/notebook/early-years',
      ],
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s · AntonySantos.com',
      meta: [
        {
          name: 'description',
          content: 'Mayimbe is the production platform for AntonySantos.com, an interactive digital museum and cultural archive.',
        },
      ],
    },
  },
})
