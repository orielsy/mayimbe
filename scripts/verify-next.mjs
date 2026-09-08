import { chromium } from 'playwright'

const PORT = 3000
const url = `http://127.0.0.1:${PORT}/museum/notebook`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.notebook-engine-host .nbn', { timeout: 30000 })
await page.waitForTimeout(1200)

const forward = () => page.getByRole('button', { name: /Forward/ }).click()

await forward(); await page.waitForTimeout(4500)  // open -> turn 0 (right = "Early Years")

const rows = []
const nextPromise = forward()
for (let i = 0; i < 30; i++) {
  const st = await page.evaluate(() => {
    const inf = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        w: Math.round(r.width),
        opacity: getComputedStyle(el).opacity,
        text: el.textContent.trim().slice(0, 14).replace(/\s+/g, ' ')
      }
    }
    return {
      R: inf(document.querySelector('.nbn .leafR')),
      L: inf(document.querySelector('.nbn .leafL')),
      T: inf(document.querySelector('.nbn .turning-face'))
    }
  })
  rows.push({ i, R: st.R, L: st.L, T: st.T })
  await new Promise(r => setTimeout(r, 120))
}
await nextPromise
await browser.close()

const fmt = (e) => e ? `${String(e.w).padStart(3)},${e.opacity},"${e.text}"` : '(null)'
console.log(' i   leafR               leafL               turning-face')
for (const r of rows) {
  console.log(`${String(r.i).padStart(3, ' ')}  R:${fmt(r.R).padEnd(24)}  L:${fmt(r.L).padEnd(24)}  T:${fmt(r.T)}`)
}
