export type QuestionType = 'single' | 'multi';

export interface Option { id: string; text: string; }

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: Option[];
  correct: string[];
}

export interface Test { id: string; title: string; questions: Question[]; }

export interface Manifest { version: string; title: string; tests: string[]; }

/** Все вопросы из активных тестов, склеенные в порядке manifest. */
export interface LoadedQuiz { version: string; title: string; questions: Question[]; }

/** Зафиксированный на попытку перемешанный порядок вопросов и опций. */
export interface QuizOrder {
  questions: string[];
  options: Record<string, string[]>;
}

export interface Progress {
  version: string;
  answers: Record<string, string[]>;
  index: number;
  startedAt: string;
  finishedAt: string | null;
  order: QuizOrder;
}

export interface QuestionResult { question: Question; selected: string[]; correct: boolean; }
export interface GradeResult { total: number; correctCount: number; results: QuestionResult[]; }
