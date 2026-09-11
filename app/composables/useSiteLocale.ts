export const SITE_LOCALES = ['es', 'en'] as const

export type SiteLocale = typeof SITE_LOCALES[number]

export const DEFAULT_SITE_LOCALE: SiteLocale = 'es'

export function siteLocaleFromPath(path: string): SiteLocale {
  return path === '/en' || path.startsWith('/en/') ? 'en' : DEFAULT_SITE_LOCALE
}

function splitPathSuffix(path: string) {
  const suffixIndex = path.search(/[?#]/)

  if (suffixIndex < 0) {
    return { pathname: path || '/', suffix: '' }
  }

  return {
    pathname: path.slice(0, suffixIndex) || '/',
    suffix: path.slice(suffixIndex),
  }
}

export function stripSiteLocalePrefix(path: string): string {
  const { pathname, suffix } = splitPathSuffix(path)

  if (pathname === '/en') return `/${suffix}`
  if (pathname.startsWith('/en/')) return `${pathname.slice(3)}${suffix}`

  return `${pathname}${suffix}`
}

export function siteLocalePath(path: string, locale: SiteLocale): string {
  const { pathname, suffix } = splitPathSuffix(stripSiteLocalePrefix(path))
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`

  if (locale === DEFAULT_SITE_LOCALE) {
    return `${normalizedPath}${suffix}`
  }

  return normalizedPath === '/'
    ? `/en${suffix}`
    : `/en${normalizedPath}${suffix}`
}

export function useSiteLocale() {
  const route = useRoute()
  const preferredLocale = useCookie<SiteLocale | null>('mayimbe-locale', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const locale = computed<SiteLocale>(() => siteLocaleFromPath(route.path))

  function pathFor(path: string, targetLocale: SiteLocale = locale.value) {
    return siteLocalePath(path, targetLocale)
  }

  function rememberLocale(targetLocale: SiteLocale = locale.value) {
    preferredLocale.value = targetLocale
  }

  async function switchLocale(targetLocale: SiteLocale) {
    rememberLocale(targetLocale)
    return navigateTo(pathFor(route.fullPath, targetLocale))
  }

  return {
    locale,
    preferredLocale,
    pathFor,
    rememberLocale,
    switchLocale,
  }
}
