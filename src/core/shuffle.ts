import type { LoadedQuiz, QuizOrder } from './types';

/** Перемешивание Фишера–Йетса. Не мутирует вход. rnd по умолчанию Math.random. */
export function shuffle<T>(arr: readonly T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Строит перемешанный порядок вопросов и опций для одной попытки. */
export function buildOrder(quiz: LoadedQuiz, rnd: () => number = Math.random): QuizOrder {
  const questions = shuffle(quiz.questions.map((q) => q.id), rnd);
  const options: Record<string, string[]> = {};
  for (const q of quiz.questions) options[q.id] = shuffle(q.options.map((o) => o.id), rnd);
  return { questions, options };
}
