import { useRef, useState, type FormEvent } from 'react';
import type { UT2SurveySubmission } from '../types/ut2Survey';
import '../routes/main/FeedbackPage.css';
import './UT2SurveyForm.css';

interface Props {
  nickname: string;
  submitted?: boolean;
  rewardEntered?: boolean;
  onBack: () => void;
  onSubmit: (answers: UT2SurveySubmission) => Promise<{ session: { rewardEntered?: boolean } }>;
}

export function UT2SurveyForm({ nickname, submitted = false, rewardEntered = false, onBack, onSubmit }: Props) {
  const [form, setForm] = useState<UT2SurveySubmission>({ name: '', nickname, overallDifficulty: '', learningExperience: '',
    goodPoints: '', improvements: '', participantStatus: '', mockExamGrade: '', phoneNumber: null });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [enteredDraw, setEnteredDraw] = useState(rewardEntered);
  const [error, setError] = useState('');
  const sending = useRef(false);
  function update(key: keyof UT2SurveySubmission, value: string) {
    setForm(current => ({ ...current, [key]: value })); setError('');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    try {
      const answers = { ...form, name: form.name.trim(), nickname: form.nickname.trim(),
        learningExperience: form.learningExperience.trim(), goodPoints: form.goodPoints.trim(),
        improvements: form.improvements.trim(), mockExamGrade: form.mockExamGrade.trim(), phoneNumber: form.phoneNumber?.trim() || null };
      if ([answers.name, answers.nickname, answers.learningExperience, answers.goodPoints, answers.improvements, answers.mockExamGrade].some(value => !value)) throw new Error('필수 항목을 입력해 주세요.');
      const result = await onSubmit(answers);
      setEnteredDraw(Boolean(result.session.rewardEntered)); setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setError(e instanceof Error ? e.message : '제출하지 못했어요. 다시 시도해 주세요.'); }
    finally { sending.current = false; setBusy(false); }
  }
  if (done || submitted) return <div className="feedback-page ut2-short-survey"><div className="feedback-shell"><div className="feedback-success">
    <div className="feedback-success-mark" aria-hidden="true">✓</div><h1>소중한 의견 감사합니다</h1>
    <p>{enteredDraw || rewardEntered ? '빽다방 상품권 추첨에 응모되었어요. 당첨 시 입력한 연락처로 안내해 드려요.' : '설문이 제출되었어요. 연락처를 남기지 않아 상품권 추첨에는 응모되지 않았어요.'}</p>
    <button type="button" onClick={onBack}>학습 결과로 돌아가기</button>
  </div></div></div>;
  return <div className="feedback-page ut2-short-survey"><div className="feedback-shell">
    <button className="feedback-back" type="button" onClick={onBack}>← 학습 결과로</button>
    <header className="feedback-hero"><h1>수확행 사용 경험을 들려주세요</h1>
      <p>최종 레벨테스트까지 참여해 주셔서 감사해요. 짧게 의견을 남겨 주세요.</p>
      <p className="ut2-short-reward">설문을 제출하고 연락처를 남긴 분 중 추첨으로 <strong>빽다방 상품권</strong>을 드려요.</p>
    </header>
    <form className="feedback-form" onSubmit={event => void submit(event)}>
      <div className="ut2-survey-pair">
        <label className="ut2-survey-field">이름<input className="feedback-input" name="name" autoComplete="name" value={form.name} maxLength={100} required onChange={e => update('name', e.target.value)} /></label>
        <label className="ut2-survey-field">닉네임<input className="feedback-input" name="nickname" autoComplete="nickname" value={form.nickname} maxLength={40} required onChange={e => update('nickname', e.target.value)} /></label>
      </div>
      <label className="ut2-survey-field">전체적인 난이도<select className="feedback-input" name="overallDifficulty" value={form.overallDifficulty} required onChange={e => update('overallDifficulty', e.target.value)}>
        <option value="">선택해 주세요</option>{['매우 어려움', '어려움', '보통', '쉬움', '매우 쉬움'].map(value => <option key={value}>{value}</option>)}
      </select></label>
      <label className="ut2-survey-field">학습 경험<textarea className="feedback-textarea" name="learningExperience" rows={2} value={form.learningExperience} maxLength={2000} required placeholder="학습하는 과정은 어땠나요?" onChange={e => update('learningExperience', e.target.value)} /></label>
      <label className="ut2-survey-field">좋았던 점<textarea className="feedback-textarea" name="goodPoints" rows={2} value={form.goodPoints} maxLength={2000} required placeholder="없다면 ‘없음’으로 적어 주세요." onChange={e => update('goodPoints', e.target.value)} /></label>
      <label className="ut2-survey-field">아쉬웠던 점<textarea className="feedback-textarea" name="improvements" rows={2} value={form.improvements} maxLength={2000} required placeholder="없다면 ‘없음’으로 적어 주세요." onChange={e => update('improvements', e.target.value)} /></label>
      <div className="ut2-survey-pair">
        <label className="ut2-survey-field">신분<select className="feedback-input" name="participantStatus" value={form.participantStatus} required onChange={e => update('participantStatus', e.target.value)}>
          <option value="">선택해 주세요</option>{['중학생', '고등학생', '대학생', '대학원생', '직장인', '기타'].map(value => <option key={value}>{value}</option>)}
        </select></label>
        <label className="ut2-survey-field">모의고사 등급<input className="feedback-input" type="text" name="mockExamGrade" value={form.mockExamGrade} maxLength={100} required placeholder="예: 3등급 / 응시 경험 없음" onChange={e => update('mockExamGrade', e.target.value)} /></label>
      </div>
      <label className="ut2-survey-field">전화번호 <span className="ut2-survey-optional">(선택)</span><input className="feedback-input" type="tel" name="phoneNumber" autoComplete="tel" value={form.phoneNumber ?? ''} maxLength={20} placeholder="010-0000-0000" onChange={e => update('phoneNumber', e.target.value)} />
        <span className="feedback-helper">추첨 응모·상품권 전달용이에요. 입력하지 않아도 설문은 제출할 수 있어요.</span>
      </label>
      {error && <p className="feedback-error" role="alert">{error}</p>}
      <button className="feedback-submit" type="submit" disabled={busy}>{busy ? '제출하는 중…' : '피드백 제출하기'}</button>
    </form>
  </div></div>;
}
