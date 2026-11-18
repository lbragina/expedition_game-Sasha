// Position sur la carte (longitude, latitude) et emblème. Les textes sont dans fr.json → countries.<id>.
export interface CountryInfo {
  id: string
  emoji: string
  lon: number
  lat: number
  /** pays lié à un objectif de Sasha (carte : badge « ton objectif ») */
  goal?: boolean
}

export const COUNTRIES: CountryInfo[] = [
  { id: 'japan', emoji: '🗻', lon: 138, lat: 36, goal: true },
  { id: 'egypt', emoji: '🔺', lon: 30, lat: 27 },
  { id: 'brazil', emoji: '🌴', lon: -52, lat: -12 },
  { id: 'iceland', emoji: '🌋', lon: -19, lat: 65 },
  { id: 'peru', emoji: '🦙', lon: -75, lat: -10 },
  { id: 'kenya', emoji: '🦁', lon: 38, lat: 0 },
  { id: 'canada', emoji: '🍁', lon: -100, lat: 56 },
  { id: 'greece', emoji: '🏛️', lon: 22, lat: 39 },
]

export const countryById = (id: string) => COUNTRIES.find((c) => c.id === id)
