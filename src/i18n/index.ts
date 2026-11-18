import fr from './fr.json'

type Dict = Record<string, unknown>

// Aujourd'hui une seule langue (fr). Pour ajouter ru.json ou en.json :
// importer le fichier et choisir le dictionnaire selon la langue.
const dict: Dict = fr as Dict

function lookup(key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Dict)[part]
    return undefined
  }, dict)
}

/** Texte traduit. Les {{variables}} sont remplacées par `params`. */
export function t(key: string, params?: Record<string, string | number>): string {
  const value = lookup(key)
  if (typeof value !== 'string') return key
  if (!params) return value
  return value.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`,
  )
}

/** Liste de textes (ranks, combo.tricks…). */
export function tList(key: string): string[] {
  const value = lookup(key)
  return Array.isArray(value) ? (value as string[]) : []
}

/** Objet traduit (ex. un pays). */
export function tObj<T = Dict>(key: string): T | undefined {
  const value = lookup(key)
  return value && typeof value === 'object' ? (value as T) : undefined
}
