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
