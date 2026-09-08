export type NotebookPageKind = 'text' | 'sketch' | 'photo' | 'clipping'

export interface NotebookPage {
  id: string
  n: number
  eyebrow: string
  title: string
  body: string
  note?: string
  caption?: string
  kind: NotebookPageKind
  recipe: string
}

/** Prototype Page Turner copy. This will later be replaced by Mayimbe content data. */
export const NOTEBOOK_PAGES: NotebookPage[] = [
  {
    id: 'mayimbe',
    n: 1,
    eyebrow: 'Cabrera, 1967',
    title: 'El Mayimbe',
    body: 'Antony Santos — Cabrera, María Trinidad Sánchez. A notebook kept the way bachata was kept in the campo: by hand, out of order, and louder than it looks.',
    note: 'start here',
    kind: 'sketch',
    recipe: 'carried',
  },
  {
    id: 'guira',
    n: 2,
    eyebrow: 'Before the name',
    title: 'Güira first',
    body: "Before his own name meant anything, he was the rhythm behind someone else's. Nights on the road taught him the working shape of a bachata band: guitar, bass, bongó, güira, and whoever could still stand at four in the morning.",
    kind: 'text',
    recipe: 'carried',
  },
  {
    id: 'voypalla',
    n: 3,
    eyebrow: '1991',
    title: "Voy Pa'llá",
    body: 'The record that stopped being a local record. Amargue with a grin in it — the heartbreak was still there, but the tempo argued with it. Colmados played it until the speakers gave out.',
    note: 'verify pressing date',
    kind: 'clipping',
    recipe: 'humidity',
  },
  {
    id: 'patio',
    n: 4,
    eyebrow: 'Field photograph',
    title: 'Patio, four in the morning',
    body: 'The same set played in a campo patio the week before an arena date, and nobody in either crowd thought that was strange.',
    caption: 'Unattributed print, north coast, early nineties. Credit outstanding.',
    kind: 'photo',
    recipe: 'humidity',
  },
  {
    id: 'requinto',
    n: 5,
    eyebrow: 'Listening note',
    title: 'Requinto',
    body: 'The lead line answers the vocal phrase one bar late, like someone finishing your sentence badly on purpose. Listen for the bend at the end of the run — that hesitation is the signature, not the speed.',
    kind: 'sketch',
    recipe: 'protected',
  },
  {
    id: 'amargue',
    n: 6,
    eyebrow: 'Definition',
    title: 'Amargue',
    body: 'Not sadness exactly — a sweetness about the sadness. The word resists translation the way the music resists tempo: both insist on their own time.',
    kind: 'text',
    recipe: 'protected',
  },
  {
    id: 'cassette',
    n: 7,
    eyebrow: 'Circulation',
    title: 'Cinco minutos',
    body: 'A single that travelled on cassette before it travelled on radio. Hand to hand, colmadón to colmadón, the copy degraded and the song did not. The tape hiss became part of the arrangement by the third generation of dubs.',
    note: 'tape hiss = arrangement',
    kind: 'clipping',
    recipe: 'carried',
  },
  {
    id: 'notes',
    n: 8,
    eyebrow: 'Working file',
    title: 'Notes to file',
    body: 'Open questions for the museum build: discography dates to verify against pressings, interview audio to license, photo credits still outstanding. This page exists so the last sheet is a real page and not a blank.',
    kind: 'text',
    recipe: 'humidity',
  },
]
