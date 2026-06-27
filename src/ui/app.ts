import { loadQuiz } from '../core/loader';
import { grade } from '../core/grader';
import { createProgressStore, reconcile, type ProgressStore } from '../core/progress';
import type { LoadedQuiz, Progress } from '../core/types';
import { renderHome, renderQuestion, renderResult, renderMessage } from './screens';

export async function mountApp(root: HTMLElement, store: ProgressStore = createProgressStore()): Promise<void> {
  let quiz: LoadedQuiz;
  try {
    quiz = await loadQuiz();
  } catch (e) {
    root.innerHTML = renderMessage('Ошибка загрузки', (e as Error).message);
    return;
  }
  if (quiz.questions.length === 0) {
    root.innerHTML = renderMessage('Тестов пока нет', 'База тестов пуста.');
    return;
  }

  const home = () => {
    root.innerHTML = renderHome(quiz, reconcile(store, quiz.version));
    root.querySelector('[data-action="start"]')?.addEventListener('click', () => showQuestion(store.start(quiz.version)));
    root.querySelector('[data-action="continue"]')?.addEventListener('click', () => showQuestion(reconcile(store, quiz.version)!));
    root.querySelector('[data-action="reset"]')?.addEventListener('click', () => { store.clear(); home(); });
  };

  const showQuestion = (p: Progress) => {
    if (p.index >= quiz.questions.length) return showResult(p);
    const q = quiz.questions[p.index];
    root.innerHTML = renderQuestion(quiz, q, p);
    const selected = new Set(p.answers[q.id] ?? []);
    const nextBtn = root.querySelector<HTMLButtonElement>('[data-action="next"]')!;
    root.querySelectorAll<HTMLInputElement>('input[name="opt"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (q.type === 'single') { selected.clear(); selected.add(input.value); }
        else if (input.checked) selected.add(input.value);
        else selected.delete(input.value);
        p.answers[q.id] = [...selected];
        store.save(p);
        nextBtn.disabled = selected.size === 0;
      });
    });
    root.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
      p.index = Math.max(0, p.index - 1); store.save(p); showQuestion(p);
    });
    nextBtn.addEventListener('click', () => {
      p.index += 1; store.save(p);
      if (p.index >= quiz.questions.length) showResult(p); else showQuestion(p);
    });
  };

  const showResult = (p: Progress) => {
    p.finishedAt = new Date().toISOString(); store.save(p);
    root.innerHTML = renderResult(grade(quiz, p.answers));
    root.querySelector('[data-action="restart"]')?.addEventListener('click', () => { store.clear(); home(); });
  };

  home();
}
