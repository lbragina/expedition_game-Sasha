import type { Question } from '../../types'

// Tous les fichiers .json de ce dossier sont chargés automatiquement.
const modules = import.meta.glob('./*.json', { eager: true, import: 'default' }) as Record<string, Question[]>

export const BUILT_IN_QUESTIONS: Question[] = Object.values(modules).flat()
