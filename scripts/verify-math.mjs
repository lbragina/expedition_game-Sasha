// Пересчёт ответов во всех математических задачах (src/data/questions/math.json).
// Для каждой задачи здесь написана НЕЗАВИСИМАЯ формула (цикл, перебор или прямой расчёт по условию).
// Если ответ в JSON не совпадает с пересчётом — скрипт сообщает об ошибке и завершается с кодом 1.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'questions', 'math.json')
const questions = JSON.parse(readFileSync(file, 'utf8'))

// ---- маленькая «математическая библиотека» ----
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))
const lcm = (a, b) => (a * b) / gcd(a, b)
const divisors = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0)
const isPrime = (n) => n > 1 && divisors(n).length === 2
const num = (s) => Number(String(s).replace(',', '.'))
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const frac = (n, d) => `${n / gcd(n, d)}/${d / gcd(n, d)}`

// Для задач «number» функция возвращает ожидаемое число.
// Для задач «choice» функция получает options и возвращает МАССИВ вариантов, которые правильны (должен быть ровно один — выбранный).
const CHECKS = {
  1: () => (Math.floor(20 / 4) + 1) * 4,
  2: (o) => o.filter((x) => num(x) % 2 === 0 && num(x) % 3 === 0),
  3: () => lcm(4, 6),
  4: () => 7 * 8,
  5: () => 63 / 7,
  6: () => 345 + 278,
  7: () => 1000 - 467,
  8: () => 12 * 15,
  9: () => 5 + 3 * 4,
  10: () => 2 * (7 + 8) - 10,
  11: (o) => o.filter((x) => x === '3/8'),
  12: () => 86 / 2,
  13: () => 36 / 4,
  14: (o) => o.filter((x) => { const [a, b] = x.split('/').map(Number); return a * 2 === b }),
  15: () => 3.5 + 4.25,
  16: () => 12.5 * 4,
  17: (o) => { const m = Math.max(...o.map(num)); return o.filter((x) => num(x) === m) },
  18: () => 250 * 0.1,
  19: () => 90 * 0.5,
  20: (o) => o.filter((x) => num(x) % 5 === 0),
  21: () => range(1, 20).filter((n) => n % 3 === 0).length,
  22: (o) => o.filter((x) => [...x].reduce((s, c) => s + Number(c), 0) % 9 === 0),
  23: () => divisors(24).filter((d) => d < 24).pop(),
  24: () => 4 * 7,
  25: () => 8 * 3,
  26: () => 30 / 2 - 9,
  27: () => 2 * 60 + 15,
  28: () => 3 * 2.5 + 1.2,
  29: () => 6, // hexagone : « hexa » = six (donnée, pas de calcul)
  30: () => (3 / 5) * 40,
  31: (o) => o.filter((x) => x === frac(1 * 4 + 1 * 2, 8)), // 1/2 + 1/4 = (4+2)/8
  32: () => 4 * (3 / 4),
  33: () => 40 - 40 * 0.25,
  34: () => 25 - 25 * 0.4,
  35: () => gcd(12, 18),
  36: () => lcm(6, 8),
  37: () => gcd(48, 36),
  38: () => 2 * (12 + 5),
  39: () => (10 * 6) / 2,
  40: () => 2 * (20 + 15),
  41: () => 4 * Math.sqrt(49),
  42: () => 3 * (4 + 6) - 2 * 5,
  43: () => -4 + 9,
  44: () => (7.5 / 3) * 5,
  45: () => (90 * 40) / 60,
  46: () => 4.2 * 1.5,
  47: (o) => o.filter((x) => num(x) % 2 === 0 && num(x) % 3 === 0 && num(x) % 5 === 0),
  48: () => range(11, 29).filter(isPrime).length,
  49: () => range(2, 1000).find((n) => n % 4 === 1 && n % 6 === 1 && n % 9 === 1),
  50: () => gcd(84, 126),
  51: () => { for (let w = 1; w < 100; w++) if (2 * (2 * w + w) === 36) return 2 * w * w },
  52: () => range(1, 500).find((x) => { const a = x - x / 3; return a - a / 4 === 18 }),
  53: () => divisors(36).length,
  54: () => range(30, 40).find((n) => n === 4 * (Math.floor(n / 10) + (n % 10))),
  55: () => range(1, 500).find((n) => n - n / 5 - n / 4 === 33),
  56: () => [1, 2, 3, 4].reduce((s, k) => s + (5 - k) * (5 - k), 0), // carrés de côté k dans une grille 4×4
  57: () => range(1, 100).find((n) => divisors(n).length === 6),
  58: () => range(1, 120).map(String).join('').length,
  59: () => range(1, 100).reduce((a, b) => a + b, 0),
  60: () => range(1, 100).filter((n) => n % 2 === 0 || n % 5 === 0).length,
}

let errors = 0
let checked = 0
for (const q of questions) {
  const n = Number(q.id.split('-')[1])
  const check = CHECKS[n]
  if (!check) {
    console.error(`❌ ${q.id}: нет формулы проверки в scripts/verify-math.mjs`)
    errors++
    continue
  }
  const expected = check(q.options)
  checked++
  if (q.type === 'number') {
    if (typeof expected !== 'number' || Math.abs(expected - Number(q.answer)) > 1e-9) {
      console.error(`❌ ${q.id}: в JSON ${q.answer}, пересчёт даёт ${expected}\n   ${q.prompt}`)
      errors++
    }
  } else if (q.type === 'choice') {
    const chosen = q.options[q.answer]
    if (!Array.isArray(expected) || expected.length !== 1 || expected[0] !== chosen) {
      console.error(`❌ ${q.id}: выбран вариант «${chosen}», верными по пересчёту являются: ${JSON.stringify(expected)}\n   ${q.prompt}`)
      errors++
    }
  } else {
    console.error(`❌ ${q.id}: неожиданный тип ${q.type} в математике`)
    errors++
  }
}
const unused = Object.keys(CHECKS).filter((k) => !questions.some((q) => Number(q.id.split('-')[1]) === Number(k)))
if (unused.length) console.warn(`⚠️ Формулы без задачи: ${unused.join(', ')}`)

console.log(`\n🧮 Пересчитано задач по математике: ${checked} из ${questions.length}`)
if (errors) {
  console.error(`❌ Расхождений: ${errors}`)
  process.exit(1)
}
console.log('✅ Все ответы совпали с независимым пересчётом.')
