import type { Question, QuizOrder } from './types';

/** Перемешивание Фишера–Йетса. Не мутирует вход. rnd по умолчанию Math.random. */
export function shuffle<T>(arr: readonly T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Строит перемешанный порядок вопросов и опций для одного теста. */
export function buildOrder(questions: Question[], rnd: () => number = Math.random): QuizOrder {
  const order = shuffle(questions.map((q) => q.id), rnd);
  const options: Record<string, string[]> = {};
  for (const q of questions) options[q.id] = shuffle(q.options.map((o) => o.id), rnd);
  return { questions: order, options };
}
