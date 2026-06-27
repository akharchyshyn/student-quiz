import type { Progress, QuizOrder } from './types';

const KEY = 'student-quiz:progress';

export interface ProgressStore {
  load(): Progress | null;
  save(p: Progress): void;
  clear(): void;
  start(version: string, order: QuizOrder): Progress;
}

export function createProgressStore(storage: Storage = localStorage): ProgressStore {
  return {
    load() {
      const raw = storage.getItem(KEY);
      if (!raw) return null;
      try { return JSON.parse(raw) as Progress; } catch { return null; }
    },
    save(p) { storage.setItem(KEY, JSON.stringify(p)); },
    clear() { storage.removeItem(KEY); },
    start(version, order) {
      const p: Progress = { version, answers: {}, index: 0, startedAt: new Date().toISOString(), finishedAt: null, order };
      storage.setItem(KEY, JSON.stringify(p));
      return p;
    },
  };
}

/** Прогресс валиден только если его version совпадает с текущей базой; иначе чистим. */
export function reconcile(store: ProgressStore, version: string): Progress | null {
  const existing = store.load();
  if (existing && existing.version === version) return existing;
  if (existing) store.clear();
  return null;
}
