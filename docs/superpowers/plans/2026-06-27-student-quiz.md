# student-quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Браузерное PWA для самопроверки студентов: тесты одной лентой, балл и разбор в конце; запускается в контейнере (OrbStack), доступно по Tailscale.

**Architecture:** Статичный SPA (Vite + TypeScript, vanilla) + nginx. База тестов — JSON-файлы в папке `tests/`, примонтированной как volume; смена базы = подмена файлов. Прогресс — в localStorage. Серверного кода нет. Архитектура A из спеки.

**Tech Stack:** Vite 6, TypeScript 5, vitest 3 (юнит-тесты `core`), vite-plugin-pwa (Workbox), nginx (alpine), Docker Compose, Tailscale.

**Spec:** `docs/superpowers/specs/2026-06-27-student-quiz-design.md`

**Фазы:** POC = Задачи 1–10 · MVP = Задача 11 · Финал = Задача 12. После каждой фазы — **обязательный гейт ручной приёмки пользователем** (Задачи 10, 11, 12).

---

## Task 1: Каркас проекта (Vite + TS + vitest + PWA)

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.tool-versions`, `index.html`, `src/main.ts`, `src/styles.css`, `scripts/make-icons.mjs`

- [ ] **Step 1: package.json**

```json
{
  "name": "student-quiz",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host",
    "test": "vitest run",
    "icons": "node scripts/make-icons.mjs"
  },
  "devDependencies": {
    "sharp": "^0.33.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vite-plugin-pwa/client"],
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 3: .tool-versions**

```
nodejs 22.11.0
```

- [ ] **Step 4: vite.config.ts** (dev-сервер отдаёт базу тестов из `tests/`; PWA с runtime-кэшем `/tests/`)

```ts
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Dev-only: отдаём базу тестов из верхнеуровневой папки tests/ по пути /tests/*
function serveTestsDir(): Plugin {
  return {
    name: 'serve-tests-dir',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/tests/')) return next();
        const rel = decodeURIComponent(req.url.split('?')[0].replace(/^\/tests\//, ''));
        if (rel.includes('..')) { res.statusCode = 400; return res.end('bad path'); }
        const file = join(process.cwd(), 'tests', rel);
        if (!existsSync(file)) { res.statusCode = 404; return res.end('not found'); }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(file));
      });
    },
  };
}

export default defineConfig({
  plugins: [
    serveTestsDir(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Тесты',
        short_name: 'Тесты',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0d6efd',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/tests/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'tests-base', expiration: { maxEntries: 50 } },
          },
        ],
      },
    }),
  ],
});
```

- [ ] **Step 5: index.html**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0d6efd" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <title>Тесты</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: src/main.ts**

```ts
import './styles.css';
import { mountApp } from './ui/app';

void mountApp(document.getElementById('app')!);
```

- [ ] **Step 7: src/styles.css** (минимум, мобильно)

```css
:root { --fg:#1a1a1a; --muted:#666; --primary:#0d6efd; --ok:#157347; --bad:#b02a37; --line:#e3e3e3; }
* { box-sizing: border-box; }
body { margin:0; font-family: system-ui, sans-serif; color: var(--fg); background:#fafafa; }
.screen { max-width: 680px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { font-size: 1.5rem; } h2 { font-size: 1.2rem; line-height: 1.35; }
.btn { display:block; width:100%; padding:14px; margin-top:12px; border:0; border-radius:12px;
  font-size:1rem; cursor:pointer; }
.btn.primary { background: var(--primary); color:#fff; }
.btn.primary:disabled { opacity:.45; cursor:not-allowed; }
.btn.ghost { background:transparent; color: var(--muted); border:1px solid var(--line); }
.opts { display:flex; flex-direction:column; gap:10px; margin-top:16px; }
.opt { display:flex; gap:12px; align-items:flex-start; padding:14px; border:1px solid var(--line);
  border-radius:12px; background:#fff; cursor:pointer; }
.opt input { margin-top:2px; transform: scale(1.25); }
.nav { display:flex; gap:12px; margin-top:20px; }
.nav .btn { margin-top:0; }
.progress { height:6px; background:var(--line); border-radius:3px; overflow:hidden; }
.progress .bar { height:100%; background:var(--primary); transition:width .2s; }
.counter { color:var(--muted); margin:8px 0 0; }
.score { font-size:2rem; font-weight:700; }
.review { list-style:none; padding:0; }
.review li { padding:12px; border-radius:10px; margin-bottom:8px; border:1px solid var(--line); }
.review li.ok { border-color:var(--ok); } .review li.bad { border-color:var(--bad); }
.review .q { font-weight:600; margin:0 0 6px; } .review .a { margin:2px 0; color:var(--muted); }
```

- [ ] **Step 8: scripts/make-icons.mjs**

```js
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/icons', { recursive: true });
const svg = (s) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
     <rect width="100%" height="100%" rx="${s * 0.18}" fill="#0d6efd"/>
     <text x="50%" y="55%" font-size="${s * 0.5}" text-anchor="middle"
       dominant-baseline="middle" fill="#fff" font-family="sans-serif">?</text>
   </svg>`,
);
for (const s of [192, 512]) {
  await sharp(svg(s)).png().toFile(`public/icons/icon-${s}.png`);
}
console.log('icons generated');
```

- [ ] **Step 9: Install + generate icons**

Run: `npm install && npm run icons`
Expected: установка без ошибок; `public/icons/icon-192.png` и `icon-512.png` созданы.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+TS+vitest+PWA project skeleton"
```

---

## Task 2: Типы данных + загрузчик/валидатор (`core/loader`)

**Files:**
- Create: `src/core/types.ts`, `src/core/loader.ts`, `src/core/loader.test.ts`

- [ ] **Step 1: src/core/types.ts**

```ts
export type QuestionType = 'single' | 'multi';

export interface Option { id: string; text: string; }

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: Option[];
  correct: string[];
}

export interface Test { id: string; title: string; questions: Question[]; }

export interface Manifest { version: string; title: string; tests: string[]; }

/** Все вопросы из активных тестов, склеенные в порядке manifest. */
export interface LoadedQuiz { version: string; title: string; questions: Question[]; }

export interface Progress {
  version: string;
  answers: Record<string, string[]>;
  index: number;
  startedAt: string;
  finishedAt: string | null;
}

export interface QuestionResult { question: Question; selected: string[]; correct: boolean; }
export interface GradeResult { total: number; correctCount: number; results: QuestionResult[]; }
```

- [ ] **Step 2: Failing test — src/core/loader.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { parseManifest, parseTest, buildQuiz } from './loader';

const validTest = {
  id: 'test-01', title: 'Тема',
  questions: [
    { id: 'q1', type: 'single', text: 'A?', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correct: ['a'] },
    { id: 'q2', type: 'multi', text: 'B?', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }], correct: ['a', 'c'] },
  ],
};

describe('parseManifest', () => {
  it('парсит валидный manifest', () => {
    expect(parseManifest({ version: 'v1', title: 'T', tests: ['t.json'] }))
      .toEqual({ version: 'v1', title: 'T', tests: ['t.json'] });
  });
  it('падает на пустом tests', () => {
    expect(() => parseManifest({ version: 'v1', title: 'T', tests: [] })).toThrow();
  });
});

describe('parseTest', () => {
  it('парсит валидный тест', () => {
    expect(parseTest(validTest).questions).toHaveLength(2);
  });
  it('single требует ровно один correct', () => {
    const bad = structuredClone(validTest);
    bad.questions[0].correct = ['a', 'b'];
    expect(() => parseTest(bad)).toThrow(/single/);
  });
  it('correct должен ссылаться на существующий option', () => {
    const bad = structuredClone(validTest);
    bad.questions[0].correct = ['zzz'];
    expect(() => parseTest(bad)).toThrow();
  });
  it('падает на неизвестном типе вопроса', () => {
    const bad = structuredClone(validTest);
    (bad.questions[0] as { type: string }).type = 'dropdown';
    expect(() => parseTest(bad)).toThrow();
  });
});

describe('buildQuiz', () => {
  it('склеивает вопросы в порядке manifest', () => {
    const quiz = buildQuiz({ version: 'v1', title: 'T', tests: ['t.json'] }, [parseTest(validTest)]);
    expect(quiz.questions.map((q) => q.id)).toEqual(['q1', 'q2']);
    expect(quiz.version).toBe('v1');
  });
  it('падает на дубликате id вопроса между тестами', () => {
    const a = parseTest(validTest);
    const b = parseTest({ ...validTest, id: 'test-02' });
    expect(() => buildQuiz({ version: 'v1', title: 'T', tests: ['a', 'b'] }, [a, b])).toThrow(/Дубликат/);
  });
});
```

- [ ] **Step 3: Run test — verify it fails**

Run: `npm test`
Expected: FAIL — `parseManifest`/`parseTest`/`buildQuiz` не определены.

- [ ] **Step 4: Implement — src/core/loader.ts**

```ts
import type { Manifest, Test, Question, Option, LoadedQuiz } from './types';

function asObject(v: unknown, ctx: string): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error(`${ctx}: ожидался объект`);
  return v as Record<string, unknown>;
}
function asString(v: unknown, ctx: string): string {
  if (typeof v !== 'string' || v.length === 0) throw new Error(`${ctx}: ожидалась непустая строка`);
  return v;
}
function asArray(v: unknown, ctx: string): unknown[] {
  if (!Array.isArray(v)) throw new Error(`${ctx}: ожидался массив`);
  return v;
}

export function parseManifest(raw: unknown): Manifest {
  const o = asObject(raw, 'manifest');
  const version = asString(o.version, 'manifest.version');
  const title = asString(o.title, 'manifest.title');
  const tests = asArray(o.tests, 'manifest.tests').map((t, i) => asString(t, `manifest.tests[${i}]`));
  if (tests.length === 0) throw new Error('manifest.tests: список пуст');
  return { version, title, tests };
}

function parseOption(raw: unknown, ctx: string): Option {
  const o = asObject(raw, ctx);
  return { id: asString(o.id, `${ctx}.id`), text: asString(o.text, `${ctx}.text`) };
}

function parseQuestion(raw: unknown, ctx: string): Question {
  const o = asObject(raw, ctx);
  const id = asString(o.id, `${ctx}.id`);
  if (o.type !== 'single' && o.type !== 'multi') throw new Error(`${ctx}.type: ожидалось single|multi`);
  const type = o.type;
  const text = asString(o.text, `${ctx}.text`);
  const options = asArray(o.options, `${ctx}.options`).map((op, i) => parseOption(op, `${ctx}.options[${i}]`));
  if (options.length < 2) throw new Error(`${ctx}.options: минимум 2 варианта`);
  const optionIds = new Set(options.map((op) => op.id));
  const correct = asArray(o.correct, `${ctx}.correct`).map((c, i) => asString(c, `${ctx}.correct[${i}]`));
  if (correct.length === 0) throw new Error(`${ctx}.correct: нет правильных ответов`);
  for (const c of correct) if (!optionIds.has(c)) throw new Error(`${ctx}.correct: "${c}" нет среди options`);
  if (type === 'single' && correct.length !== 1) throw new Error(`${ctx}.correct: single требует ровно 1 ответ`);
  return { id, type, text, options, correct };
}

export function parseTest(raw: unknown): Test {
  const o = asObject(raw, 'test');
  const id = asString(o.id, 'test.id');
  const title = asString(o.title, 'test.title');
  const questions = asArray(o.questions, 'test.questions')
    .map((q, i) => parseQuestion(q, `test(${id}).questions[${i}]`));
  if (questions.length === 0) throw new Error(`test(${id}).questions: пусто`);
  return { id, title, questions };
}

export function buildQuiz(manifest: Manifest, tests: Test[]): LoadedQuiz {
  const questions: Question[] = [];
  const seen = new Set<string>();
  for (const t of tests) {
    for (const q of t.questions) {
      if (seen.has(q.id)) throw new Error(`Дубликат id вопроса "${q.id}" (тест ${t.id})`);
      seen.add(q.id);
      questions.push(q);
    }
  }
  return { version: manifest.version, title: manifest.title, questions };
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Не удалось загрузить ${url} (${res.status})`);
  return res.json();
}

/** Загружает manifest и все тесты, возвращает склеенную ленту вопросов. */
export async function loadQuiz(baseUrl = '/tests'): Promise<LoadedQuiz> {
  const manifest = parseManifest(await fetchJson(`${baseUrl}/manifest.json`));
  const tests: Test[] = [];
  for (const file of manifest.tests) tests.push(parseTest(await fetchJson(`${baseUrl}/${file}`)));
  return buildQuiz(manifest, tests);
}
```

- [ ] **Step 5: Run test — verify it passes**

Run: `npm test`
Expected: PASS — все тесты loader зелёные.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): types + test base loader/validator"
```

---

## Task 3: Оценивание (`core/grader`)

**Files:**
- Create: `src/core/grader.ts`, `src/core/grader.test.ts`

- [ ] **Step 1: Failing test — src/core/grader.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { isCorrect, grade } from './grader';
import type { LoadedQuiz, Question } from './types';

const single: Question = { id: 'q1', type: 'single', text: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }], correct: ['a'] };
const multi: Question = { id: 'q2', type: 'multi', text: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }], correct: ['a', 'c'] };

describe('isCorrect', () => {
  it('single: верный выбор', () => expect(isCorrect(single, ['a'])).toBe(true));
  it('single: неверный выбор', () => expect(isCorrect(single, ['b'])).toBe(false));
  it('multi: точное совпадение множества', () => expect(isCorrect(multi, ['c', 'a'])).toBe(true));
  it('multi: частичный набор = неверно', () => expect(isCorrect(multi, ['a'])).toBe(false));
  it('multi: лишний вариант = неверно', () => expect(isCorrect(multi, ['a', 'b', 'c'])).toBe(false));
  it('пустой ответ = неверно', () => expect(isCorrect(single, [])).toBe(false));
});

describe('grade', () => {
  it('считает балл и разбор', () => {
    const quiz: LoadedQuiz = { version: 'v1', title: 'T', questions: [single, multi] };
    const res = grade(quiz, { q1: ['a'], q2: ['a'] });
    expect(res.total).toBe(2);
    expect(res.correctCount).toBe(1);
    expect(res.results[1].correct).toBe(false);
    expect(res.results[0].selected).toEqual(['a']);
  });
  it('вопрос без ответа попадает в разбор как неверный', () => {
    const quiz: LoadedQuiz = { version: 'v1', title: 'T', questions: [single] };
    const res = grade(quiz, {});
    expect(res.correctCount).toBe(0);
    expect(res.results[0].selected).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npm test`
Expected: FAIL — `isCorrect`/`grade` не определены.

- [ ] **Step 3: Implement — src/core/grader.ts**

```ts
import type { LoadedQuiz, Question, GradeResult, QuestionResult } from './types';

export function setEquals(a: string[], b: string[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}

/** single и multi одинаково: точное совпадение выбранного множества с correct. */
export function isCorrect(q: Question, selected: string[]): boolean {
  return setEquals(selected, q.correct);
}

export function grade(quiz: LoadedQuiz, answers: Record<string, string[]>): GradeResult {
  const results: QuestionResult[] = quiz.questions.map((question) => {
    const selected = answers[question.id] ?? [];
    return { question, selected, correct: isCorrect(question, selected) };
  });
  const correctCount = results.filter((r) => r.correct).length;
  return { total: quiz.questions.length, correctCount, results };
}
```

- [ ] **Step 4: Run test — verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(core): grader (all-or-nothing for multi)"
```

---

## Task 4: Хранилище прогресса (`core/progress`)

**Files:**
- Create: `src/core/progress.ts`, `src/core/progress.test.ts`

- [ ] **Step 1: Failing test — src/core/progress.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { createProgressStore, reconcile } from './progress';

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

describe('progress store', () => {
  it('start создаёт чистый прогресс и сохраняет его', () => {
    const s = createProgressStore(fakeStorage());
    const p = s.start('v1');
    expect(p.version).toBe('v1');
    expect(p.index).toBe(0);
    expect(s.load()).toEqual(p);
  });
  it('save/load цикл', () => {
    const s = createProgressStore(fakeStorage());
    const p = s.start('v1');
    p.index = 3; p.answers.q1 = ['a']; s.save(p);
    expect(s.load()!.index).toBe(3);
  });
  it('clear удаляет прогресс', () => {
    const s = createProgressStore(fakeStorage());
    s.start('v1'); s.clear();
    expect(s.load()).toBeNull();
  });
  it('битый JSON в хранилище → load возвращает null', () => {
    const st = fakeStorage();
    st.setItem('student-quiz:progress', '{not json');
    expect(createProgressStore(st).load()).toBeNull();
  });
});

describe('reconcile', () => {
  it('возвращает прогресс при совпадении версии', () => {
    const s = createProgressStore(fakeStorage());
    s.start('v1');
    expect(reconcile(s, 'v1')).not.toBeNull();
  });
  it('чистит прогресс при смене версии и возвращает null', () => {
    const s = createProgressStore(fakeStorage());
    s.start('v1');
    expect(reconcile(s, 'v2')).toBeNull();
    expect(s.load()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npm test`
Expected: FAIL — модуль `progress` не реализован.

- [ ] **Step 3: Implement — src/core/progress.ts**

```ts
import type { Progress } from './types';

const KEY = 'student-quiz:progress';

export interface ProgressStore {
  load(): Progress | null;
  save(p: Progress): void;
  clear(): void;
  start(version: string): Progress;
}

export function createProgressStore(storage: Storage = localStorage): ProgressStore {
  return {
    load() {
      const raw = storage.getItem(KEY);
      if (!raw) return null;
      try { return JSON.parse(raw) as Progress; } catch { return null; }
    },
    save(p) { storage.setItem(KEY, JSON.stringify(p)); },
    clear() { storage.removeItem(KEY); },
    start(version) {
      const p: Progress = { version, answers: {}, index: 0, startedAt: new Date().toISOString(), finishedAt: null };
      storage.setItem(KEY, JSON.stringify(p));
      return p;
    },
  };
}

/** Прогресс валиден только если его version совпадает с текущей базой; иначе чистим. */
export function reconcile(store: ProgressStore, version: string): Progress | null {
  const existing = store.load();
  if (existing && existing.version === version) return existing;
  if (existing) store.clear();
  return null;
}
```

- [ ] **Step 4: Run test — verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(core): localStorage progress store + version reconcile"
```

---

## Task 5: База тестов-заглушек (POC)

**Files:**
- Create: `tests/manifest.json`, `tests/test-01.json`

- [ ] **Step 1: tests/manifest.json**

```json
{
  "version": "poc-1",
  "title": "Демо-тест",
  "tests": ["test-01.json"]
}
```

- [ ] **Step 2: tests/test-01.json**

```json
{
  "id": "test-01",
  "title": "Демо",
  "questions": [
    {
      "id": "q1", "type": "single", "text": "Сколько будет 2 + 2?",
      "options": [
        { "id": "a", "text": "3" },
        { "id": "b", "text": "4" },
        { "id": "c", "text": "5" }
      ],
      "correct": ["b"]
    },
    {
      "id": "q2", "type": "multi", "text": "Какие из чисел чётные?",
      "options": [
        { "id": "a", "text": "2" },
        { "id": "b", "text": "3" },
        { "id": "c", "text": "4" }
      ],
      "correct": ["a", "c"]
    },
    {
      "id": "q3", "type": "single", "text": "Столица Украины?",
      "options": [
        { "id": "a", "text": "Львів" },
        { "id": "b", "text": "Київ" }
      ],
      "correct": ["b"]
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: POC stub test base (3 questions, single+multi)"
```

---

## Task 6: UI — экраны и контроллер

**Files:**
- Create: `src/ui/screens.ts`, `src/ui/app.ts`

- [ ] **Step 1: src/ui/screens.ts** (чистые функции рендера в HTML-строку)

```ts
import type { LoadedQuiz, Progress, Question, GradeResult } from '../core/types';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function renderMessage(title: string, body: string): string {
  return `<main class="screen"><h1>${esc(title)}</h1><p>${esc(body)}</p></main>`;
}

export function hasResumable(p: Progress | null): boolean {
  return !!p && p.finishedAt === null && (p.index > 0 || Object.keys(p.answers).length > 0);
}

export function renderHome(quiz: LoadedQuiz, progress: Progress | null): string {
  const buttons = hasResumable(progress)
    ? `<button class="btn primary" data-action="continue">Продолжить</button>
       <button class="btn ghost" data-action="reset">Начать заново</button>`
    : `<button class="btn primary" data-action="start">Старт</button>`;
  return `<main class="screen">
    <h1>${esc(quiz.title)}</h1>
    <p>${quiz.questions.length} вопрос(ов)</p>
    ${buttons}
  </main>`;
}

export function renderQuestion(quiz: LoadedQuiz, q: Question, p: Progress): string {
  const n = p.index + 1;
  const m = quiz.questions.length;
  const selected = new Set(p.answers[q.id] ?? []);
  const inputType = q.type === 'single' ? 'radio' : 'checkbox';
  const opts = q.options.map((o) => `
    <label class="opt">
      <input type="${inputType}" name="opt" value="${esc(o.id)}" ${selected.has(o.id) ? 'checked' : ''} />
      <span>${esc(o.text)}</span>
    </label>`).join('');
  return `<main class="screen">
    <div class="progress"><div class="bar" style="width:${(n / m) * 100}%"></div></div>
    <p class="counter">${n} / ${m}</p>
    <h2>${esc(q.text)}</h2>
    <form class="opts">${opts}</form>
    <div class="nav">
      <button class="btn ghost" data-action="prev" ${p.index === 0 ? 'disabled' : ''}>Назад</button>
      <button class="btn primary" data-action="next" ${selected.size === 0 ? 'disabled' : ''}>${n === m ? 'Завершить' : 'Далее'}</button>
    </div>
  </main>`;
}

export function renderResult(quiz: LoadedQuiz, result: GradeResult): string {
  const label = (q: Question, id: string) => q.options.find((o) => o.id === id)?.text ?? id;
  const items = result.results.map((r, i) => {
    const sel = r.selected.map((id) => label(r.question, id)).join(', ') || '—';
    const cor = r.question.correct.map((id) => label(r.question, id)).join(', ');
    return `<li class="${r.correct ? 'ok' : 'bad'}">
      <p class="q">${i + 1}. ${esc(r.question.text)}</p>
      <p class="a">Твой ответ: ${esc(sel)}</p>
      ${r.correct ? '' : `<p class="a">Верно: ${esc(cor)}</p>`}
    </li>`;
  }).join('');
  return `<main class="screen">
    <h1>Результат</h1>
    <p class="score">${result.correctCount} / ${result.total}</p>
    <ul class="review">${items}</ul>
    <button class="btn primary" data-action="restart">Пройти заново</button>
  </main>`;
}
```

- [ ] **Step 2: src/ui/app.ts** (контроллер: загрузка, состояние, события)

```ts
import { loadQuiz } from '../core/loader';
import { grade } from '../core/grader';
import { createProgressStore, reconcile, type ProgressStore } from '../core/progress';
import type { LoadedQuiz, Progress } from '../core/types';
import { renderHome, renderQuestion, renderResult, renderMessage } from './screens';

export async function mountApp(root: HTMLElement, store: ProgressStore = createProgressStore()): Promise<void> {
  let quiz: LoadedQuiz;
  try {
    quiz = await loadQuiz();
  } catch (e) {
    root.innerHTML = renderMessage('Ошибка загрузки', (e as Error).message);
    return;
  }
  if (quiz.questions.length === 0) {
    root.innerHTML = renderMessage('Тестов пока нет', 'База тестов пуста.');
    return;
  }

  const home = () => {
    root.innerHTML = renderHome(quiz, reconcile(store, quiz.version));
    root.querySelector('[data-action="start"]')?.addEventListener('click', () => showQuestion(store.start(quiz.version)));
    root.querySelector('[data-action="continue"]')?.addEventListener('click', () => showQuestion(reconcile(store, quiz.version)!));
    root.querySelector('[data-action="reset"]')?.addEventListener('click', () => { store.clear(); home(); });
  };

  const showQuestion = (p: Progress) => {
    if (p.index >= quiz.questions.length) return showResult(p);
    const q = quiz.questions[p.index];
    root.innerHTML = renderQuestion(quiz, q, p);
    const selected = new Set(p.answers[q.id] ?? []);
    const nextBtn = root.querySelector<HTMLButtonElement>('[data-action="next"]')!;
    root.querySelectorAll<HTMLInputElement>('input[name="opt"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (q.type === 'single') { selected.clear(); selected.add(input.value); }
        else if (input.checked) selected.add(input.value);
        else selected.delete(input.value);
        p.answers[q.id] = [...selected];
        store.save(p);
        nextBtn.disabled = selected.size === 0;
      });
    });
    root.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
      p.index = Math.max(0, p.index - 1); store.save(p); showQuestion(p);
    });
    nextBtn.addEventListener('click', () => {
      p.index += 1; store.save(p);
      if (p.index >= quiz.questions.length) showResult(p); else showQuestion(p);
    });
  };

  const showResult = (p: Progress) => {
    p.finishedAt = new Date().toISOString(); store.save(p);
    root.innerHTML = renderResult(quiz, grade(quiz, p.answers));
    root.querySelector('[data-action="restart"]')?.addEventListener('click', () => { store.clear(); home(); });
  };

  home();
}
```

- [ ] **Step 3: Typecheck + build**

Run: `npm run build`
Expected: tsc без ошибок, vite сборка в `dist/` успешна.

- [ ] **Step 4: Manual smoke (dev)**

Run: `npm run dev` → открыть напечатанный localhost URL.
Expected: «Демо-тест», кнопка «Старт» → 3 вопроса (radio, checkbox, radio) → «Завершить» → балл + разбор. Перезагрузка страницы в середине → «Продолжить» с того же вопроса. Остановить дев-сервер (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): home/question/result screens + controller"
```

---

## Task 7: Контейнер (Dockerfile + nginx + compose)

**Files:**
- Create: `Dockerfile`, `nginx.conf`, `compose.yaml`, `.dockerignore`

- [ ] **Step 1: .dockerignore**

```
node_modules
dist
.git
```

- [ ] **Step 2: nginx.conf**

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # база тестов — без кэша, чтобы подмена файлов подхватывалась сразу
  location /tests/ {
    add_header Cache-Control "no-store" always;
    try_files $uri =404;
  }
}
```

- [ ] **Step 3: Dockerfile** (multi-stage; база по умолчанию вшита, volume её перекрывает)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run icons && npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# база тестов по умолчанию (перекрывается volume в compose)
COPY tests /usr/share/nginx/html/tests
```

- [ ] **Step 4: compose.yaml**

```yaml
services:
  student-quiz:
    build: .
    ports:
      - "8089:80"
    volumes:
      - ./tests:/usr/share/nginx/html/tests:ro
    restart: unless-stopped
```

- [ ] **Step 5: Build + run**

Run: `docker compose up -d --build`
Expected: контейнер поднялся. `curl -s localhost:8089/tests/manifest.json` отдаёт JSON с `"version": "poc-1"`. `curl -sI localhost:8089/tests/manifest.json` содержит `Cache-Control: no-store`. Открыть `http://localhost:8089` — приложение работает.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: docker (nginx static + tests volume, no-store)"
```

---

## Task 8: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: README.md**

````markdown
# student-quiz

Веб-приложение (PWA) для самопроверки студентов: тесты одной лентой, балл и
разбор в конце. Прогресс хранится на устройстве (localStorage). Серверного кода
нет — статика на nginx + база тестов в JSON.

Спека: `docs/superpowers/specs/2026-06-27-student-quiz-design.md`

## Разработка

    npm install
    npm run icons      # сгенерировать PWA-иконки (однократно)
    npm run dev        # дев-сервер
    npm test           # юнит-тесты core
    npm run build      # типы + прод-сборка

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
````

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: README (run, Tailscale/PWA, swapping test base)"
```

---

## Task 9: Финальная проверка POC (разработчик)

- [ ] **Step 1: Полный прогон проверок**

Run: `npm test && npm run build`
Expected: тесты зелёные, сборка успешна.

- [ ] **Step 2: Поднять контейнер и проверить доступ по Tailscale**

Run: `docker compose up -d --build`
Затем узнать имя машины: `tailscale status | head -1` (или `hostname`).
Expected: `http://<tailscale-имя>:8089` открывается с компа.

- [ ] **Step 3: Подготовить к приёмке**

Сообщить пользователю URL (`http://<tailscale-имя>:8089`) и попросить пройти
приёмку (Задача 10).

---

## Task 10: 🚦 Гейт — ручная приёмка пользователем (POC)

**Не кодовая задача. Следующая фаза (MVP) не начинается без «ок» пользователя.**

- [ ] **Пользователь прокликивает (телефон + комп):**
  - [ ] «Старт» → проходит 3 вопроса (radio, checkbox, radio).
  - [ ] «Назад»/«Далее» работают; прогресс-бар двигается.
  - [ ] Закрыть и переоткрыть вкладку/приложение → «Продолжить» с того же места.
  - [ ] «Завершить» → итоговый балл и разбор корректны.
  - [ ] «Пройти заново»/«Начать заново» очищает прогресс.
  - [ ] Открывается и с телефона, и с компа в tailnet.
- [ ] **Пользователь подтвердил POC.** Только после этого — Задача 11.

---

## Task 11: MVP — 1–4 реальных теста + приёмка

**Files:**
- Modify/Create: `tests/manifest.json`, `tests/test-01.json` … `tests/test-04.json`

- [ ] **Step 1: Заменить заглушки реальными тестами**

Заменить содержимое `tests/test-01.json` реальными вопросами и добавить при
необходимости `test-02.json`…`test-04.json` (та же схема, см. README). Обновить
`tests/manifest.json`: список `tests` и **новый `version`** (напр. `"mvp-1"`).

- [ ] **Step 2: Проверить базу загрузчиком**

Run: `npm run dev` → открыть URL.
Expected: все вопросы из всех файлов идут одной лентой, без ошибок валидации.
(Если ошибка — loader покажет понятное сообщение с путём к проблеме.) Ctrl-C.

- [ ] **Step 3: Пересобрать контейнер и проверить смену базы через volume**

```bash
docker compose up -d --build
curl -s localhost:8089/tests/manifest.json
```
Expected: новый `version`. Изменить вопрос в `tests/test-01.json` на хосте →
повторный `curl` показывает правку **без пересборки** (volume + no-store).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: MVP real tests (1-4)"
```

- [ ] **Step 5: 🚦 Гейт — ручная приёмка пользователем (MVP)**

Сообщить пользователю URL. Пользователь прокликивает сценарии из Задачи 10 **плюс**:
  - [ ] Реальные вопросы проходятся, балл корректен.
  - [ ] Смена базы тестов подменой файла подхватывается; смена `version` →
        предложение начать заново.
  - [ ] **Пользователь подтвердил MVP.** Только после этого — Задача 12.

---

## Task 12: Финал — все тесты + приёмка

**Files:**
- Modify/Create: `tests/manifest.json`, `tests/test-*.json`

- [ ] **Step 1: Добавить все оставшиеся тесты**

Положить все файлы тестов в `tests/`, перечислить в `manifest.json` в нужном
порядке, поднять `version` (напр. `"v1.0"`).

- [ ] **Step 2: Проверить полный прогон**

Run: `npm run dev` → пройти всю ленту до результата. Ctrl-C.
Expected: все тесты идут подряд, нет ошибок валидации, балл считается.

- [ ] **Step 3: Деплой**

```bash
docker compose up -d --build
```
Expected: `http://<tailscale-имя>:8089` отдаёт полную базу.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: final full test base"
```

- [ ] **Step 5: 🚦 Гейт — ручная приёмка пользователем (Финал)**

  - [ ] Пользователь проходит полную ленту с телефона и компа, балл/разбор корректны.
  - [ ] **Пользователь подтвердил Финал.** Проект готов.

---

## Self-Review

**Spec coverage:**
- Кнопка Старт/Продолжить → Задача 6 (`renderHome`, `hasResumable`).
- Вопрос с radio/checkbox → Задачи 2 (типы), 6 (`renderQuestion`).
- База тестов заранее, смена на бэкенде → Задачи 5, 7 (volume + no-store), 8 (README).
- Прогресс на стороне клиента → Задача 4 (localStorage), инвалидация по версии.
- Балл + разбор в конце → Задачи 3 (grader), 6 (`renderResult`).
- Все тесты одной лентой → Задача 2 (`buildQuiz`).
- Контейнер OrbStack + Tailscale + PWA → Задачи 1 (PWA), 7 (Docker), 8 (README/tailscale serve).
- Фазы POC/MVP/Финал + приёмочный гейт после каждой → Задачи 5–10 / 11 / 12.
- Обработка ошибок (битый JSON, дубликаты id, пустая база, офлайн) → Задачи 2, 6, 1 (runtime cache).

**Placeholder scan:** код приведён полностью в каждом шаге; задачи 11–12 намеренно оставляют *контент тестов* за пользователем (это данные, не код) — схема и команды даны.

**Type consistency:** `LoadedQuiz`/`Progress`/`GradeResult`/`ProgressStore`, функции `parseManifest`/`parseTest`/`buildQuiz`/`loadQuiz`/`isCorrect`/`grade`/`createProgressStore`/`reconcile`, рендеры `renderHome`/`renderQuestion`/`renderResult`/`renderMessage`/`hasResumable` — согласованы между задачами.
