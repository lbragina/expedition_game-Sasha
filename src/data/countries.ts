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
  // --- Pack 1 : Europe proche, puis le monde ---
  { id: 'luxembourg', emoji: '🏰', lon: 6, lat: 49.6 },
  { id: 'france', emoji: '🗼', lon: 2, lat: 46 },
  { id: 'italy', emoji: '🍕', lon: 12, lat: 42 },
  { id: 'norway', emoji: '🛶', lon: 8, lat: 61 },
  { id: 'switzerland', emoji: '🏔️', lon: 8, lat: 47 },
  { id: 'spain', emoji: '💃', lon: -4, lat: 40 },
  { id: 'china', emoji: '🐉', lon: 104, lat: 35 },
  { id: 'india', emoji: '🕌', lon: 79, lat: 21 },
  { id: 'australia', emoji: '🦘', lon: 134, lat: -25 },
  { id: 'mexico', emoji: '🌵', lon: -102, lat: 23 },
  { id: 'morocco', emoji: '🐪', lon: -7, lat: 32 },
  { id: 'antarctica', emoji: '🐧', lon: 0, lat: -82 },
]

export const countryById = (id: string) => COUNTRIES.find((c) => c.id === id)
