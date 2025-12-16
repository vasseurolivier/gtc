
import 'server-only'

// We are defining the dictionaries directly here for simplicity.
// In a real-world scenario, these would be in their own JSON files.
const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  fr: () => import('@/dictionaries/fr.json').then((module) => module.default),
}

export const getDictionary = async (locale: 'fr' | 'en') => {
  // We default to 'fr' if the locale is not 'en'.
  // This is a safeguard against invalid locales.
  return locale === 'en' ? dictionaries.en() : dictionaries.fr()
}
