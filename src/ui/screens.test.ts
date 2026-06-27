import { describe, it, expect } from 'vitest';
import { renderMenu, renderAllQuestions } from './screens';
import type { LoadedQuiz } from '../core/types';

const quiz: LoadedQuiz = {
  version: 'v1', title: 'КОРД', debug: true,
  tests: [
    {
      id: 'test-01', title: 'Тема 1',
      questions: [
        { id: 'q1', type: 'single', text: 'Вопрос-один?', options: [{ id: 'a', text: 'AAA' }, { id: 'b', text: 'BBB' }], correct: ['a'] },
      ],
    },
  ],
};

describe('renderMenu', () => {
  it('показывает кнопку для каждого теста', () => {
    const html = renderMenu(quiz);
    expect(html).toContain('data-test="test-01"');
    expect(html).toContain('Тема 1');
  });
  it('в debug показывает «Усі питання»', () => {
    expect(renderMenu(quiz)).toContain('data-action="all"');
  });
  it('без debug кнопки «Усі питання» нет', () => {
    expect(renderMenu({ ...quiz, debug: false })).not.toContain('data-action="all"');
  });
});

describe('renderAllQuestions', () => {
  it('перечисляет вопросы с текстами, id и названием темы', () => {
    const html = renderAllQuestions(quiz);
    expect(html).toContain('Вопрос-один?');
    expect(html).toContain('AAA');
    expect(html).toContain('q1');
    expect(html).toContain('Тема 1');
  });
  it('помечает правильный вариант маркером', () => {
    expect(renderAllQuestions(quiz)).toContain('✓ AAA');
  });
});
