// Vérifie que toutes les clés t('...') utilisées dans le code existent dans fr.json.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const fr = JSON.parse(readFileSync(join(root, 'i18n', 'fr.json'), 'utf8'))
const exists = (key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), fr) !== undefined

const files = []
const walk = (d) =>
  readdirSync(d).forEach((f) => {
    const p = join(d, f)
    statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) && files.push(p)
  })
walk(root)

let missing = 0
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/\bt(?:List|Obj)?(?:<[^>]*>)?\(\s*(['`])([^'`]+)\1/g)) {
    const key = m[2]
    if (key.includes('${')) {
      // clé dynamique : on teste chaque valeur possible connue
      continue
    }
    if (!exists(key)) {
      console.error(`❌ clé absente de fr.json : ${key}   (${f.replace(root, 'src')})`)
      missing++
    }
  }
}
// clés dynamiques connues
const dyn = [
  ...['math', 'logic', 'iq', 'critical', 'world'].map((c) => `categories.${c}`),
  ...['week', 'month', 'all'].map((r) => `parent.range_${r}`),
  ...['wood', 'stone', 'iron', 'gold', 'diamond'].map((r) => `resources.${r}`),
  ...['1', '2', '3'].map((n) => `hints.level_${n}`),
  ...['rule_combo', 'rule_star', 'rule_workshop'].flatMap((k) => [`welcome.${k}`, `welcome.${k}_title`]),
  ...['grass', 'wood', 'stone', 'iron', 'gold', 'diamond', 'water', 'custom', 'house', 'tower', 'ramp', 'observatory', 'hall'].map((i) => `base.items.${i}`),
  ...['house', 'tower', 'ramp', 'observatory', 'hall'].map((i) => `base.desc.${i}`),
  ...['occupied', 'poor', 'unique', 'noart'].map((e) => `base.err_${e}`),
  ...['blocks', 'buildings'].map((x) => `base.tab_${x}`),
  ...['1', '2', '3'].flatMap((n) => [`workshop.room${n}_name`, `workshop.room${n}_desc`, `workshop.room${n}_unlock`, `workshop.room${n}_celebrate`]),
  ...['pencil', 'eraser', 'fill'].map((x) => `editor.tool_${x}`),
  'expedition.partial_value_ok',
  'expedition.partial_reason_ok',
  'nav.expedition',
  'nav.map',
  'nav.base',
  'nav.parent',
]
dyn.forEach((k) => {
  if (!exists(k)) {
    console.error(`❌ clé dynamique absente : ${k}`)
    missing++
  }
})
console.log(missing ? `\n${missing} clé(s) manquante(s)` : '✅ Toutes les clés de texte existent dans fr.json')
process.exit(missing ? 1 : 0)
