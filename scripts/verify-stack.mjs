import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PNG } from 'pngjs'

const PORT = 3000
const url = `http://127.0.0.1:${PORT}/museum/notebook`
const outDir = path.resolve('device-screenshots/verify')
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.notebook-engine-host .nbn', { timeout: 30000 })
await page.waitForTimeout(1200)

const forward = () => page.getByRole('button', { name: /Forward/ }).click()
const back = () => page.getByRole('button', { name: /Back/ }).click()

await forward(); await page.waitForTimeout(4500)  // open
await forward(); await page.waitForTimeout(4500)  // next -> turn 1

const clip = await page.locator('.notebook-engine-host .nbn').boundingBox()
const rows = []
const backPromise = back()
for (let i = 0; i < 30; i++) {
  const buf = await page.screenshot({ clip: clip || undefined })
  await writeFile(path.join(outDir, `f-${String(i).padStart(3, '0')}.png`), buf)
  const st = await page.evaluate(() => {
    const s = sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el).visibility : '?' }
    return { L: s('.nbn .half.left .stack'), R: s('.nbn .half.right .stack') }
  })
  // left-half mean luminance
  const png = PNG.sync.read(buf)
  let sum = 0, n = 0
  for (let y = 0; y < png.height; y += 4) {
    for (let x = 0; x < Math.floor(png.width * 0.5); x += 4) {
      const idx = (y * png.width + x) * 4
      sum += 0.2126 * png.data[idx] + 0.7152 * png.data[idx + 1] + 0.0722 * png.data[idx + 2]
      n++
    }
  }
  rows.push({ i, stackL: st.L, stackR: st.R, leftMean: Math.round(sum / n) })
  await new Promise(r => setTimeout(r, 120))
}
await backPromise
await browser.close()

console.log(' i  stackL    stackR    leftMean')
for (const r of rows) {
  console.log(`${String(r.i).padStart(3, ' ')}  ${r.stackL.padEnd(7)}  ${r.stackR.padEnd(7)}  ${r.leftMean}`)
}
