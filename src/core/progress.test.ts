import { describe, it, expect } from 'vitest';
import { createProgressStore, reconcile } from './progress';

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

describe('progress store', () => {
  it('start создаёт чистый прогресс и сохраняет его', () => {
    const s = createProgressStore(fakeStorage());
    const p = s.start('v1');
    expect(p.version).toBe('v1');
    expect(p.index).toBe(0);
    expect(s.load()).toEqual(p);
  });
  it('save/load цикл', () => {
    const s = createProgressStore(fakeStorage());
    const p = s.start('v1');
    p.index = 3; p.answers.q1 = ['a']; s.save(p);
    expect(s.load()!.index).toBe(3);
  });
  it('clear удаляет прогресс', () => {
    const s = createProgressStore(fakeStorage());
    s.start('v1'); s.clear();
    expect(s.load()).toBeNull();
  });
  it('битый JSON в хранилище → load возвращает null', () => {
    const st = fakeStorage();
    st.setItem('student-quiz:progress', '{not json');
    expect(createProgressStore(st).load()).toBeNull();
  });
});

describe('reconcile', () => {
  it('возвращает прогресс при совпадении версии', () => {
    const s = createProgressStore(fakeStorage());
    s.start('v1');
    expect(reconcile(s, 'v1')).not.toBeNull();
  });
  it('чистит прогресс при смене версии и возвращает null', () => {
    const s = createProgressStore(fakeStorage());
    s.start('v1');
    expect(reconcile(s, 'v2')).toBeNull();
    expect(s.load()).toBeNull();
  });
});
