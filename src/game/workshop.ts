// Atelier ??? : ouverture progressive des 3 salles.
import type { SaveState } from '../types'
import { getMode, levelOf } from './progress'
import { update } from './store'

export type Room = 1 | 2 | 3
export const ROOMS: Room[] = [1, 2, 3]
/** Niveau affiché 10 = niveau interne 9. */
export const ROOM2_LEVEL = 10

/** Vraies conditions : 1) fin de l'échauffement · 2) niveau 10 · 3) première tâche ★★★ résolue. */
export function roomReallyOpen(s: SaveState, room: Room): boolean {
  if (room === 1) return !getMode(s).warmup
  if (room === 2) return levelOf(s.xp) + 1 >= ROOM2_LEVEL
  return Object.values(s.base.trophies).some((t) => t.stars === 3)
}

export function roomOpen(s: SaveState, room: Room): boolean {
  return s.workshop.parentUnlock || roomReallyOpen(s, room)
}

/** Salles ouvertes dont l'écran de fête n'a pas encore été montré. */
export function pendingCelebrations(s: SaveState): Room[] {
  return ROOMS.filter((r) => roomOpen(s, r) && !s.workshop.celebrated.includes(r))
}

export function markCelebrated(room: Room) {
  update((d) => {
    if (!d.workshop.celebrated.includes(room)) d.workshop.celebrated.push(room)
  })
}

/** Outil du parent : ouvre (ou referme) toutes les salles pour tester. À la fermeture, les fêtes « fausses » sont oubliées. */
export function setParentUnlock(on: boolean) {
  update((d) => {
    d.workshop.parentUnlock = on
    if (!on) {
      d.workshop.celebrated = d.workshop.celebrated.filter((r) => roomReallyOpen(d, r as Room))
    }
  })
}

export function saveSkin(art: string) {
  update((d) => {
    d.workshop.skin = art
  })
}
export function saveDeck(art: string) {
  update((d) => {
    d.workshop.deck = art
  })
}
export function saveBlock(art: string, name: string) {
  update((d) => {
    d.workshop.block = art
    d.workshop.blockName = name.trim().slice(0, 16)
  })
}

/** Outil du parent : +10 de chaque ressource pour tester la construction. */
export function giveTestResources() {
  update((d) => {
    ;(['wood', 'stone', 'iron', 'gold', 'diamond'] as const).forEach((k) => (d.resources[k] += 10))
  })
}
