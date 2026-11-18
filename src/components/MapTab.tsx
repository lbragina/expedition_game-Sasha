import { useEffect, useState } from 'react'
import { COUNTRIES } from '../data/countries'
import { findChest } from '../game/actions'
import { rollChests } from '../game/base'
import { sfx } from '../game/sound'
import { useGame } from '../game/store'
import { t, tObj } from '../i18n'
import { ChestArt } from './Sprites'

// Continents très simplifiés (x = longitude + 180, y = 90 − latitude)
const LAND = [
  '12,24 40,20 85,18 100,20 118,30 125,40 113,46 104,55 99,65 83,64 75,68 63,58 55,42 45,32 30,30 15,30', // Amérique du Nord
  '100,80 118,79 130,90 145,96 140,112 122,128 114,145 107,138 108,120 99,96', // Amérique du Sud
  '170,54 171,47 180,40 190,32 205,20 240,20 280,13 320,18 350,24 340,35 320,50 302,60 296,70 280,82 270,68 258,82 248,66 235,65 216,55 200,50', // Eurasie
  '163,69 175,54 190,53 212,59 223,78 231,79 220,105 213,116 200,125 192,108 189,86 172,86 163,76', // Afrique
  '293,112 310,102 322,101 333,117 326,128 310,122 295,124', // Australie
  '107,12 150,7 160,20 135,30 125,20', // Groenland
]

export default function MapTab() {
  const s = useGame()
  const [selected, setSelected] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // de temps en temps un petit coffre apparaît près d'un pays visité
  useEffect(() => {
    rollChests()
    const id = setInterval(rollChests, 60_000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(id)
  }, [toast])
  const fogs = Object.entries(s.fog)
  const log = [...s.log].reverse()

  const pos = (lon: number, lat: number) => ({ x: lon + 180, y: 90 - lat })

  return (
    <div className="space-y-3 pt-3">
      <h2 className="font-pixel text-xl font-bold text-gold">🗺️ {t('map.title')}</h2>

      <div className="card !p-2">
        <svg viewBox="0 0 360 180" className="w-full" shapeRendering="crispEdges">
          <rect width="360" height="180" fill="#0b1d33" />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 36} y1="0" x2={i * 36} y2="180" stroke="#16304f" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 36} x2="360" y2={i * 36} stroke="#16304f" strokeWidth="0.5" />
          ))}
          {LAND.map((p, i) => (
            <polygon key={i} points={p} fill="#2d4a35" stroke="#1d3324" strokeWidth="1" />
          ))}

          {COUNTRIES.map((c) => {
            const { x, y } = pos(c.lon, c.lat)
            const visited = s.visited.includes(c.id)
            return (
              <g key={c.id} onClick={() => setSelected(c.id === selected ? null : c.id)} className="cursor-pointer">
                <circle cx={x} cy={y} r="13" fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill={visited ? '#f5c518' : '#33415c'}
                  opacity={visited ? 0.25 : 0.5}
                  stroke={selected === c.id ? '#4de2e0' : 'none'}
                  strokeWidth="1.5"
                />
                <text x={x} y={y + 4} fontSize="12" textAnchor="middle" opacity={visited ? 1 : 0.35}>
                  {visited ? c.emoji : '❔'}
                </text>
              </g>
            )
          })}

          {s.chests.map((c, i) => {
            const info = COUNTRIES.find((x) => x.id === c.countryId)
            if (!info || c.found) return null
            const { x, y } = pos(info.lon, info.lat)
            return (
              <g
                key={i}
                transform={`translate(${x + c.x - 6} ${y + c.y - 6}) scale(0.75)`}
                opacity="0.9"
                className="cursor-pointer"
                onClick={() => {
                  sfx.unlock()
                  sfx.chest()
                  findChest(i)
                  setToast(t('map.chest_found'))
                }}
              >
                <rect x="-3" y="-2" width="22" height="20" fill="transparent" />
                <ChestArt x={0} y={0} />
              </g>
            )
          })}

          {fogs.map(([id], i) => {
            const x = 60 + ((i * 97) % 240)
            const y = 100 + ((i * 41) % 50)
            return (
              <g key={id} className="animate-floaty" onClick={() => setSelected('fog:' + id)}>
                <text x={x} y={y} fontSize="22" textAnchor="middle">
                  ☁️
                </text>
              </g>
            )
          })}
        </svg>
        <p className="mt-1 text-center text-[11px] text-mute">{t('map.hint_chests')}</p>
        {toast && <p className="animate-trick rounded-lg border-2 border-gold bg-night p-2 text-center text-sm font-bold text-gold">{toast}</p>}
      </div>

      {selected && !selected.startsWith('fog:') && <CountryCard id={selected} />}
      {selected?.startsWith('fog:') && s.fog[selected.slice(4)] && (
        <div className="card text-sm">
          ☁️ <b>{t('map.fog_title')}</b> — {t(`categories.${s.fog[selected.slice(4)].category}`)}. {t('map.fog_desc')}
        </div>
      )}

      <div className="card space-y-2">
        <h3 className="font-bold text-diamond">📖 {t('map.diary')}</h3>
        {log.length === 0 && <p className="text-sm text-mute">{t('map.diary_empty')}</p>}
        {log.map((e, i) => {
          const c = tObj<{ name: string; log: string }>(`countries.${e.countryId}`)
          const info = COUNTRIES.find((x) => x.id === e.countryId)
          return (
            <div key={i} className="border-t-2 border-line pt-2 first:border-0 first:pt-0">
              <div className="text-xs text-mute">
                {e.date} · {info?.emoji} {c?.name} · {e.correct}/{e.total}
              </div>
              <p className="text-sm italic">« {c?.log} »</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CountryCard({ id }: { id: string }) {
  const s = useGame()
  const c = tObj<{ name: string; fact: string; log: string }>(`countries.${id}`)
  const info = COUNTRIES.find((x) => x.id === id)
  const visited = s.visited.includes(id)
  if (!visited) {
    return (
      <div className="card text-sm">
        <b>❔ {t('map.unknown_country')}</b>
        <p>{t('map.unknown_desc')}</p>
      </div>
    )
  }
  const visits = s.log.filter((e) => e.countryId === id)
  const first = visits[0]
  return (
    <div className="card space-y-2 text-sm !border-gold">
      <h3 className="font-pixel text-lg font-bold text-gold">
        {info?.emoji} {c?.name}
      </h3>
      {info?.goal && (
        <p className="rounded-lg border-2 border-gold/70 bg-night p-2 font-bold text-gold">🎯 {t('map.goal_badge')}</p>
      )}
      <div>
        <div className="text-xs font-bold text-diamond">📖 {t('map.card_log')}</div>
        <p className="italic">« {c?.log} »</p>
        {first && (
          <p className="text-xs text-mute">
            {t('map.card_visit', { date: first.date, correct: first.correct, total: first.total })}
          </p>
        )}
      </div>
      <div>
        <div className="text-xs font-bold text-diamond">💡 {t('map.card_fact')}</div>
        <p>{c?.fact}</p>
      </div>
    </div>
  )
}
