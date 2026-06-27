import type { Question, GradeResult, QuestionResult } from './types';

export function setEquals(a: string[], b: string[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}

function arrayEquals(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/**
 * Проверка ответа по типу вопроса. `selected`:
 * - single|multi|cloze — выбранные id вариантов (множество);
 * - order — id шагов в порядке, заданном пользователем;
 * - match — id правого варианта для каждого левого (по порядку left).
 */
export function isCorrect(q: Question, selected: string[]): boolean {
  switch (q.type) {
    case 'single':
    case 'multi':
    case 'cloze':
      return setEquals(selected, q.correct ?? []);
    case 'order':
      return arrayEquals(selected, q.correct ?? []);
    case 'match': {
      const left = q.left ?? [];
      const pairs = q.pairs ?? {};
      if (selected.length !== left.length) return false;
      return left.every((l, i) => selected[i] === pairs[l.id]);
    }
  }
}

export function grade(questions: Question[], answers: Record<string, string[]>): GradeResult {
  const results: QuestionResult[] = questions.map((question) => {
    const selected = answers[question.id] ?? [];
    return { question, selected, correct: isCorrect(question, selected) };
  });
  const correctCount = results.filter((r) => r.correct).length;
  return { total: questions.length, correctCount, results };
}
