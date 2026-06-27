import { describe, it, expect } from 'vitest';
import { renderHome, renderAllQuestions } from './screens';
import type { LoadedQuiz } from '../core/types';

const quiz: LoadedQuiz = {
  version: 'v1', title: 'T', debug: true,
  questions: [
    { id: 'q1', type: 'single', text: 'Вопрос-один?', options: [{ id: 'a', text: 'AAA' }, { id: 'b', text: 'BBB' }], correct: ['a'] },
  ],
};

describe('renderHome (debug)', () => {
  it('в debug показывает кнопку «Все вопросы»', () => {
    expect(renderHome(quiz, null)).toContain('data-action="all"');
  });
  it('без debug кнопки «Все вопросы» нет', () => {
    expect(renderHome({ ...quiz, debug: false }, null)).not.toContain('data-action="all"');
  });
});

describe('renderAllQuestions', () => {
  it('перечисляет все вопросы и тексты вариантов', () => {
    const html = renderAllQuestions(quiz);
    expect(html).toContain('Вопрос-один?');
    expect(html).toContain('AAA');
    expect(html).toContain('BBB');
    expect(html).toContain('q1');
  });
  it('помечает правильный вариант маркером', () => {
    expect(renderAllQuestions(quiz)).toContain('✓ AAA');
  });
  it('есть кнопка возврата на главную', () => {
    expect(renderAllQuestions(quiz)).toContain('data-action="home"');
  });
});
