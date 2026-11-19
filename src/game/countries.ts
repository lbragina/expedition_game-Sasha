// Itinéraire : combien de pays restent à ouvrir (la logique du jeu lit toujours COUNTRIES, rien n'est écrit en dur).
import { COUNTRIES } from '../data/countries'
import type { SaveState } from '../types'

/** Seuil à partir duquel on prévient le parent qu'il faut charger un nouveau pack de pays. */
export const PACK_LOW_THRESHOLD = 2

export function countriesLeft(state: SaveState): number {
  return COUNTRIES.filter((c) => !state.visited.includes(c.id)).length
}

export function packNeeded(state: SaveState): boolean {
  return countriesLeft(state) <= PACK_LOW_THRESHOLD
}
