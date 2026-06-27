# student-quiz

PWA для самопроверки студентов: **меню тем** → выбираешь тест → проходишь
(вопросы и варианты перемешаны) → балл с разбором → назад в меню. Прогресс
**не сохраняется** (тема каждый раз с чистого листа). Серверного кода нет —
статика на nginx + база тестов в JSON, доступ из tailnet по Tailscale.

Текущая база: «Підготовка КОРД» — 13 тем, ~122 вопроса (поліція, право, ПМ/Форт/
АКС, гранати, заходи безпеки, затримки, дослівні визначення).

Спека: `docs/superpowers/specs/2026-06-27-student-quiz-design.md`
План: `docs/superpowers/plans/2026-06-27-student-quiz.md`

## Разработка

    npm install
    npm run icons      # сгенерировать PWA-иконки (однократно)
    npm run dev        # дев-сервер
    npm test           # юнит-тесты core (vitest)
    npm run build      # типы + прод-сборка

Требуется Node 20+ (`.tool-versions` = nodejs 20.20.1).

## Запуск (Docker + Tailscale)

    docker compose up -d --build

Открыть с любого устройства в tailnet: `http://<tailscale-имя-машины>:8089`
(сейчас разворачивается на `mac-mini-artem`).

PWA-установка на домашний экран требует HTTPS:

    tailscale serve --bg 8089

затем `https://<tailscale-имя-машины>` → «Добавить на экран».

## База тестов

Лежит в `tests/` (монтируется в контейнер как volume, read-only; правки — на
хосте). Структура:

- `manifest.json` — `version`, `title`, `debug`, `tests` (порядок тем в меню).
- `test-XX.json` — `id`, `title`, `questions[]`.

Вопрос: `type` = `single` (radio, ровно 1 верный) или `multi` (checkbox, точное
совпадение). `correct` — массив id вариантов. `id` вопроса **уникален во всей
базе**.

### Сменить / добавить тесты

1. Изменить/добавить JSON в `tests/`, обновить список в `manifest.json`.
2. Проверить базу: `node` по правилам loader (или просто открыть приложение —
   битый JSON покажет понятную ошибку).
3. Данные подхватываются **live** (volume + `no-store`), рестарт не нужен.
   Изменения **кода** требуют `docker compose up -d --build`.

> Версия (`version`) теперь косметическая — прогресс не хранится, инвалидация не
> нужна.

### Дебаг-режим

Флаг `"debug"` в `manifest.json` (переключается подменой файла на сервере):

    # включить / выключить
    sed -i '' 's/"debug": false/"debug": true/' tests/manifest.json
    sed -i '' 's/"debug": true/"debug": false/' tests/manifest.json

При `true`: у вопроса виден уникальный `id` (рядом со счётчиком), в меню —
кнопка «Усі питання» (все вопросы с отмеченными верными), в вопросе — «Скинути».
**Дефолт в репозитории — `false`**; на сервере включается оперативно.

## Структура

    src/core/   types, loader, grader, shuffle  (+ *.test.ts)
    src/ui/     screens, app                     (+ screens.test.ts)
    tests/      manifest.json + test-01..13.json (volume; база)
    public/icons/                                 (PWA)
    Dockerfile, nginx.conf, compose.yaml
