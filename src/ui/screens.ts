import type { LoadedQuiz, Test, Question, GradeResult } from '../core/types';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function labelFor(q: Question, id: string): string {
  const pool = [...(q.options ?? []), ...(q.items ?? []), ...(q.left ?? []), ...(q.right ?? [])];
  return pool.find((o) => o.id === id)?.text ?? id;
}

/** Готов ли ответ для перехода «Далі». */
export function isComplete(q: Question, answer: string[]): boolean {
  if (q.type === 'order') return true; // порядок всегда задан (все элементы на месте)
  if (q.type === 'match') {
    const left = q.left ?? [];
    return answer.length === left.length && answer.every((x) => x !== '');
  }
  return answer.length > 0;
}

export function renderMessage(title: string, body: string): string {
  return `<main class="screen"><h1>${esc(title)}</h1><p>${esc(body)}</p></main>`;
}

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

/**
 * `display` — id выбираемых элементов в перемешанном порядке.
 * `answer` — текущее состояние ответа (см. grader.isCorrect).
 */
export function renderQuestion(
  quiz: LoadedQuiz, test: Test, q: Question, index: number, display: string[], answer: string[],
): string {
  const n = index + 1;
  const m = test.questions.length;
  const debugCtl = quiz.debug
    ? ` · <code class="qid">${esc(q.id)}</code> <button class="dbg" data-action="abort">Скинути</button>`
    : '';

  let body = '';
  if (q.type === 'single' || q.type === 'multi' || q.type === 'cloze') {
    const inputType = q.type === 'multi' ? 'checkbox' : 'radio';
    const sel = new Set(answer);
    body = `<form class="opts">${display.map((id) => {
      const o = (q.options ?? []).find((x) => x.id === id)!;
      return `<label class="opt"><input type="${inputType}" name="opt" value="${esc(id)}" ${sel.has(id) ? 'checked' : ''} /><span>${esc(o.text)}</span></label>`;
    }).join('')}</form>`;
  } else if (q.type === 'order') {
    const seq = answer.length ? answer : display;
    body = `<ol class="order">${seq.map((id, i) => {
      const it = (q.items ?? []).find((x) => x.id === id)!;
      return `<li><span class="otext">${esc(it.text)}</span><span class="ordbtns"><button type="button" class="ordbtn" data-up="${i}" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" class="ordbtn" data-down="${i}" ${i === seq.length - 1 ? 'disabled' : ''}>▼</button></span></li>`;
    }).join('')}</ol>`;
  } else if (q.type === 'match') {
    const opts = display.map((id) => (q.right ?? []).find((r) => r.id === id)!);
    body = `<div class="match">${(q.left ?? []).map((l, i) => `<div class="mrow"><span class="mleft">${esc(l.text)}</span><select data-left="${i}"><option value="">—</option>${opts.map((o) => `<option value="${esc(o.id)}" ${answer[i] === o.id ? 'selected' : ''}>${esc(o.text)}</option>`).join('')}</select></div>`).join('')}</div>`;
  }

  const nextDisabled = isComplete(q, answer) ? '' : 'disabled';
  return `<main class="screen">
    <p class="muted tname">${esc(test.title)}</p>
    <div class="progress"><div class="bar" style="width:${(n / m) * 100}%"></div></div>
    <p class="counter">${n} / ${m}${debugCtl}</p>
    <div class="nav">
      <button class="btn ghost" data-action="prev" ${index === 0 ? 'disabled' : ''}>Назад</button>
      <button class="btn primary" data-action="next" ${nextDisabled}>${n === m ? 'Завершити' : 'Далі'}</button>
    </div>
    <h2>${esc(q.text)}</h2>
    ${body}
  </main>`;
}

function answerText(q: Question, selected: string[]): string {
  if (q.type === 'order') return selected.map((id) => labelFor(q, id)).join(' → ') || '—';
  if (q.type === 'match') {
    return (q.left ?? []).map((l, i) => `${labelFor(q, l.id)} → ${selected[i] ? labelFor(q, selected[i]) : '—'}`).join('; ') || '—';
  }
  return selected.map((id) => labelFor(q, id)).join(', ') || '—';
}

function correctText(q: Question): string {
  if (q.type === 'order') return (q.correct ?? []).map((id) => labelFor(q, id)).join(' → ');
  if (q.type === 'match') return (q.left ?? []).map((l) => `${labelFor(q, l.id)} → ${labelFor(q, (q.pairs ?? {})[l.id])}`).join('; ');
  return (q.correct ?? []).map((id) => labelFor(q, id)).join(', ');
}

export function renderResult(test: Test, result: GradeResult): string {
  const items = result.results.map((r, i) => `<li class="${r.correct ? 'ok' : 'bad'}">
      <p class="q">${i + 1}. ${esc(r.question.text)}</p>
      <p class="a">Твоя відповідь: ${esc(answerText(r.question, r.selected))}</p>
      ${r.correct ? '' : `<p class="a">Вірно: ${esc(correctText(r.question))}</p>`}
    </li>`).join('');
  return `<main class="screen">
    <h1>${esc(test.title)}</h1>
    <p class="score">${result.correctCount} / ${result.total}</p>
    <button class="btn primary" data-action="menu">До тем</button>
    <button class="btn ghost" data-action="retry">Пройти заново</button>
    <ul class="review">${items}</ul>
    <button class="btn primary" data-action="menu">До тем</button>
  </main>`;
}

/** Ключ ответа для дебаг-экрана «Усі питання». */
function answerKey(q: Question): string {
  if (q.type === 'order') {
    return `<ol class="alllist">${(q.correct ?? []).map((id) => `<li class="ok">${esc(labelFor(q, id))}</li>`).join('')}</ol>`;
  }
  if (q.type === 'match') {
    return `<ul class="alllist">${(q.left ?? []).map((l) => `<li class="ok">${esc(labelFor(q, l.id))} → ${esc(labelFor(q, (q.pairs ?? {})[l.id]))}</li>`).join('')}</ul>`;
  }
  return `<ul class="alllist">${(q.options ?? []).map((o) => {
    const ok = (q.correct ?? []).includes(o.id);
    return `<li class="${ok ? 'ok' : ''}">${ok ? '✓ ' : ''}${esc(o.text)}</li>`;
  }).join('')}</ul>`;
}

export function renderAllQuestions(quiz: LoadedQuiz): string {
  const back = '<button class="btn ghost" data-action="menu">← До тем</button>';
  const blocks = quiz.tests.map((t) => {
    const qs = t.questions.map((q, i) => `<li>
        <p class="q"><code class="qid">${esc(q.id)}</code> <span class="muted">[${q.type}]</span> ${i + 1}. ${esc(q.text)}</p>
        ${answerKey(q)}
      </li>`).join('');
    return `<h2>${esc(t.title)}</h2><ul class="review">${qs}</ul>`;
  }).join('');
  return `<main class="screen">
    <h1>Усі питання</h1>
    ${back}
    ${blocks}
    ${back}
  </main>`;
}
