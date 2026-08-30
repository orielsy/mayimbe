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

const bySubject: Record<string, typeof content.experiences> = {}
for (const mapping of content.experiences) {
  bySubject[mapping.subject] ??= []
  bySubject[mapping.subject].push(mapping)
}

const experienceOutput = {
  mappings: content.experiences,
  bySubject,
}

const generatedDirectory = join(process.cwd(), 'generated')
await mkdir(generatedDirectory, { recursive: true })
await writeFile(join(generatedDirectory, 'archive.json'), `${JSON.stringify(archiveOutput, null, 2)}\n`, 'utf8')
await writeFile(join(generatedDirectory, 'experience-index.json'), `${JSON.stringify(experienceOutput, null, 2)}\n`, 'utf8')

console.log(
  `Generated archive index with ${archiveEntities.length} entities and ${content.experiences.length} experience mapping(s).`,
)
