import type { SiteLocale } from '~/composables/useSiteLocale'

export type NotebookPageKind = 'text' | 'sketch' | 'photo' | 'clipping'

export interface NotebookPageCopy {
  eyebrow: string
  title: string
  body: string
  note?: string
  caption?: string
  imageAlt?: string
  mediaPlaceholder?: string
}

type LocalizedNotebookPageCopy = Partial<Record<SiteLocale, NotebookPageCopy>> & {
  es: NotebookPageCopy
}

export interface NotebookPage extends NotebookPageCopy {
  id: string
  n: number
  kind: NotebookPageKind
  content: LocalizedNotebookPageCopy
}

interface NotebookPageMeta {
  id: string
  n: number
  kind: NotebookPageKind
}

function notebookPage(
  meta: NotebookPageMeta,
  content: LocalizedNotebookPageCopy,
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
 * Origins notebook narrative.
 *
 * Spanish is canonical. English intentionally falls back to Spanish until the
 * separate English adaptation is authored. Physical page identity, numbering,
 * media placeholders and wear remain language-neutral.
 */
export const NOTEBOOK_PAGES: NotebookPage[] = [
  notebookPage(
    { id: 'el-campo', n: 1, kind: 'photo' },
    {
      es: {
        eyebrow: 'Clavellina · La Línea',
        title: 'El campo',
        body: 'Anthony Santos nació en una familia campesina del noroeste dominicano, en una vida amarrada al trabajo, a la familia y al ritmo del campo. Años después, cuando ya era famoso, todavía hablaba de aquel lugar como “mi campo”. Recordaba una niñez sencilla, sin lujos, pero también bonita: amigos, juegos, familia y una tranquilidad que nunca dejó de extrañar.',
        mediaPlaceholder: 'IMAGEN · Clavellina / paisaje rural del noroeste',
        caption: 'Pendiente: imagen de época o paisaje con procedencia verificable.',
      },
    },
  ),
  notebookPage(
    { id: 'cuando-no-habia', n: 2, kind: 'sketch' },
    {
      es: {
        eyebrow: 'Infancia',
        title: 'Cuando no había',
        body: 'La belleza del campo no borraba la pobreza. Anthony recordó días en que en la casa no había qué comer y el sacrificio de un padre que trabajaba para sostener a los suyos. Pero nunca contó su infancia solamente desde la carencia. También la recordó feliz. Escasez, amor, familia y música podían ocupar la misma página.',
        mediaPlaceholder: 'ARTE · casa rural / familia / memoria de infancia',
      },
    },
  ),
  notebookPage(
    { id: 'hacer-musica', n: 3, kind: 'sketch' },
    {
      es: {
        eyebrow: 'Antes de la guitarra',
        title: 'Hacer música con lo que había',
        body: 'Antes de tener instrumentos de verdad, ya buscaba cómo hacer música. De niño usaba latas como tamboras, fabricaba guayos para hacer de güira y construía guitarras con madera e hilos de plástico. No había instrumentos. Los inventaba. Mucho antes de “El Mayimbe”, ya estaba allí el niño que necesitaba hacer música aunque todavía no tuviera con qué.',
        mediaPlaceholder: 'ARTE · lata, guayo y guitarra casera de madera e hilo',
        note: 'hacer música con la escasez',
      },
    },
  ),
  notebookPage(
    { id: 'trabajo-y-guitarra', n: 4, kind: 'photo' },
    {
      es: {
        eyebrow: 'Trabajo',
        title: 'El trabajo y la guitarra',
        body: 'Como muchos niños del campo, Anthony ayudaba a su padre. Él mismo contó que trabajaba con él en el campo; gente de la zona lo recuerda cuidando arroz para espantar las aves. Su padre tapaba gomas. Y alrededor de aquella gomera quedó una constante: cuando había trabajo que hacer, Anthony encontraba la manera de volver a la guitarra. No rechazaba su tierra. Parecía resistirse a que aquel trabajo fuera su destino.',
        mediaPlaceholder: 'IMAGEN / ARTE · arrozal, gomera y guitarra',
        caption: 'Pendiente: fotografía local de época o ilustración documental.',
      },
    },
  ),
  notebookPage(
    { id: 'aprender-mirando', n: 5, kind: 'photo' },
    {
      es: {
        eyebrow: 'Aprendizaje',
        title: 'Aprender mirando',
        body: 'La bachata todavía vivía en los márgenes. Los músicos se cruzaban, se enseñaban cosas, cambiaban de grupo y recorrían pueblos buscando dónde tocar. Anthony entró desde abajo: primero en la güira con Luis Vargas. Miraba las guitarras, practicaba cuando podía y buscó a Antonio Carrasco para aprender. Con el tiempo pasó de la güira a la segunda guitarra. Ya no estaba mirando desde un lado. Estaba dentro.',
        mediaPlaceholder: 'IMAGEN · Anthony con Luis Vargas / agrupación temprana',
        caption: 'Pendiente: seleccionar y acreditar fotografía de época.',
      },
    },
  ),
  notebookPage(
    { id: 'algo-suyo', n: 6, kind: 'sketch' },
    {
      es: {
        eyebrow: 'Primer grupo',
        title: 'Algo suyo',
        body: 'Mientras tocaba con otros, Anthony comenzó a preparar su propio grupo. No había infraestructura esperando por él: había que formar músicos, conseguir instrumentos, ensayar, buscar bailes y moverse como se pudiera. Motocicletas. Carros pequeños cargados de gente y equipos. Instrumentos prestados. Caminos difíciles. Presentaciones por poco dinero. Y ensayo, una y otra vez, hasta encontrar un sonido que sintiera suyo.',
        mediaPlaceholder: 'ARTE · músicos, motocicleta y equipo en el camino',
      },
    },
  ),
  notebookPage(
    { id: 'la-musica-viaja', n: 7, kind: 'clipping' },
    {
      es: {
        eyebrow: 'Circulación',
        title: 'La música empieza a viajar',
        body: 'Antes de que Anthony pudiera recorrer el país, empezaron a hacerlo sus grabaciones. Se hicieron copias en cassette. Las cintas pasaban de mano en mano, llegaban a negocios y ayudaban a conseguir nuevos bailes. Anthony mismo contó que repartía su música para que la gente comenzara a conocerlo. No había una gran campaña. Había insistencia: una cinta, un negocio, un baile, otro pueblo.',
        mediaPlaceholder: 'ARTE / ARTEFACTO · cassette temprano / cinta circulando en un negocio',
        note: 'la canción viajó primero',
      },
    },
  ),
  notebookPage(
    { id: 'voy-palla', n: 8, kind: 'clipping' },
    {
      es: {
        eyebrow: 'Principios de los noventa',
        title: "Voy Pa’llá",
        body: 'Entre aquellas canciones estaba “Voy Pa’llá”. La canción no se quedó en el circuito donde había nacido. Comenzó a sonar y siguió creciendo. Una bachata que todavía encontraba puertas cerradas en la radio y en la industria empezó a cruzarlas. Anthony la recordaría de una manera sencilla: fue la canción que lo levantó. La que lo sacó de la pobreza.',
        mediaPlaceholder: 'ARTEFACTO / ARTE · Voy Pa’llá / primera producción',
        note: 'el momento en que cambió la escala',
      },
    },
  ),
  notebookPage(
    { id: 'television', n: 9, kind: 'photo' },
    {
      es: {
        eyebrow: '1992',
        title: 'De los caminos a la televisión',
        body: 'Para 1992, el hombre que poco antes recorría pueblos tratando de conseguir bailes ya aparecía en la televisión nacional. En El Show del Mediodía, Anthony Santos interpretó “Voy Pa’llá”. Del campo, los instrumentos improvisados, la güira, las motocicletas, los bailes pequeños y las cintas pasadas de negocio en negocio, a una pantalla vista en todo el país.',
        mediaPlaceholder: 'IMAGEN · El Show del Mediodía, 1992',
        caption: 'Pendiente: frame de la presentación y crédito de la fuente.',
      },
    },
  ),
  notebookPage(
    { id: 'el-comienzo', n: 10, kind: 'text' },
    {
      es: {
        eyebrow: 'El comienzo',
        title: 'Voy Pa’llá',
        body: 'No fue el final de la historia. Fue el momento en que la historia cambió de escala. Anthony ya no era solamente uno de los músicos de la Línea buscando dónde tocar. Ahora había un público esperando por él. Vendrían discos, rivalidades, grandes escenarios y una influencia que transformaría la bachata. Pero antes del Mayimbe estuvo el muchacho del campo que hacía música con lo que tenía. Y cuando por fin tuvo una canción capaz de llevarlo más lejos, la llamó: Voy Pa’llá.',
        note: 'de aquí en adelante, todo cambia',
      },
    },
  ),
]
