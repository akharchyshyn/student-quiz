import { loadQuiz } from '../core/loader';
import { grade } from '../core/grader';
import { buildOrder } from '../core/shuffle';
import type { LoadedQuiz, Test, QuizOrder } from '../core/types';
import { renderMenu, renderQuestion, renderResult, renderMessage, renderAllQuestions } from './screens';

/** Состояние одного прохождения теста — только в памяти, без сохранения. */
interface Run { test: Test; order: QuizOrder; answers: Record<string, string[]>; index: number; }

export async function mountApp(root: HTMLElement): Promise<void> {
  let quiz: LoadedQuiz;
  try {
    quiz = await loadQuiz();
  } catch (e) {
    root.innerHTML = renderMessage('Помилка завантаження', (e as Error).message);
    return;
  }
  if (quiz.tests.length === 0) {
    root.innerHTML = renderMessage('Тестів поки немає', 'База тестів порожня.');
    return;
  }

  const menu = () => {
    root.innerHTML = renderMenu(quiz);
    root.querySelectorAll<HTMLElement>('[data-test]').forEach((b) => {
      b.addEventListener('click', () => {
        const test = quiz.tests.find((t) => t.id === b.dataset.test);
        if (test) startTest(test);
      });
    });
    root.querySelector('[data-action="all"]')?.addEventListener('click', () => showAll());
  };

  const startTest = (test: Test) => {
    showQuestion({ test, order: buildOrder(test.questions), answers: {}, index: 0 });
  };

  const showQuestion = (run: Run) => {
    if (run.index >= run.test.questions.length) return showResult(run);
    const qid = run.order.questions[run.index];
    const base = run.test.questions.find((q) => q.id === qid)!;
    const orderedOptions = run.order.options[qid].map((id) => base.options.find((o) => o.id === id)!);
    const q = { ...base, options: orderedOptions };
    root.innerHTML = renderQuestion(quiz, run.test, q, run.index, run.answers[q.id] ?? []);

    const selected = new Set(run.answers[q.id] ?? []);
    const nextBtn = root.querySelector<HTMLButtonElement>('[data-action="next"]')!;
    root.querySelectorAll<HTMLInputElement>('input[name="opt"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (q.type === 'single') { selected.clear(); selected.add(input.value); }
        else if (input.checked) selected.add(input.value);
        else selected.delete(input.value);
        run.answers[q.id] = [...selected];
        nextBtn.disabled = selected.size === 0;
      });
    });
    root.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
      run.index = Math.max(0, run.index - 1); showQuestion(run);
    });
    root.querySelector('[data-action="abort"]')?.addEventListener('click', () => menu());
    nextBtn.addEventListener('click', () => { run.index += 1; showQuestion(run); });
  };

  const showResult = (run: Run) => {
    root.innerHTML = renderResult(run.test, grade(run.test.questions, run.answers));
    root.querySelectorAll('[data-action="menu"]').forEach((b) => b.addEventListener('click', () => menu()));
    root.querySelector('[data-action="retry"]')?.addEventListener('click', () => startTest(run.test));
  };

  const showAll = () => {
    root.innerHTML = renderAllQuestions(quiz);
    root.querySelectorAll('[data-action="menu"]').forEach((b) => b.addEventListener('click', () => menu()));
  };

  menu();
}
