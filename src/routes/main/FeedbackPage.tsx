import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { submitFeedback } from '../../lib/feedbackClient';
import { tokenStorage } from '../../lib/tokenStorage';
import type { FeedbackSubmission } from '../../types/feedback';
import './FeedbackPage.css';

type FeedbackFormState = FeedbackSubmission;

const EXPERIENCE_OPTIONS = [
  '부담없이 할 수 있었다',
  '집중해서 열심히 했다',
  '조금 길거나 지루하게 느껴졌다',
  '귀찮아서 대충 하게 되었다',
  '기타',
];
const DIFFICULTY_OPTIONS = ['매우 어려움', '어려움', '보통', '쉬움', '매우 쉬움'];
const CLARITY_OPTIONS = ['매우 어려웠다', '어려웠다', '보통이다', '쉬웠다', '매우 쉬웠다'];
const ACCURACY_OPTIONS = ['매우 일치', '대체로 일치', '보통', '불일치', '매우 불일치'];
const HELPFULNESS_OPTIONS = ['매우 납득', '납득', '보통', '불납득', '매우 불납득'];
const QUALITY_OPTIONS = ['매우 훌륭', '훌륭', '보통', '아쉬움', '매우 아쉬움'];
const RECOMMENDATION_OPTIONS = ['매우 추천', '추천', '보통', '비추천', '매우 비추천'];
const SCHOOL_GRADE_OPTIONS = ['고등학교 1학년', '고등학교 2학년', '고등학교 3학년(N수생 포함)'];
const MOCK_EXAM_GRADE_OPTIONS = ['1등급', '2등급', '3등급', '4등급', '5등급', '6등급', '7등급', '8등급', '9등급'];

function schoolGradeFor(grade: number | null | undefined) {
  if (grade === 4) return SCHOOL_GRADE_OPTIONS[0];
  if (grade === 5) return SCHOOL_GRADE_OPTIONS[1];
  if (grade === 6) return SCHOOL_GRADE_OPTIONS[2];
  return '';
}

function initialForm(schoolGrade: string): FeedbackFormState {
  return {
    levelTestExperience: '',
    levelTestExperienceOther: null,
    levelTestDifficulty: '',
    hardestUnitReason: '',
    curriculumClarity: '',
    nodeMapAccuracy: '',
    explanationHelpfulness: '',
    personalizedCurriculumAdvantage: '',
    practiceConnection: '',
    problemQuality: '',
    recommendationIntent: '',
    recommendationReason: '',
    criticalImprovement: '',
    schoolGrade,
    mockExamGrade: '',
    phoneNumber: null,
  };
}

interface RadioQuestionProps {
  number: number;
  label: string;
  name: keyof FeedbackFormState;
  value: string;
  options: readonly string[];
  onChange: (name: keyof FeedbackFormState, value: string) => void;
}

function RadioQuestion({ number, label, name, value, options, onChange }: RadioQuestionProps) {
  return (
    <fieldset className="feedback-question">
      <legend>
        {number}. {label}<span className="feedback-required" aria-label="필수">*</span>
      </legend>
      <div className="feedback-options">
        {options.map((option) => (
          <label className="feedback-option" key={option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(name, option)}
              required
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface TextQuestionProps {
  number: number;
  label: string;
  name: keyof FeedbackFormState;
  value: string;
  placeholder?: string;
  onChange: (name: keyof FeedbackFormState, value: string) => void;
}

function TextQuestion({ number, label, name, value, placeholder, onChange }: TextQuestionProps) {
  return (
    <div className="feedback-question">
      <label className="feedback-question-label" htmlFor={name}>
        {number}. {label}<span className="feedback-required" aria-label="필수">*</span>
      </label>
      <textarea
        className="feedback-textarea"
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder ?? '의견을 입력해주세요.'}
        maxLength={2000}
        required
      />
    </div>
  );
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const presetGrade = useMemo(() => schoolGradeFor(user?.grade), [user?.grade]);
  const [form, setForm] = useState<FeedbackFormState>(() => initialForm(presetGrade));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (name: keyof FeedbackFormState, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const uid = tokenStorage.getUid();
    if (!uid) {
      setError('로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
      return;
    }
    if (form.levelTestExperience === '기타' && !form.levelTestExperienceOther?.trim()) {
      setError('1번 문항의 기타 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitFeedback(uid, {
        ...form,
        levelTestExperienceOther: form.levelTestExperienceOther?.trim() || null,
        phoneNumber: form.phoneNumber?.trim() || null,
      });
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '피드백을 제출하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="feedback-page">
        <div className="feedback-shell">
          <div className="feedback-success">
            <div className="feedback-success-mark" aria-hidden="true">✓</div>
            <h1>소중한 의견 감사합니다</h1>
            <p>남겨주신 답변은 수확행을 개선하는 데 꼼꼼히 반영할게요.</p>
            <button type="button" onClick={() => navigate('/main/home')}>홈으로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <div className="feedback-shell">
        <button className="feedback-back" type="button" onClick={() => navigate('/main/home')}>
          ← 홈으로
        </button>

        <header className="feedback-hero">
          <p className="feedback-eyebrow">FEEDBACK</p>
          <h1>수확행 사용 경험을 들려주세요</h1>
          <p>
            레벨테스트와 맞춤형 커리큘럼을 더 나은 방향으로 개선하기 위한 설문입니다.
            별표가 있는 문항은 필수이며, 연락처는 이벤트 리워드 전달에만 사용합니다.
          </p>
        </header>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <RadioQuestion number={1} label="레벨테스트를 풀 때 전반적으로 어떤 느낌이었나요?" name="levelTestExperience" value={form.levelTestExperience} options={EXPERIENCE_OPTIONS} onChange={setField} />
          {form.levelTestExperience === '기타' && (
            <div className="feedback-other-input">
              <label className="feedback-question-label" htmlFor="levelTestExperienceOther">1번 기타 내용<span className="feedback-required">*</span></label>
              <input className="feedback-input" id="levelTestExperienceOther" value={form.levelTestExperienceOther ?? ''} onChange={(event) => setField('levelTestExperienceOther', event.target.value)} maxLength={500} required />
            </div>
          )}
          <RadioQuestion number={2} label="레벨테스트의 난이도는 어땠나요?" name="levelTestDifficulty" value={form.levelTestDifficulty} options={DIFFICULTY_OPTIONS} onChange={setField} />
          <TextQuestion number={3} label="레벨테스트에서 가장 어려웠던 단원과 그 이유를 알려주세요." name="hardestUnitReason" value={form.hardestUnitReason} onChange={setField} />
          <RadioQuestion number={4} label="제공된 맞춤형 커리큘럼은 이해하기 쉬웠나요?" name="curriculumClarity" value={form.curriculumClarity} options={CLARITY_OPTIONS} onChange={setField} />
          <RadioQuestion number={5} label="노드 맵의 진단 결과가 본인의 실력과 얼마나 일치했나요?" name="nodeMapAccuracy" value={form.nodeMapAccuracy} options={ACCURACY_OPTIONS} onChange={setField} />
          <RadioQuestion number={6} label="문제 풀이 후 제공된 개념 설명은 얼마나 납득이 되었나요?" name="explanationHelpfulness" value={form.explanationHelpfulness} options={HELPFULNESS_OPTIONS} onChange={setField} />
          <TextQuestion number={7} label="1:1 맞춤형 커리큘럼이 강의나 문제집보다 좋았던 점은 무엇인가요?" name="personalizedCurriculumAdvantage" value={form.personalizedCurriculumAdvantage} onChange={setField} />
          <RadioQuestion number={8} label="개념 학습과 실전 문제가 잘 연결되어 있었나요?" name="practiceConnection" value={form.practiceConnection} options={QUALITY_OPTIONS} onChange={setField} />
          <RadioQuestion number={9} label="제공된 실전 문제의 전반적인 품질은 어땠나요?" name="problemQuality" value={form.problemQuality} options={QUALITY_OPTIONS} onChange={setField} />
          <RadioQuestion number={10} label="수확행을 친구나 지인에게 추천할 의향이 있나요?" name="recommendationIntent" value={form.recommendationIntent} options={RECOMMENDATION_OPTIONS} onChange={setField} />
          <TextQuestion number={11} label="앞 문항에서 답변한 추천 또는 비추천의 이유를 알려주세요." name="recommendationReason" value={form.recommendationReason} onChange={setField} />
          <TextQuestion number={12} label="수확행이 가장 먼저 고쳐야 할 점 한 가지를 꼽는다면 무엇인가요?" name="criticalImprovement" value={form.criticalImprovement} onChange={setField} />
          <RadioQuestion number={13} label="현재 학년을 선택해주세요." name="schoolGrade" value={form.schoolGrade} options={SCHOOL_GRADE_OPTIONS} onChange={setField} />
          <RadioQuestion number={14} label="최근 6월 모의고사 수학 등급을 선택해주세요." name="mockExamGrade" value={form.mockExamGrade} options={MOCK_EXAM_GRADE_OPTIONS} onChange={setField} />

          <div className="feedback-question">
            <label className="feedback-question-label" htmlFor="phoneNumber">
              15. 전화번호
              <span className="feedback-helper">선택 사항 · 이벤트 리워드 전달 용도로만 사용됩니다.</span>
            </label>
            <input
              className="feedback-input"
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              placeholder="010-0000-0000"
              value={form.phoneNumber ?? ''}
              onChange={(event) => setField('phoneNumber', event.target.value)}
              maxLength={20}
            />
          </div>

          {error && <p className="feedback-error" role="alert">{error}</p>}
          <button className="feedback-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '제출하는 중…' : '피드백 제출하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
