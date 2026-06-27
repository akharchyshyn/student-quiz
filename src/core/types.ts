export type QuestionType = 'single' | 'multi' | 'cloze' | 'order' | 'match';

export interface Option { id: string; text: string; }

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: Option[];               // single | multi | cloze
  correct?: string[];               // single|multi|cloze (id) · order (порядок id)
  items?: Option[];                 // order — кроки
  left?: Option[];                  // match — ліва колонка
  right?: Option[];                 // match — права колонка (варіанти)
  pairs?: Record<string, string>;   // match — leftId -> rightId
}

export interface Test { id: string; title: string; questions: Question[]; }

export interface Manifest { version: string; title: string; tests: string[]; debug?: boolean; }

/** Загруженная база: тесты хранятся раздельно (для меню тем). */
export interface LoadedQuiz { version: string; title: string; tests: Test[]; debug?: boolean; }

/** Перемешанный на прохождение порядок вопросов и опций одного теста. */
export interface QuizOrder {
  questions: string[];
  options: Record<string, string[]>;
}

export interface QuestionResult { question: Question; selected: string[]; correct: boolean; }
export interface GradeResult { total: number; correctCount: number; results: QuestionResult[]; }
