import { describe, it, expect } from 'vitest';
import { shuffle, buildOrder } from './shuffle';
import type { Question } from './types';

// детерминированный ГПСЧ для воспроизводимых тестов
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe('shuffle', () => {
  it('сохраняет состав (перестановка)', () => {
    const src = ['a', 'b', 'c', 'd', 'e'];
    const out = shuffle(src, seeded(1));
    expect([...out].sort()).toEqual([...src].sort());
    expect(out).toHaveLength(src.length);
  });
  it('не мутирует исходный массив', () => {
    const src = ['a', 'b', 'c'];
    shuffle(src, seeded(2));
    expect(src).toEqual(['a', 'b', 'c']);
  });
  it('детерминирован при одинаковом seed', () => {
    expect(shuffle(['a', 'b', 'c', 'd'], seeded(7))).toEqual(shuffle(['a', 'b', 'c', 'd'], seeded(7)));
  });
});

describe('buildOrder', () => {
  const questions: Question[] = [
    { id: 'q1', type: 'single', text: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }], correct: ['a'] },
    { id: 'q2', type: 'multi', text: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }], correct: ['a'] },
  ];
  it('порядок вопросов — перестановка всех id', () => {
    const order = buildOrder(questions, seeded(3));
    expect([...order.questions].sort()).toEqual(['q1', 'q2']);
  });
  it('для каждого вопроса порядок опций — перестановка его id', () => {
    const order = buildOrder(questions, seeded(3));
    expect([...order.options.q1].sort()).toEqual(['a', 'b']);
    expect([...order.options.q2].sort()).toEqual(['a', 'b', 'c']);
  });
});
