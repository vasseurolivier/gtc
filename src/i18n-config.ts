export const i18n = {
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
} as const

export type Locale = (typeof i18n)['locales'][number]

export const defaultLocale = i18n.defaultLocale;
