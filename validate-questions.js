const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, 'src', 'data', 'questions');
const CATEGORIES = ['math', 'logic', 'iq', 'critical', 'world', 'science'];
const TYPES = ['number', 'choice', 'boolean_explain', 'order', 'highlight'];

function validate() {
  if (!fs.existsSync(QUESTIONS_DIR)) {
    console.error('❌ Папка не найдена:', QUESTIONS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  let allQuestions = [];
  const ids = new Set();
  let errors = 0;

  files.forEach(file => {
    const raw = fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error(`❌ Ошибка синтаксиса JSON в файле ${file}:`, e.message);
      errors++;
      return;
    }

    if (!Array.isArray(data)) {
      console.error(`❌ Файл ${file} должен содержать массив задач [...]`);
      errors++;
      return;
    }

    data.forEach((q, idx) => {
      const prefix = `[${file} #${idx} (${q.id || 'NO_ID'})]`;

      if (!q.id) { console.error(`${prefix} Отсутствует id`); errors++; }
      if (ids.has(q.id)) { console.error(`${prefix} Дубликат id!`); errors++; }
      ids.add(q.id);

      const required = ['category', 'topic', 'difficulty', 'type', 'prompt', 'answer', 'explanation'];
      required.forEach(field => {
        if (q[field] === undefined || q[field] === null || q[field] === '') {
          console.error(`${prefix} Пустое обязательное поле: ${field}`);
          errors++;
        }
      });

      if (q.difficulty < 1 || q.difficulty > 10) {
        console.error(`${prefix} Сложность должна быть от 1 до 10 (сейчас: ${q.difficulty})`);
        errors++;
      }

      if (q.type === 'choice' && (!Array.isArray(q.options) || q.options.length !== 4)) {
        console.error(`${prefix} Для типа choice нужно ровно 4 варианта в options`);
        errors++;
      }

      if (q.category && !CATEGORIES.includes(q.category)) { console.error(`${prefix} Неизвестная категория: ${q.category}`); errors++; }
      if (q.type && !TYPES.includes(q.type)) { console.error(`${prefix} Неизвестный тип: ${q.type}`); errors++; }
      if (q.type === 'choice' && !(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3)) { console.error(`${prefix} Для choice answer — индекс 0–3`); errors++; }
      if (q.type === 'order' && (!Array.isArray(q.options) || q.options.length !== 4)) { console.error(`${prefix} Для order нужно 4 карточки в options (в правильном порядке)`); errors++; }
      if (q.type === 'highlight' && (!Array.isArray(q.options) || !Number.isInteger(q.answer) || q.answer >= q.options.length)) { console.error(`${prefix} Для highlight: options — предложения, answer — индекс`); errors++; }
      if (q.type === 'boolean_explain') { const a = q.answer || {}; if (!Array.isArray(q.options) || typeof a.value !== 'boolean' || !Number.isInteger(a.reason) || a.reason >= q.options.length) { console.error(`${prefix} Для boolean_explain: answer = {value, reason}`); errors++; } }
      if (q.type === 'number' && Number.isNaN(Number(q.answer))) { console.error(`${prefix} Для number answer должен быть числом`); errors++; }

      if (q.difficulty >= 4 && (!Array.isArray(q.hints) || q.hints.length < 3)) {
        console.error(`${prefix} Для сложности 4+ обязательно 3 уровня подсказок (hints)`);
        errors++;
      }

      allQuestions.push(q);
    });
  });

  // Проверка связей в лесенках (ladder): задача существует, из той же категории и строго легче
  const byId = new Map(allQuestions.map(q => [q.id, q]));
  allQuestions.forEach(q => {
    if (q.difficulty >= 4 && !(Array.isArray(q.ladder) && q.ladder.length >= 1 && q.ladder.length <= 2)) {
      console.error(`❌ [${q.id}] Для сложности 4+ нужен ladder из 1–2 более лёгких задач`);
      errors++;
    }
    if (Array.isArray(q.ladder)) {
      q.ladder.forEach(stepId => {
        const step = byId.get(stepId);
        if (!step) {
          console.error(`❌ [${q.id}] Ссылка в ladder на несуществующую задачу: ${stepId}`);
          errors++;
        } else {
          if (step.category !== q.category) { console.error(`❌ [${q.id}] ladder ${stepId} из другой категории`); errors++; }
          if (step.difficulty >= q.difficulty) { console.error(`❌ [${q.id}] ladder ${stepId} не легче задачи (${step.difficulty} ≥ ${q.difficulty})`); errors++; }
        }
      });
    }
    // звёзды: 5–6 → 0/1, 7–8 → 2, 9–10 → 3
    const okStars = q.difficulty <= 4 ? q.stars === 0 : q.difficulty <= 6 ? (q.stars === 0 || q.stars === 1) : q.difficulty <= 8 ? q.stars === 2 : q.stars === 3;
    if (!okStars) { console.error(`❌ [${q.id}] Неверное число звёзд (${q.stars}) для сложности ${q.difficulty}`); errors++; }
  });

  // Каждая страна из COUNTRIES должна иметь riddle-/diary-/diary2- вопросы (игра подхватывает их по префиксу)
  const countriesSrc = fs.readFileSync(path.join(__dirname, 'src', 'data', 'countries.ts'), 'utf-8');
  const countryIds = [...countriesSrc.matchAll(/\{\s*id:\s*'([a-z_]+)'/g)].map(m => m[1]);
  countryIds.forEach(cid => {
    ['riddle', 'diary', 'diary2'].forEach(prefix => {
      if (!byId.has(`${prefix}-${cid}`)) { console.error(`❌ Для страны ${cid} нет вопроса ${prefix}-${cid}`); errors++; }
    });
  });
  const choices = allQuestions.filter(q => /^(riddle|diary2?)-/.test(q.id) && q.type === 'choice');
  const pos = [0, 1, 2, 3].map(i => choices.filter(q => q.answer === i).length);
  console.log(`Страны: ${countryIds.length} · правильные ответы в вопросах стран по индексам 0–3: ${pos.join(' / ')}`);
  if (choices.length >= 8 && Math.max(...pos) > Math.ceil(choices.length / 4) + Math.ceil(choices.length / 8)) {
    console.error('❌ Правильные ответы в вопросах стран распределены неравномерно — перемешайте варианты'); errors++;
  }

  // Пропорции банка (предупреждения, если банк полный — 150 задач)
  const count = (fn) => allQuestions.filter(fn).length;
  const cats = ['math', 'logic', 'iq', 'critical', 'world', 'science'];
  console.log('\nПо категориям: ' + cats.map(c => `${c} ${count(q => q.category === c)}`).join(' · '));
  console.log(`По сложности: лёгкие 1–3: ${count(q => q.difficulty <= 3)} · средние 4–6: ${count(q => q.difficulty >= 4 && q.difficulty <= 6)} · сложные 7–10: ${count(q => q.difficulty >= 7)}`);
  const types = ['number', 'choice', 'boolean_explain', 'order', 'highlight'];
  console.log('По типам: ' + types.map(t => `${t} ${count(q => q.type === t)}`).join(' · '));
  if (allQuestions.length === 150) {
    const target = { math: 60, logic: 25, iq: 20, critical: 25, world: 20 };
    cats.forEach(c => { if (count(q => q.category === c) !== target[c]) { console.error(`❌ Категория ${c}: ожидалось ${target[c]}`); errors++; } });
  }

  console.log(`\n📊 Проверено файлов: ${files.length}, всего задач: ${allQuestions.length}`);
  if (errors === 0) {
    console.log('✅ ИДЕАЛЬНО! Ошибок в структуре и связях не найдено.');
  } else {
    console.error(`❌ Найдено критических ошибок: ${errors}`);
    process.exit(1);
  }
}

validate();
