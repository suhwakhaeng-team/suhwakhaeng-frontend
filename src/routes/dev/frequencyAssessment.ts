export const FREQUENCY_ASSESSMENT_SET_KEY = 'FREQUENCY_TABLE_UT1';

export interface AssessmentTag {
  tagId: number;
  tagName: string;
  role: 'TARGET' | 'SUPPORTING';
}

export interface AssessmentQuestion {
  questionId: number;
  order: number;
  content: string;
  answerType: 'NUMBER' | 'MULTIPLE_CHOICE' | null;
  choiceA: string | null;
  choiceB: string | null;
  choiceC: string | null;
  choiceD: string | null;
  numericTolerance: number | null;
  difficulty: number;
  nodeLevel: string | null;
  tags: AssessmentTag[];
}

export interface AssessmentSet {
  assessmentSetId: number;
  setKey: string;
  name: string;
  conceptTagId: number;
  conceptTagName: string;
  passScore: number;
  totalQuestions: number;
  questions: AssessmentQuestion[];
}

export interface AssessmentSubmissionResult {
  attemptId: number;
  setKey: string;
  score: number;
  totalQuestions: number;
  passScore: number;
  passed: boolean;
  results: Array<{ questionId: number; correct: boolean; correctAnswer: string; explanation: string | null }>;
}
