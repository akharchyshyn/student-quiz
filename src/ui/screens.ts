import type { LoadedQuiz, Test, Question, GradeResult } from '../core/types';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function renderMessage(title: string, body: string): string {
  return `<main class="screen"><h1>${esc(title)}</h1><p>${esc(body)}</p></main>`;
}

/** Меню тем: список тестов. */
export function renderMenu(quiz: LoadedQuiz): string {
  const items = quiz.tests.map((t) => `
    <button class="btn test" data-test="${esc(t.id)}">
      <span>${esc(t.title)}</span>
      <span class="muted">${t.questions.length}</span>
    </button>`).join('');
  const debugBtn = quiz.debug
    ? '<button class="btn ghost" data-action="all">Усі питання</button>'
    : '';
  return `<main class="screen">
    <h1>${esc(quiz.title)}</h1>
    <p class="muted">Оберіть тему (${quiz.tests.length})</p>
    <div class="menu">${items}</div>
    ${debugBtn}
  </main>`;
}

export function renderQuestion(quiz: LoadedQuiz, test: Test, q: Question, index: number, selected: string[]): string {
  const n = index + 1;
  const m = test.questions.length;
  const sel = new Set(selected);
  const inputType = q.type === 'single' ? 'radio' : 'checkbox';
  const opts = q.options.map((o) => `
    <label class="opt">
      <input type="${inputType}" name="opt" value="${esc(o.id)}" ${sel.has(o.id) ? 'checked' : ''} />
      <span>${esc(o.text)}</span>
    </label>`).join('');
  const debugCtl = quiz.debug
    ? ` · <code class="qid">${esc(q.id)}</code> <button class="dbg" data-action="abort">Скинути</button>`
    : '';
  return `<main class="screen">
    <p class="muted tname">${esc(test.title)}</p>
    <div class="progress"><div class="bar" style="width:${(n / m) * 100}%"></div></div>
    <p class="counter">${n} / ${m}${debugCtl}</p>
    <div class="nav">
      <button class="btn ghost" data-action="prev" ${index === 0 ? 'disabled' : ''}>Назад</button>
      <button class="btn primary" data-action="next" ${sel.size === 0 ? 'disabled' : ''}>${n === m ? 'Завершити' : 'Далі'}</button>
    </div>
    <h2>${esc(q.text)}</h2>
    <form class="opts">${opts}</form>
  </main>`;
}

export function renderResult(test: Test, result: GradeResult): string {
  const label = (q: Question, id: string) => q.options.find((o) => o.id === id)?.text ?? id;
  const items = result.results.map((r, i) => {
    const seld = r.selected.map((id) => label(r.question, id)).join(', ') || '—';
    const cor = r.question.correct.map((id) => label(r.question, id)).join(', ');
    return `<li class="${r.correct ? 'ok' : 'bad'}">
      <p class="q">${i + 1}. ${esc(r.question.text)}</p>
      <p class="a">Твоя відповідь: ${esc(seld)}</p>
      ${r.correct ? '' : `<p class="a">Вірно: ${esc(cor)}</p>`}
    </li>`;
  }).join('');
  return `<main class="screen">
    <h1>${esc(test.title)}</h1>
    <p class="score">${result.correctCount} / ${result.total}</p>
    <button class="btn primary" data-action="menu">До тем</button>
    <button class="btn ghost" data-action="retry">Пройти заново</button>
    <ul class="review">${items}</ul>
    <button class="btn primary" data-action="menu">До тем</button>
  </main>`;
}

/** Дебаг-экран: все вопросы всех тестов з правильними відповідями (read-only). */
export function renderAllQuestions(quiz: LoadedQuiz): string {
  const back = '<button class="btn ghost" data-action="menu">← До тем</button>';
  const blocks = quiz.tests.map((t) => {
    const qs = t.questions.map((q, i) => {
      const opts = q.options.map((o) => {
        const ok = q.correct.includes(o.id);
        return `<li class="${ok ? 'ok' : ''}">${ok ? '✓ ' : ''}${esc(o.text)}</li>`;
      }).join('');
      return `<li>
        <p class="q"><code class="qid">${esc(q.id)}</code> <span class="muted">[${q.type}]</span> ${i + 1}. ${esc(q.text)}</p>
        <ul class="alllist">${opts}</ul>
      </li>`;
    }).join('');
    return `<h2>${esc(t.title)}</h2><ul class="review">${qs}</ul>`;
  }).join('');
  return `<main class="screen">
    <h1>Усі питання</h1>
    ${back}
    ${blocks}
    ${back}
  </main>`;
}
