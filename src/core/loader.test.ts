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
