export interface AudioState {
  currentMedia: string | null
  playing: boolean
  position: number
  volume: number
  muted: boolean
  sourceExhibit: string | null
}

export function createInitialAudioState(): AudioState {
  return {
    currentMedia: null,
    playing: false,
    position: 0,
    volume: 1,
    muted: false,
    sourceExhibit: null,
  }
}
