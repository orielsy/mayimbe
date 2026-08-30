import { loadContent } from './content-utils.ts'

const content = await loadContent()
const archiveCount = content.people.length + content.sources.length + content.stories.length

console.log(
  `Archive validation passed: ${archiveCount} archive entities, ${content.stories.length} stor${content.stories.length === 1 ? 'y' : 'ies'}, and ${content.experiences.length} experience mapping(s).`,
)
