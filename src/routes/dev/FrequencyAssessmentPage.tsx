import { useEffect, useRef, useState } from 'react';
import QuestionPrompt from '../../components/QuestionPrompt';
import { apiClient } from '../../lib/apiClient';
import { tokenStorage } from '../../lib/tokenStorage';
import {
  ASSESSMENT_STORAGE_KEY,
  FREQUENCY_ASSESSMENT_SET_KEY,
} from './frequencyAssessment';
import type { AssessmentSet, AssessmentSubmissionResult } from './frequencyAssessment';
import './FrequencyAssessmentPage.css';

interface Props {
  onPassed: () => void;
  onBack: () => void;
}

export default function FrequencyAssessmentPage({ onPassed, onBack }: Props) {
  const [set, setSet] = useState<AssessmentSet | null>(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.getUid()));
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<AssessmentSubmissionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(() => tokenStorage.getUid() ? '' : '로그인 정보가 없습니다. UT 계정으로 다시 로그인해주세요.');
  const startedAt = useRef(0);

  useEffect(() => {
    const uid = tokenStorage.getUid();
    if (!uid) return;
    let cancelled = false;
    void apiClient.get<AssessmentSet>(`/assessment-sets/${FREQUENCY_ASSESSMENT_SET_KEY}`).then(response => {
      if (cancelled) return;
      if (response.success && response.data && response.data.questions.length === 3) {
        setSet(response.data);
        setAnswers({});
        startedAt.current = Date.now();
      } else {
        setError(response.error ?? '평가 문제를 불러오지 못했어요.');
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const allAnswered = set !== null && set.questions.every(question => Boolean(answers[question.questionId]?.trim()));

  async function submit() {
    if (!set || !allAnswered || submitting || result) return;
    setSubmitting(true);
    setError('');
    const uid = tokenStorage.getUid();
    if (!uid) {
      setError('로그인 정보가 없습니다. UT 계정으로 다시 로그인해주세요.');
      setSubmitting(false);
      return;
    }
    const elapsed = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
    const response = await apiClient.post<AssessmentSubmissionResult>(`/assessment-sets/${set.setKey}/submit`, {
      uid,
      answers: set.questions.map(question => ({
        questionId: question.questionId,
        userAnswer: answers[question.questionId],
        timeTakenSec: elapsed,
      })),
    });
    const submitted = response.success ? response.data : null;
    if (!submitted) setError(response.error ?? '답안을 제출하지 못했어요. 잠시 후 다시 시도해주세요.');

    if (submitted) {
      setResult(submitted);
      if (submitted.passed) {
        try { localStorage.setItem(ASSESSMENT_STORAGE_KEY, 'true'); } catch { /* in-memory result remains available */ }
      }
    }
    setSubmitting(false);
  }

  function retry() {
    setAnswers({});
    setResult(null);
    setError('');
    startedAt.current = Date.now();
  }

  if (loading) return <main className="fa-shell"><section className="fa-panel fa-state"><p>평가 문제를 불러오는 중…</p></section></main>;
  if (!set) return <main className="fa-shell"><section className="fa-panel fa-state"><h1>평가를 시작할 수 없어요</h1><p className="fa-error">{error}</p><button className="fa-secondary" onClick={onBack}>학습으로 돌아가기</button></section></main>;

  if (result) return <main className="fa-shell"><section className={`fa-result ${result.passed ? 'passed' : 'retry'}`}>
    <span className="fa-result-icon">{result.passed ? '✓' : '↻'}</span>
    <p>도수분포표 · 확인 평가</p>
    <h1>{result.passed ? '통과했어요' : '한 번 더 확인해봐요'}</h1>
    <strong className="fa-score">{result.score} / {result.totalQuestions}</strong>
    <p>{result.passed ? '새 자료에서도 도수분포표를 읽고 만들 수 있어요.' : `${result.passScore}문제 이상 맞히면 다음 개념으로 갈 수 있어요.`}</p>
    <div className="fa-review">{set.questions.map((question, index) => {
      const item = result.results.find(value => value.questionId === question.questionId);
      return <article key={question.questionId} className={item?.correct ? 'correct' : 'incorrect'}><strong>{index + 1}번 {item?.correct ? '정답' : '오답'}</strong><p>{item?.explanation}</p></article>;
    })}</div>
    <div className="fa-result-actions">{result.passed ? <button className="fa-primary" onClick={onPassed}>다음 개념으로 →</button> : <><button className="fa-secondary" onClick={onBack}>학습 다시 보기</button><button className="fa-primary" onClick={retry}>다시 풀기</button></>}</div>
  </section></main>;

  return <main className="fa-shell"><section className="fa-panel">
    <header><div><p>실전 문제 · 최초 답안 기준</p><h1>도수분포표 확인하기</h1><span>3문제 중 {set.passScore}문제 이상이면 통과</span></div><button onClick={onBack}>← 학습으로</button></header>
    <div className="fa-progress" role="progressbar" aria-label="답변 진행" aria-valuemin={0} aria-valuemax={set.totalQuestions} aria-valuenow={Object.keys(answers).length}><i style={{ width: `${Object.keys(answers).length / set.totalQuestions * 100}%` }} /></div>
    <div className="fa-questions">{set.questions.map((question, index) => <article key={question.questionId} className="fa-question">
      <div className="fa-question-meta"><strong>{index + 1}</strong><span>{question.tags.find(tag => tag.role === 'TARGET')?.tagName}</span><small>난이도 {question.difficulty}</small></div>
      <QuestionPrompt problem={{ description: question.content, answerType: question.answerType, choiceA: question.choiceA, choiceB: question.choiceB, choiceC: question.choiceC, choiceD: question.choiceD }} value={answers[question.questionId] ?? ''} disabled={submitting} onChange={value => setAnswers(previous => ({ ...previous, [question.questionId]: value }))} />
    </article>)}</div>
    {error && <p className="fa-error" role="alert">{error}</p>}
    <footer><span>로그인 계정에 최초 답안이 기록돼요.</span><button className="fa-primary" disabled={!allAnswered || submitting} onClick={() => void submit()}>{submitting ? '채점 중…' : '최종 제출'}</button></footer>
  </section></main>;
}
