export type MuseumDestination =
  | { kind: 'desk' }
  | {
      kind: 'exhibit'
      exhibit: string
      target?: unknown
      entity?: string
    }

export function destinationToPath(destination: MuseumDestination): string {
  if (destination.kind === 'desk') {
    return '/'
  }

  const target = typeof destination.target === 'string' && destination.target.length
    ? `/${destination.target.split('/').map(encodeURIComponent).join('/')}`
    : ''

  return `/${encodeURIComponent(destination.exhibit)}${target}`
}
