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
  const manifest: Manifest = { version, title, tests };
  if (o.debug === true) manifest.debug = true;
  return manifest;
}

function parseOption(raw: unknown, ctx: string): Option {
  const o = asObject(raw, ctx);
  return { id: asString(o.id, `${ctx}.id`), text: asString(o.text, `${ctx}.text`) };
}

function parseChoices(o: Record<string, unknown>, field: string, ctx: string): Option[] {
  const list = asArray(o[field], `${ctx}.${field}`).map((op, i) => parseOption(op, `${ctx}.${field}[${i}]`));
  if (list.length < 2) throw new Error(`${ctx}.${field}: минимум 2 элемента`);
  if (new Set(list.map((x) => x.id)).size !== list.length) throw new Error(`${ctx}.${field}: повторяющиеся id`);
  return list;
}

function parseQuestion(raw: unknown, ctx: string): Question {
  const o = asObject(raw, ctx);
  const id = asString(o.id, `${ctx}.id`);
  const type = o.type;
  const text = asString(o.text, `${ctx}.text`);

  if (type === 'single' || type === 'multi' || type === 'cloze') {
    const options = parseChoices(o, 'options', ctx);
    const ids = new Set(options.map((op) => op.id));
    const correct = asArray(o.correct, `${ctx}.correct`).map((c, i) => asString(c, `${ctx}.correct[${i}]`));
    if (correct.length === 0) throw new Error(`${ctx}.correct: нет правильных ответов`);
    for (const c of correct) if (!ids.has(c)) throw new Error(`${ctx}.correct: "${c}" нет среди options`);
    if ((type === 'single' || type === 'cloze') && correct.length !== 1) {
      throw new Error(`${ctx}.correct: ${type} требует ровно 1 ответ`);
    }
    return { id, type, text, options, correct };
  }

  if (type === 'order') {
    const items = parseChoices(o, 'items', ctx);
    const ids = new Set(items.map((it) => it.id));
    const correct = asArray(o.correct, `${ctx}.correct`).map((c, i) => asString(c, `${ctx}.correct[${i}]`));
    if (correct.length !== items.length) throw new Error(`${ctx}.correct: должен перечислять все items по порядку`);
    if (new Set(correct).size !== correct.length) throw new Error(`${ctx}.correct: повторяющиеся id`);
    for (const c of correct) if (!ids.has(c)) throw new Error(`${ctx}.correct: "${c}" нет среди items`);
    return { id, type, text, items, correct };
  }

  if (type === 'match') {
    const left = parseChoices(o, 'left', ctx);
    const right = parseChoices(o, 'right', ctx);
    const rightIds = new Set(right.map((r) => r.id));
    const rawPairs = asObject(o.pairs, `${ctx}.pairs`);
    const pairs: Record<string, string> = {};
    for (const l of left) {
      const r = asString(rawPairs[l.id], `${ctx}.pairs[${l.id}]`);
      if (!rightIds.has(r)) throw new Error(`${ctx}.pairs[${l.id}]: "${r}" нет среди right`);
      pairs[l.id] = r;
    }
    return { id, type, text, left, right, pairs };
  }

  throw new Error(`${ctx}.type: ожидалось single|multi|cloze|order|match`);
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
  const seen = new Set<string>();
  for (const t of tests) {
    for (const q of t.questions) {
      if (seen.has(q.id)) throw new Error(`Дубликат id вопроса "${q.id}" (тест ${t.id})`);
      seen.add(q.id);
    }
  }
  return { version: manifest.version, title: manifest.title, debug: manifest.debug, tests };
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
