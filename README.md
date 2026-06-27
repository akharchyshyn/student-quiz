# student-quiz

Веб-приложение (PWA) для самопроверки студентов: тесты одной лентой, балл и
разбор в конце. Прогресс хранится на устройстве (localStorage). Серверного кода
нет — статика на nginx + база тестов в JSON.

Спека: `docs/superpowers/specs/2026-06-27-student-quiz-design.md`
План: `docs/superpowers/plans/2026-06-27-student-quiz.md`

## Разработка

    npm install
    npm run icons      # сгенерировать PWA-иконки (однократно)
    npm run dev        # дев-сервер
    npm test           # юнит-тесты core
    npm run build      # типы + прод-сборка

Требуется Node 20+ (в репозитории `.tool-versions` = nodejs 20.20.1).

## Запуск дома (Docker + Tailscale)

    docker compose up -d --build

Открыть с любого устройства в tailnet: `http://<tailscale-имя-машины>:8089`

Установка на домашний экран (PWA) требует HTTPS — отдать через Tailscale:

    tailscale serve --bg 8089

Затем открыть `https://<tailscale-имя-машины>` и «Добавить на экран».

## База тестов

Лежит в `tests/` (монтируется в контейнер как volume, read-only для контейнера —
правки делаются на хосте):

- `manifest.json` — `version`, `title`, и `tests` (порядок активных файлов).
- `test-XX.json` — `id`, `title`, `questions[]`.

Вопрос: `type` = `single` (radio, ровно 1 верный) или `multi` (checkbox,
засчитывается по точному совпадению). `correct` — массив id вариантов.

### Сменить базу

1. Заменить/добавить JSON-файлы в `tests/`, обновить `manifest.json`.
2. **Поднять `version`** в `manifest.json` — иначе у студентов останется старый
   прогресс поверх новых вопросов. При смене `version` приложение предложит
   начать заново.
3. Рестарт не нужен — nginx отдаёт `/tests/` с `no-store`.
