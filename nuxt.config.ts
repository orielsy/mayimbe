export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
    '~/assets/css/main.css',
    '~/assets/css/notebook-pocket.css',
  ],

  typescript: {
    strict: true,
  },

  // Local device testing should never depend on a browser deciding whether a
  // development module is fresh. Vite serves all dev assets with no-store.
  vite: {
    server: {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
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
        '/museum/notebook',
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
