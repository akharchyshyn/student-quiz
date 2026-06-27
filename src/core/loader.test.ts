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
  it('читает debug: true', () => {
    expect(parseManifest({ version: 'v1', title: 'T', tests: ['t.json'], debug: true }).debug).toBe(true);
  });
  it('debug відсутній за замовчуванням', () => {
    expect(parseManifest({ version: 'v1', title: 'T', tests: ['t.json'] }).debug).toBeUndefined();
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
    expect(quiz.tests).toHaveLength(1);
    expect(quiz.tests[0].questions.map((q) => q.id)).toEqual(['q1', 'q2']);
    expect(quiz.version).toBe('v1');
  });
  it('падает на дубликате id вопроса между тестами', () => {
    const a = parseTest(validTest);
    const b = parseTest({ ...validTest, id: 'test-02' });
    expect(() => buildQuiz({ version: 'v1', title: 'T', tests: ['a', 'b'] }, [a, b])).toThrow(/Дубликат/);
  });
});

describe('parseQuestion — новые типы', () => {
  const wrap = (q: unknown) => ({ id: 't', title: 'T', questions: [q] });

  it('order: валиден, если correct перечисляет все items', () => {
    const q = { id: 'o1', type: 'order', text: 'Порядок?', items: [{ id: 's1', text: 'A' }, { id: 's2', text: 'B' }], correct: ['s1', 's2'] };
    expect(parseTest(wrap(q)).questions[0].type).toBe('order');
  });
  it('order: падает, если correct не покрывает все items', () => {
    const q = { id: 'o1', type: 'order', text: 'Порядок?', items: [{ id: 's1', text: 'A' }, { id: 's2', text: 'B' }], correct: ['s1'] };
    expect(() => parseTest(wrap(q))).toThrow();
  });
  it('cloze: требует ровно 1 correct', () => {
    const q = { id: 'c1', type: 'cloze', text: '___', options: [{ id: 'a', text: 'x' }, { id: 'b', text: 'y' }], correct: ['a', 'b'] };
    expect(() => parseTest(wrap(q))).toThrow(/cloze/);
  });
  it('match: валиден при полном pairs', () => {
    const q = { id: 'm1', type: 'match', text: 'Зіставте', left: [{ id: 'l1', text: 'A' }, { id: 'l2', text: 'B' }], right: [{ id: 'r1', text: '1' }, { id: 'r2', text: '2' }], pairs: { l1: 'r1', l2: 'r2' } };
    expect(parseTest(wrap(q)).questions[0].type).toBe('match');
  });
  it('match: падает, если pair указывает на неизвестный right', () => {
    const q = { id: 'm1', type: 'match', text: 'Зіставте', left: [{ id: 'l1', text: 'A' }, { id: 'l2', text: 'B' }], right: [{ id: 'r1', text: '1' }, { id: 'r2', text: '2' }], pairs: { l1: 'r1', l2: 'rX' } };
    expect(() => parseTest(wrap(q))).toThrow();
  });
});
