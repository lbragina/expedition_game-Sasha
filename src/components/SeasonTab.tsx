import { useState } from 'react'
import { claimTier } from '../game/season'
import {
  CHALLENGES,
  CHALLENGE_BONUS,
  REWARD_TIERS,
  TIERS,
  TIER_POINTS,
  daysToMonday,
  parseSecret,
  tierGift,
  tierOf,
} from '../game/seasonData'
import { sfx } from '../game/sound'
import { useGame } from '../game/store'
import { t } from '../i18n'
import PinModal from './PinModal'

const RES_ICON: Record<string, string> = { wood: '🪵', stone: '🪨', iron: '⛓️', gold: '🪙', diamond: '💎' }

function giftLabel(tier: number): string {
  const g = tierGift(tier)
  if (g.compass) return `🧭 +${g.compass}`
  if (g.resource) return `${RES_ICON[g.resource.key]} +${g.resource.amount}`
  return ''
}

export default function SeasonTab() {
  const s = useGame()
  const se = s.season
  const tier = tierOf(se.points)
  const full = tier >= TIERS
  const into = full ? TIER_POINTS : se.points % TIER_POINTS
  const [claiming, setClaiming] = useState<number | null>(null)

  return (
    <div className="space-y-3 pt-3">
      <h2 className="font-pixel text-xl font-bold text-gold">🏅 {t('season.title', { n: se.id })}</h2>

      <div className="card space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="font-pixel text-lg font-bold">{t('season.tier', { tier, total: TIERS })}</span>
          <span className="text-xs text-mute">{t('season.points', { points: se.points })}</span>
        </div>
        <div className="h-4 overflow-hidden rounded border-2 border-black bg-night">
          <div className="h-full bg-gold transition-all" style={{ width: `${full ? 100 : Math.round((into / TIER_POINTS) * 100)}%` }} />
        </div>
        <p className="text-xs text-mute">
          {full ? t('season.complete') : t('season.next', { left: TIER_POINTS - into, tier: tier + 1 })}
        </p>
        <p className="text-xs text-mute">{t('season.how')}</p>
      </div>

      <div className="card space-y-2">
        <h3 className="font-bold text-diamond">⚡ {t('season.challenges_title')}</h3>
        {CHALLENGES.map((c) => {
          const n = Math.min(c.target, se.progress[c.id] ?? 0)
          const done = se.done.includes(c.id)
          return (
            <div key={c.id} className={`rounded-lg border-2 p-2 ${done ? 'border-ok' : 'border-line'}`}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {c.icon} {t(`season.ch_${c.id}`, { target: c.target })}
                </span>
                <span className="shrink-0 font-bold text-gold">{done ? '✅' : `${n}/${c.target}`}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded border border-black bg-night">
                <div className={`h-full ${done ? 'bg-ok' : 'bg-diamond'}`} style={{ width: `${(n / c.target) * 100}%` }} />
              </div>
              <div className="mt-0.5 text-right text-[10px] text-mute">{t('season.ch_bonus', { points: CHALLENGE_BONUS })}</div>
            </div>
          )
        })}
        <p className="text-xs text-mute">{t('season.challenges_reset', { days: daysToMonday(s.today.date) })}</p>
      </div>

      <div className="card space-y-1">
        <h3 className="font-bold text-diamond">🛤️ {t('season.track_title')}</h3>
        <p className="pb-1 text-xs text-mute">{t('season.track_help')}</p>
        {Array.from({ length: TIERS }, (_, i) => i + 1).map((n) => {
          const reached = n <= tier
          const prize = REWARD_TIERS.includes(n)
          const claimed = se.claimed.includes(n)
          const raw = se.rewards[String(n)]?.trim() ?? ''
          const sec = parseSecret(raw)
          const hidden = sec.secret && tier < n
          const text = sec.text
          return (
            <div
              key={n}
              className={`flex items-center gap-2 rounded-lg border-2 p-2 ${
                prize ? 'border-gold bg-panel2' : 'border-line'
              } ${reached && !prize ? 'opacity-60' : ''} ${n === tier + 1 ? 'ring-2 ring-diamond' : ''}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border-2 border-black font-pixel text-sm font-bold ${
                  reached ? 'bg-gold text-black' : 'bg-night text-mute'
                }`}
              >
                {n}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                {prize ? (
                  <>
                    <div className="font-bold text-gold">
                      🎁 {hidden ? t('season.mystery') : text || t('season.reward_default')}
                    </div>
                    {hidden && <div className="text-[11px] text-mute">{t('season.mystery_hint')}</div>}
                    <div className="text-[11px] text-mute">{giftLabel(n)}</div>
                  </>
                ) : (
                  <span className={reached ? 'text-ok' : ''}>{giftLabel(n)}</span>
                )}
              </div>
              <div className="shrink-0 text-right text-xs">
                {prize ? (
                  claimed ? (
                    <span className="font-bold text-ok">✅ {t('season.claimed')}</span>
                  ) : reached ? (
                    <button
                      className="btn btn-gold !min-h-[36px] text-xs"
                      onClick={() => {
                        sfx.unlock()
                        sfx.click()
                        setClaiming(n)
                      }}
                    >
                      {t('season.claim')}
                    </button>
                  ) : (
                    <span className="text-mute">🔒</span>
                  )
                ) : reached ? (
                  <span className="text-ok">✔</span>
                ) : (
                  <span className="text-mute">🔒</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {claiming !== null && (
        <PinModal
          prompt={t('season.pin_prompt')}
          onSuccess={() => {
            claimTier(claiming)
            sfx.star()
            setClaiming(null)
          }}
          onCancel={() => setClaiming(null)}
        />
      )}
    </div>
  )
}
