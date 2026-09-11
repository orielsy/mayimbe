import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import YAML from 'yaml'
import type { PersonEntity, SourceEntity, StoryEntity } from '../core/archive/entities.ts'
import { personSchema } from '../schemas/archive/person.ts'
import { sourceSchema } from '../schemas/archive/source.ts'
import { storySchema } from '../schemas/archive/story.ts'

export interface LoadedContent {
  people: PersonEntity[]
  sources: SourceEntity[]
  stories: StoryEntity[]
}

async function filesIn(directory: string, extension: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && extname(entry.name) === extension)
      .map((entry) => join(directory, entry.name))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

function parseMarkdownRecord(raw: string, file: string): Record<string, unknown> {
  const normalized = raw.replace(/\r\n/g, '\n')

  if (!normalized.startsWith('---\n')) {
    throw new Error(`Markdown content requires YAML frontmatter: ${file}`)
  }

  const end = normalized.indexOf('\n---\n', 4)
  if (end === -1) {
    throw new Error(`Markdown frontmatter is not closed: ${file}`)
  }

  const frontmatter = YAML.parse(normalized.slice(4, end)) as Record<string, unknown>
  const body = normalized.slice(end + 5).trim()

  return { ...frontmatter, body }
}

export async function loadContent(root = process.cwd()): Promise<LoadedContent> {
  const peopleFiles = await filesIn(join(root, 'content', 'people'), '.yaml')
  const sourceFiles = await filesIn(join(root, 'content', 'sources'), '.yaml')
  const storyFiles = await filesIn(join(root, 'content', 'stories'), '.md')

  const people: PersonEntity[] = []
  const sources: SourceEntity[] = []
  const stories: StoryEntity[] = []

  for (const file of peopleFiles) {
    people.push(personSchema.parse(YAML.parse(await readFile(file, 'utf8'))))
  }

  for (const file of sourceFiles) {
    sources.push(sourceSchema.parse(YAML.parse(await readFile(file, 'utf8'))))
  }

  for (const file of storyFiles) {
    const raw = await readFile(file, 'utf8')
    stories.push(storySchema.parse(parseMarkdownRecord(raw, file)))
  }

  const archiveEntities = [...people, ...sources, ...stories]
  assertUniqueIds(archiveEntities)
  assertReferences({ people, sources, stories })

  return { people, sources, stories }
}

function assertUniqueIds(records: Array<{ id: string }>): void {
  const ids = new Set<string>()

  for (const record of records) {
    if (ids.has(record.id)) {
      throw new Error(`Duplicate content ID: ${record.id}`)
    }
    ids.add(record.id)
  }
}

function assertReferences(content: LoadedContent): void {
  const archiveIds = new Set([
    ...content.people.map((entity) => entity.id),
    ...content.sources.map((entity) => entity.id),
    ...content.stories.map((entity) => entity.id),
  ])

  const requireArchiveId = (id: string, owner: string) => {
    if (!archiveIds.has(id)) {
      throw new Error(`Broken archive reference from ${owner}: ${id}`)
    }
  }

  for (const story of content.stories) {
    for (const id of story.references ?? []) {
      requireArchiveId(id, story.id)
    }
    for (const id of story.sources ?? []) {
      requireArchiveId(id, story.id)
    }
  }
}
