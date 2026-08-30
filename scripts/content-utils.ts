import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import YAML from 'yaml'
import { personSchema } from '../schemas/archive/person.ts'

export interface LoadedContent {
  people: Array<ReturnType<typeof personSchema.parse>>
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

export async function loadContent(root = process.cwd()): Promise<LoadedContent> {
  const peopleFiles = await filesIn(join(root, 'content', 'people'), '.yaml')
  const people = []

  for (const file of peopleFiles) {
    const raw = await readFile(file, 'utf8')
    people.push(personSchema.parse(YAML.parse(raw)))
  }

  assertUniqueIds(people)

  return { people }
}

function assertUniqueIds(records: Array<{ id: string }>): void {
  const ids = new Set<string>()

  for (const record of records) {
    if (ids.has(record.id)) {
      throw new Error(`Duplicate archive ID: ${record.id}`)
    }
    ids.add(record.id)
  }
}
