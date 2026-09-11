import type { SiteLocale } from '~/composables/useSiteLocale'

export type NotebookPageKind = 'text' | 'sketch' | 'photo' | 'clipping'

export interface NotebookPageCopy {
  eyebrow: string
  title: string
  body: string
  note?: string
  caption?: string
  imageAlt?: string
}

export interface NotebookPage extends NotebookPageCopy {
  id: string
  n: number
  kind: NotebookPageKind
  recipe: string
  content: Record<SiteLocale, NotebookPageCopy>
}

interface NotebookPageMeta {
  id: string
  n: number
  kind: NotebookPageKind
  recipe: string
}

function notebookPage(
  meta: NotebookPageMeta,
  content: Record<SiteLocale, NotebookPageCopy>,
): NotebookPage {
  return {
    ...meta,
    ...content.es,
    content,
  }
}

export function notebookPageCopy(page: NotebookPage, locale: SiteLocale): NotebookPageCopy {
  return page.content[locale] ?? page.content.es
}

/**
 * Prototype Page Turner content.
 *
 * Spanish is the canonical authored version. Physical page identity, numbering,
 * wear recipe and media stay language-neutral while each locale supplies its
 * own editorial copy. The narrative itself will be replaced as museum research
 * and writing are finalized.
 */
export const NOTEBOOK_PAGES: NotebookPage[] = [
  notebookPage(
    { id: 'mayimbe', n: 1, kind: 'sketch', recipe: 'carried' },
    {
      es: {
        eyebrow: 'Clavellinas, 1967',
        title: 'El Mayimbe',
        body: 'Antony Santos — Las Matas de Santa Cruz, Monte Cristi. Un cuaderno guardado como se guardó la bachata en el campo: a mano, fuera de orden y más fuerte de lo que parece.',
        note: 'empieza aquí',
      },
      en: {
        eyebrow: 'Clavellinas, 1967',
        title: 'El Mayimbe',
        body: 'Antony Santos — Las Matas de Santa Cruz, Monte Cristi. A notebook kept the way bachata was kept in the campo: by hand, out of order, and louder than it looks.',
        note: 'start here',
      },
    },
  ),
  notebookPage(
    { id: 'guira', n: 2, kind: 'text', recipe: 'carried' },
    {
      es: {
        eyebrow: 'Antes del nombre',
        title: 'Primero, la güira',
        body: 'Antes de que su propio nombre significara algo, él era el ritmo detrás del nombre de otro. Las noches en la carretera le enseñaron la forma de trabajo de una banda de bachata: guitarra, bajo, bongó, güira y quien todavía pudiera mantenerse de pie a las cuatro de la mañana.',
      },
      en: {
        eyebrow: 'Before the name',
        title: 'Güira first',
        body: "Before his own name meant anything, he was the rhythm behind someone else's. Nights on the road taught him the working shape of a bachata band: guitar, bass, bongó, güira, and whoever could still stand at four in the morning.",
      },
    },
  ),
  notebookPage(
    { id: 'voypalla', n: 3, kind: 'clipping', recipe: 'humidity' },
    {
      es: {
        eyebrow: '1991',
        title: "Voy Pa'llá",
        body: 'El disco que dejó de ser un disco local. Amargue con una sonrisa metida dentro: el desamor seguía ahí, pero el tempo discutía con él. En los colmados sonaba hasta que los altavoces no podían más.',
        note: 'verificar fecha de prensado',
      },
      en: {
        eyebrow: '1991',
        title: "Voy Pa'llá",
        body: 'The record that stopped being a local record. Amargue with a grin in it — the heartbreak was still there, but the tempo argued with it. Colmados played it until the speakers gave out.',
        note: 'verify pressing date',
      },
    },
  ),
  notebookPage(
    { id: 'patio', n: 4, kind: 'photo', recipe: 'humidity' },
    {
      es: {
        eyebrow: 'Fotografía de campo',
        title: 'Patio, cuatro de la mañana',
        body: 'El mismo repertorio podía sonar en un patio del campo una semana antes de una fecha en una arena, y a nadie en ninguno de los dos públicos le parecía extraño.',
        caption: 'Copia sin atribuir, costa norte, principios de los noventa. Crédito pendiente.',
        imageAlt: 'Dos guitarristas y un güirero en un pequeño escenario al aire libre de noche, en una fotografía descolorida de los años noventa.',
      },
      en: {
        eyebrow: 'Field photograph',
        title: 'Patio, four in the morning',
        body: 'The same set played in a campo patio the week before an arena date, and nobody in either crowd thought that was strange.',
        caption: 'Unattributed print, north coast, early nineties. Credit outstanding.',
        imageAlt: 'Two guitarists and a güira player on a small outdoor patio stage at night, faded 1990s film print.',
      },
    },
  ),
  notebookPage(
    { id: 'requinto', n: 5, kind: 'sketch', recipe: 'protected' },
    {
      es: {
        eyebrow: 'Nota de escucha',
        title: 'Requinto',
        body: 'La línea principal responde a la frase vocal un compás más tarde, como alguien terminando tu oración mal a propósito. Escucha el doblez al final de la corrida: esa vacilación es la firma, no la velocidad.',
      },
      en: {
        eyebrow: 'Listening note',
        title: 'Requinto',
        body: 'The lead line answers the vocal phrase one bar late, like someone finishing your sentence badly on purpose. Listen for the bend at the end of the run — that hesitation is the signature, not the speed.',
      },
    },
  ),
  notebookPage(
    { id: 'amargue', n: 6, kind: 'text', recipe: 'protected' },
    {
      es: {
        eyebrow: 'Definición',
        title: 'Amargue',
        body: 'No es tristeza exactamente: es una dulzura dentro de la tristeza. La palabra se resiste a la traducción de la misma manera que la música se resiste al tempo; ambas insisten en su propio tiempo.',
      },
      en: {
        eyebrow: 'Definition',
        title: 'Amargue',
        body: 'Not sadness exactly — a sweetness about the sadness. The word resists translation the way the music resists tempo: both insist on their own time.',
      },
    },
  ),
  notebookPage(
    { id: 'cassette', n: 7, kind: 'clipping', recipe: 'carried' },
    {
      es: {
        eyebrow: 'Circulación',
        title: 'Cinco minutos',
        body: 'Un sencillo que viajó en casete antes de viajar por la radio. De mano en mano, de colmadón en colmadón, la copia se degradaba y la canción no. Para la tercera generación de duplicados, el siseo de la cinta ya parecía parte del arreglo.',
        note: 'el hiss también cuenta la historia',
      },
      en: {
        eyebrow: 'Circulation',
        title: 'Cinco minutos',
        body: 'A single that travelled on cassette before it travelled on radio. Hand to hand, colmadón to colmadón, the copy degraded and the song did not. The tape hiss became part of the arrangement by the third generation of dubs.',
        note: 'tape hiss = arrangement',
      },
    },
  ),
  notebookPage(
    { id: 'notes', n: 8, kind: 'text', recipe: 'humidity' },
    {
      es: {
        eyebrow: 'Archivo de trabajo',
        title: 'Notas al archivo',
        body: 'Preguntas abiertas para la construcción del museo: fechas de discografía por verificar contra prensados, audio de entrevistas por licenciar y créditos fotográficos todavía pendientes. Esta página existe para que la última hoja sea una página real y no una hoja vacía.',
      },
      en: {
        eyebrow: 'Working file',
        title: 'Notes to file',
        body: 'Open questions for the museum build: discography dates to verify against pressings, interview audio to license, photo credits still outstanding. This page exists so the last sheet is a real page and not a blank.',
      },
    },
  ),
]
