import type { LoadedQuiz, Progress, Question, GradeResult } from '../core/types';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function renderMessage(title: string, body: string): string {
  return `<main class="screen"><h1>${esc(title)}</h1><p>${esc(body)}</p></main>`;
}

export function hasResumable(p: Progress | null): boolean {
  return !!p && p.finishedAt === null && (p.index > 0 || Object.keys(p.answers).length > 0);
}

export function renderHome(quiz: LoadedQuiz, progress: Progress | null): string {
  const buttons = hasResumable(progress)
    ? `<button class="btn primary" data-action="continue">Продолжить</button>
       <button class="btn ghost" data-action="reset">Начать заново</button>`
    : `<button class="btn primary" data-action="start">Старт</button>`;
  return `<main class="screen">
    <h1>${esc(quiz.title)}</h1>
    <p>${quiz.questions.length} вопрос(ов)</p>
    ${buttons}
  </main>`;
}

export function renderQuestion(quiz: LoadedQuiz, q: Question, p: Progress): string {
  const n = p.index + 1;
  const m = quiz.questions.length;
  const selected = new Set(p.answers[q.id] ?? []);
  const inputType = q.type === 'single' ? 'radio' : 'checkbox';
  const opts = q.options.map((o) => `
    <label class="opt">
      <input type="${inputType}" name="opt" value="${esc(o.id)}" ${selected.has(o.id) ? 'checked' : ''} />
      <span>${esc(o.text)}</span>
    </label>`).join('');
  return `<main class="screen">
    <div class="progress"><div class="bar" style="width:${(n / m) * 100}%"></div></div>
    <p class="counter">${n} / ${m}</p>
    <h2>${esc(q.text)}</h2>
    <form class="opts">${opts}</form>
    <div class="nav">
      <button class="btn ghost" data-action="prev" ${p.index === 0 ? 'disabled' : ''}>Назад</button>
      <button class="btn primary" data-action="next" ${selected.size === 0 ? 'disabled' : ''}>${n === m ? 'Завершить' : 'Далее'}</button>
    </div>
  </main>`;
}

export function renderResult(result: GradeResult): string {
  const label = (q: Question, id: string) => q.options.find((o) => o.id === id)?.text ?? id;
  const items = result.results.map((r, i) => {
    const sel = r.selected.map((id) => label(r.question, id)).join(', ') || '—';
    const cor = r.question.correct.map((id) => label(r.question, id)).join(', ');
    return `<li class="${r.correct ? 'ok' : 'bad'}">
      <p class="q">${i + 1}. ${esc(r.question.text)}</p>
      <p class="a">Твой ответ: ${esc(sel)}</p>
      ${r.correct ? '' : `<p class="a">Верно: ${esc(cor)}</p>`}
    </li>`;
  }).join('');
  return `<main class="screen">
    <h1>Результат</h1>
    <p class="score">${result.correctCount} / ${result.total}</p>
    <ul class="review">${items}</ul>
    <button class="btn primary" data-action="restart">Пройти заново</button>
  </main>`;
}
