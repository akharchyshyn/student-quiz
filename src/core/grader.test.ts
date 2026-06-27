import { describe, it, expect } from 'vitest';
import { isCorrect, grade } from './grader';
import type { Question } from './types';

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
    const res = grade([single, multi], { q1: ['a'], q2: ['a'] });
    expect(res.total).toBe(2);
    expect(res.correctCount).toBe(1);
    expect(res.results[1].correct).toBe(false);
    expect(res.results[0].selected).toEqual(['a']);
  });
  it('вопрос без ответа попадает в разбор как неверный', () => {
    const res = grade([single], {});
    expect(res.correctCount).toBe(0);
    expect(res.results[0].selected).toEqual([]);
  });
});

const cloze: Question = { id: 'c1', type: 'cloze', text: '___', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }], correct: ['a'] };
const order: Question = { id: 'o1', type: 'order', text: '', items: [{ id: 's1', text: '' }, { id: 's2', text: '' }, { id: 's3', text: '' }], correct: ['s1', 's2', 's3'] };
const match: Question = { id: 'mt', type: 'match', text: '', left: [{ id: 'l1', text: '' }, { id: 'l2', text: '' }], right: [{ id: 'r1', text: '' }, { id: 'r2', text: '' }], pairs: { l1: 'r1', l2: 'r2' } };

describe('isCorrect — новые типы', () => {
  it('cloze: как single', () => {
    expect(isCorrect(cloze, ['a'])).toBe(true);
    expect(isCorrect(cloze, ['b'])).toBe(false);
  });
  it('order: точный порядок', () => {
    expect(isCorrect(order, ['s1', 's2', 's3'])).toBe(true);
    expect(isCorrect(order, ['s2', 's1', 's3'])).toBe(false);
    expect(isCorrect(order, ['s1', 's2'])).toBe(false);
  });
  it('match: все пары верны (по порядку left)', () => {
    expect(isCorrect(match, ['r1', 'r2'])).toBe(true);
    expect(isCorrect(match, ['r2', 'r1'])).toBe(false);
    expect(isCorrect(match, ['r1'])).toBe(false);
  });
});
