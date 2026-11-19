// Actions de la Saison qui sauvegardent l'état.
import { REWARD_TIERS, TIERS, TIER_POINTS, addSeasonPoints, defaultSeason } from './seasonData'
import { update } from './store'

/** Sasha marque son cadeau comme reçu (l'écran demande d'abord le PIN d'un parent). */
export function claimTier(tier: number) {
  update((d) => {
    if (REWARD_TIERS.includes(tier) && !d.season.claimed.includes(tier)) d.season.claimed.push(tier)
  })
}

export function setReward(tier: number, text: string) {
  update((d) => {
    d.season.rewards[String(tier)] = text.slice(0, 80)
  })
}

/** Nouvelle saison : points, paliers et défis repartent de zéro ; les cadeaux écrits par le parent sont gardés. */
export function newSeason() {
  update((d) => {
    const fresh = defaultSeason()
    d.season = { ...fresh, id: d.season.id + 1, rewards: d.season.rewards }
  })
}

/** Outil de test du parent. */
export function giveSeasonPoints(n = TIER_POINTS) {
  update((d) => {
    addSeasonPoints(d, Math.min(n, TIERS * TIER_POINTS))
  })
}
