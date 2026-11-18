import { normalizeState, getState, replaceState, update } from '../game/store'
import type { SaveState } from '../types'

export function backupDue(state: SaveState): boolean {
  return state.expeditionsDone - state.backup.lastCount >= 5 && state.backup.promptedCount !== state.expeditionsDone
}

export function markPrompted() {
  update((d) => {
    d.backup.promptedCount = d.expeditionsDone
  })
}

function makeFile(): File {
  const s = getState()
  const name = `expedition-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
  return new File([JSON.stringify(s, null, 2)], name, { type: 'application/json' })
}

function reward() {
  update((d) => {
    d.backup.lastCount = d.expeditionsDone
    d.backup.lastAt = Date.now()
    d.compass += 1
  })
}

/** Menu « Partager » d'iOS ; sinon téléchargement du fichier. */
export async function saveBackup(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = makeFile()
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "L'Expédition" })
      reward()
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  reward()
  return 'downloaded'
}

export async function importBackup(file: File): Promise<boolean> {
  try {
    const data = JSON.parse(await file.text())
    if (!data || typeof data !== 'object' || data.version !== 1 || typeof data.xp !== 'number') return false
    replaceState(normalizeState(data))
    return true
  } catch {
    return false
  }
}
