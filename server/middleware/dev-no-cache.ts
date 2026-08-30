export default defineEventHandler((event) => {
  if (process.env.NODE_ENV === 'production') return

  setResponseHeaders(event, {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
  })
})
