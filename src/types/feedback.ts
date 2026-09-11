export interface FeedbackSubmission {
  levelTestExperience: string;
  levelTestExperienceOther: string | null;
  levelTestDifficulty: string;
  hardestUnitReason: string;
  curriculumClarity: string;
  nodeMapAccuracy: string;
  explanationHelpfulness: string;
  personalizedCurriculumAdvantage: string;
  practiceConnection: string;
  problemQuality: string;
  recommendationIntent: string;
  recommendationReason: string;
  criticalImprovement: string;
  schoolGrade: string;
  mockExamGrade: string;
  phoneNumber: string | null;
}

export interface FeedbackSubmissionResult {
  id: number;
  submittedAt: string;
}
