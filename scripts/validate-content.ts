import { loadContent } from './content-utils.ts'

const content = await loadContent()
const count = content.people.length

console.log(`Archive validation passed: ${count} published ${count === 1 ? 'entity' : 'entities'}.`)
