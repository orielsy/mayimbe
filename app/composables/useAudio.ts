import { createInitialAudioState, type AudioState } from '~~/core/audio'

export function useAudio() {
  const state = useState<AudioState>('mayimbe:audio-runtime', () => createInitialAudioState())
  return { state }
}
