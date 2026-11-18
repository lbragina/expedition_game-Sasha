// Elo simplifié, caché pour l'enfant.
// Une tâche de difficulté d a une « cote » de 800 + 100·d.
// On vise ~75 % de réussite (couloir 70–80 %) : cote de la tâche ≈ niveau − 190.

export const START_RATING = 1200 // ≈ niveau CM2 (difficulté ≈ 2)

export const taskRating = (difficulty: number) => 800 + 100 * difficulty

export function expectedScore(rating: number, difficulty: number): number {
  return 1 / (1 + Math.pow(10, (taskRating(difficulty) - rating) / 400))
}

export function updateRating(rating: number, difficulty: number, actual: number, k = 24): number {
  return rating + k * (actual - expectedScore(rating, difficulty))
}

export function targetDifficulty(rating: number): number {
  return Math.min(10, Math.max(1, (rating - 990) / 100))
}
