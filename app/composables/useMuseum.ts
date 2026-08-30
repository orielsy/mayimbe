import { createInitialMuseumState, type MuseumRuntimeState } from '~~/core/museum'

export function useMuseum() {
  const state = useState<MuseumRuntimeState>('mayimbe:museum-runtime', () => createInitialMuseumState())

  return { state }
}
