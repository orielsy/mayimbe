export type TemporalValue =
  | { kind: 'exact'; value: string }
  | { kind: 'month'; value: string }
  | { kind: 'year'; value: number }
  | { kind: 'circa'; value: number }
  | { kind: 'range'; from: number; to: number }
  | { kind: 'unknown' }
