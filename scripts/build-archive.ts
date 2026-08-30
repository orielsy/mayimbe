import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadContent } from './content-utils.ts'

const content = await loadContent()
const byId = Object.fromEntries(content.people.map((entity) => [entity.id, entity]))
const output = {
  people: content.people,
  byId,
}

const generatedDirectory = join(process.cwd(), 'generated')
await mkdir(generatedDirectory, { recursive: true })
await writeFile(join(generatedDirectory, 'archive.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8')

console.log(`Generated archive index with ${content.people.length} entities.`)
