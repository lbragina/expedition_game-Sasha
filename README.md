# L'Expédition — Этап 1 (MVP)

Офлайн PWA-игра (Vite + React + TypeScript + Tailwind). Тексты интерфейса — в `src/i18n/fr.json`, задачи — в `src/data/questions/*.json`.

## Запуск на компьютере

Нужен Node.js 20 (на macOS 13.0 новее 20-й версии не встанет). В папке `.tools/node` лежит портативная копия — можно использовать её:

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
npm run dev        # открыть http://localhost:5173
```

## Команды

| Команда | Что делает |
| :-- | :-- |
| `npm run dev` | игра в режиме разработки |
| `npm run build` | собирает готовую версию в `dist/` |
| `npm run preview` | запускает собранную версию (проверка PWA/офлайна) |
| `npm run validate` | проверяет файлы задач и ссылки `ladder` |
| `npm run verify-math` | независимо пересчитывает ответы всех 60 задач по математике |
| `npm run check-i18n` | проверяет, что все тексты есть в `fr.json` |
| `npm run icons` | перерисовывает иконки в `public/` |

## Публикация на GitHub Pages

1. Создать репозиторий на github.com, загрузить в него содержимое этой папки (без `.tools`, `node_modules`, `dist` — они в `.gitignore`).
2. В репозитории: Settings → Pages → Source: **GitHub Actions**.
3. Любой push в ветку `main` запускает `.github/workflows/deploy.yml` и публикует игру по адресу `https://<ник>.github.io/<репозиторий>/`.
4. На iPhone открыть адрес в Safari → «Поделиться» → «На экран Домой».

## Что в папке `_originals`

Исходные `SPEC.md`, `fr.json`, `validate-questions.js` были сохранены в формате RTF; их оригиналы лежат здесь, а рабочие чистые версии — в корне и в `src/i18n/`.
