import type { MuseumDestination } from './destination'

export interface MuseumRuntimeState {
  destination: MuseumDestination
  previousDestination: MuseumDestination | null
  activeExhibit: string | null
}

export function createInitialMuseumState(): MuseumRuntimeState {
  return {
    destination: { kind: 'desk' },
    previousDestination: null,
    activeExhibit: null,
  }
}
