import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadContent } from './content-utils.ts'

const content = await loadContent()
const archiveEntities = [...content.people, ...content.sources, ...content.stories]
const byId = Object.fromEntries(archiveEntities.map((entity) => [entity.id, entity]))

const archiveOutput = {
  people: content.people,
  sources: content.sources,
  stories: content.stories,
  byId,
}

const generatedDirectory = join(process.cwd(), 'generated')
await mkdir(generatedDirectory, { recursive: true })
await writeFile(join(generatedDirectory, 'archive.json'), `${JSON.stringify(archiveOutput, null, 2)}\n`, 'utf8')

console.log(`Generated archive index with ${archiveEntities.length} entities.`)
