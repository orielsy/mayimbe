export default defineNuxtConfig({
  // The DevTools overlay renders a floating frame above the page. At mobile
  // viewport widths it sits over the notebook controls and swallows pointer
  // events, which blocks the visual suite and contaminates its screenshots.
  // Playwright sets NUXT_DEVTOOLS_DISABLED so test runs get a clean page.
  devtools: { enabled: process.env.NUXT_DEVTOOLS_DISABLED !== '1' },

  // Two `nuxt dev` processes in one checkout would otherwise fight over the
  // same build directory. Overriding this lets the visual suite run its own
  // isolated server alongside a dev server already serving a real device.
  buildDir: process.env.NUXT_BUILD_DIR || '.nuxt',

  css: ['~/assets/css/main.css'],

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
