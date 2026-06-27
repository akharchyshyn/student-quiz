import type { Question, GradeResult, QuestionResult } from './types';

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

export function grade(questions: Question[], answers: Record<string, string[]>): GradeResult {
  const results: QuestionResult[] = questions.map((question) => {
    const selected = answers[question.id] ?? [];
    return { question, selected, correct: isCorrect(question, selected) };
  });
  const correctCount = results.filter((r) => r.correct).length;
  return { total: questions.length, correctCount, results };
}
