# Тренажёр РМ — статический квиз для подготовки к экзамену

7 тестов по госам (346 вопросов). Vanilla HTML/CSS/JS, без бэка. Прогресс в `localStorage`.

## Локальный запуск

```bash
python3 -m http.server 8765
# открыть http://localhost:8765/
```

(Просто открыть `index.html` двойным кликом не сработает — браузер заблокирует загрузку `data.js` из-за CORS. Нужен HTTP-сервер.)

## Деплой на GitHub Pages

### Один раз (создание репо и первый пуш)

```bash
cd /Users/iv.a.vasilev/dev/private_research/gosy_trainer
git init
git add .
git commit -m "Initial: тренажёр РМ"
git branch -M main
# Создай репо `gosy-trainer` в GitHub UI (Public), затем:
git remote add origin git@github.com:VanyaVanchez/gosy-trainer.git
git push -u origin main
```

Далее в GitHub: **Settings** → **Pages** → **Build and deployment**:
- Source: **Deploy from a branch**
- Branch: **main** / **/ (root)**
- Save

Через 30-60 секунд сайт доступен на `https://vanyavanchez.github.io/gosy-trainer/`.

### Последующие правки

```bash
git add .
git commit -m "Что изменил"
git push
```

GitHub Pages пересоберёт сайт сам через ~30 сек.

## Структура

- `index.html` — точка входа, тонкий шаблон
- `style.css` — все стили, минималистично
- `app.js` — вся логика (роутинг, рендеринг, состояние, скоринг)
- `data.js` — `window.QUESTIONS` (346 вопросов с ID `tN-NNN`)
- `images/` — 3 png для вопросов с формулами/схемами
- `.nojekyll` — отключает Jekyll-обработку на GitHub Pages

## Логика квиза

- **MC** (322 вопроса): варианты перемешиваются, по клику видно правильный/неправильный, переход вручную «Дальше».
- **Open** (6 вопросов с открытым ответом): ввод текста, сравнение нормализованных строк (lowercase, `ё→е`, `,→.`, схлопывание пробелов).
- **Matching** (18 вопросов): дропдаун с правильными вариантами для каждого пункта; для 1 особого случая ("Расставьте по порядку") — текстовый ввод последовательности цифр.

## Состояние в localStorage (ключ `gosy-trainer:v1`)

```js
{
    mistakes: { "t1-001": { wrongCount: 2 }, ... },  // ошибочные вопросы
    bestScores: { "1": 38, "2": 25, ... },             // лучший счёт по каждому тесту
    attempts: { "1": 5, ... }                          // сколько раз проходил
}
```

Очистить прогресс: в консоли браузера `localStorage.removeItem("gosy-trainer:v1")`.

## Если нужно регенерировать data.js

База вопросов лежит в `quiz_export/questions.json` (родительская папка). Скрипт регенерации:

```bash
python3 << 'EOF'
# см. историю чата — короткий скрипт, который собирает data.js из questions.json
EOF
```

## Что НЕ реализовано (на будущее)

- Cross-device sync — нужен бэкенд (Supabase, ~2 ч)
- Spaced repetition — алгоритм Лейтнера / SM-2 (~2-3 ч)
- Ввод своих баз вопросов через UI (~5+ ч)
- Темная тема
- Экспорт ошибок в текстовый файл
