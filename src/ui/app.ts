import { loadQuiz } from '../core/loader';
import { grade } from '../core/grader';
import { buildOrder } from '../core/shuffle';
import type { LoadedQuiz, Test, QuizOrder } from '../core/types';
import { renderMenu, renderQuestion, renderResult, renderMessage, renderAllQuestions, isComplete } from './screens';

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
    const q = run.test.questions.find((x) => x.id === qid)!;
    const display = run.order.options[qid];
    if (q.type === 'order' && !run.answers[qid]) run.answers[qid] = [...display];
    if (q.type === 'match' && !run.answers[qid]) run.answers[qid] = (q.left ?? []).map(() => '');
    const answer = run.answers[qid] ?? [];

    root.innerHTML = renderQuestion(quiz, run.test, q, run.index, display, answer);

    const nextBtn = root.querySelector<HTMLButtonElement>('[data-action="next"]')!;
    root.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
      run.index = Math.max(0, run.index - 1); showQuestion(run);
    });
    root.querySelector('[data-action="abort"]')?.addEventListener('click', () => menu());
    nextBtn.addEventListener('click', () => { run.index += 1; showQuestion(run); });

    if (q.type === 'single' || q.type === 'multi' || q.type === 'cloze') {
      const selected = new Set(answer);
      root.querySelectorAll<HTMLInputElement>('input[name="opt"]').forEach((input) => {
        input.addEventListener('change', () => {
          if (q.type === 'multi') { input.checked ? selected.add(input.value) : selected.delete(input.value); }
          else { selected.clear(); selected.add(input.value); }
          run.answers[qid] = [...selected];
          nextBtn.disabled = selected.size === 0;
        });
      });
    } else if (q.type === 'order') {
      const swap = (i: number, j: number) => {
        const seq = run.answers[qid];
        [seq[i], seq[j]] = [seq[j], seq[i]];
        showQuestion(run);
      };
      root.querySelectorAll<HTMLElement>('[data-up]').forEach((b) => b.addEventListener('click', () => swap(+b.dataset.up!, +b.dataset.up! - 1)));
      root.querySelectorAll<HTMLElement>('[data-down]').forEach((b) => b.addEventListener('click', () => swap(+b.dataset.down!, +b.dataset.down! + 1)));
    } else if (q.type === 'match') {
      root.querySelectorAll<HTMLSelectElement>('select[data-left]').forEach((sel) => {
        sel.addEventListener('change', () => {
          run.answers[qid][+sel.dataset.left!] = sel.value;
          nextBtn.disabled = !isComplete(q, run.answers[qid]);
        });
      });
    }
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
