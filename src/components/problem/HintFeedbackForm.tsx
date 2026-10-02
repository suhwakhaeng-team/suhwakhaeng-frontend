import { useRef, useState, type FormEvent } from 'react';
import { submitHintFeedback } from '../../lib/hintFeedbackClient';
import type { HintFeedbackType } from '../../types/hintFeedback';
import ProblemContent from '../ProblemContent';

const feedbackTypes: { value: HintFeedbackType; label: string }[] = [
  { value: 'HARD_TO_UNDERSTAND', label: '설명이 어려워요' },
  { value: 'TOO_VAGUE', label: '너무 막연해요' },
  { value: 'TOO_DIRECT', label: '정답을 너무 알려줘요' },
  { value: 'POSSIBLE_ERROR', label: '내용이 틀린 것 같아요' },
  { value: 'OTHER', label: '기타' },
];

interface Props {
  uid: string | null;
  questionId: number;
  hintText?: string | null;
}

export default function HintFeedbackForm({ uid, questionId, hintText }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<'QUESTION' | 'EXPLANATION' | 'HINT'>('QUESTION');
  const [feedbackType, setFeedbackType] = useState<HintFeedbackType>('HARD_TO_UNDERSTAND');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const openForm = () => {
    setError('');
    setIsComplete(false);
    setIsOpen(true);
    window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      await submitHintFeedback(uid, {
        questionId,
        feedbackTarget,
        hintText: hintText ?? '',
        feedbackType,
        detail: detail.trim(),
      });
      setDetail('');
      setIsComplete(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : '피드백을 보내지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="hint-feedback">
      <div className="hint-feedback__intro">
        <div>
          <strong>문제나 설명에서 아쉬운 점이 있었나요?</strong>
          <p>문제·해설·힌트에 대한 의견을 알려주세요.</p>
        </div>
        <button type="button" aria-expanded={isOpen} onClick={isOpen ? () => setIsOpen(false) : openForm}>
          {isOpen ? '닫기' : '피드백 보내기'}
        </button>
      </div>

      {isOpen && (
        <div ref={panelRef} className="hint-feedback__panel">
          {isComplete ? (
            <div className="hint-feedback__success" role="status">
              <span aria-hidden="true">✓</span>
              <div><strong>피드백 감사합니다!</strong><p>관리자가 확인할 수 있도록 전달했어요.</p></div>
              <button type="button" onClick={() => setIsOpen(false)}>확인</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <fieldset>
                <legend>어디에 대한 피드백인가요?</legend>
                <div className="hint-feedback__types">
                  {([{ value: 'QUESTION', label: '문제' }, { value: 'EXPLANATION', label: '해설' }, { value: 'HINT', label: '힌트' }] as const).map(target => (
                    <button key={target.value} type="button"
                      className={feedbackTarget === target.value ? 'is-selected' : ''}
                      aria-pressed={feedbackTarget === target.value}
                      disabled={target.value === 'HINT' && !hintText}
                      onClick={() => {
                        setFeedbackTarget(target.value);
                        setFeedbackType('HARD_TO_UNDERSTAND');
                      }}>{target.label}</button>
                  ))}
                </div>
              </fieldset>
              {feedbackTarget === 'HINT' && hintText && (
                <section className="result-solution-hint hint-feedback__hint" aria-label="피드백할 풀이 힌트">
                  <h3>✏️ 풀이 힌트</h3>
                  <ProblemContent content={hintText} />
                </section>
              )}
              <fieldset>
                <legend>어떤 점이 아쉬웠나요?</legend>
                <div className="hint-feedback__types">
                  {feedbackTypes.filter(type => feedbackTarget === 'HINT' || type.value !== 'TOO_DIRECT').map(type => (
                    <button key={type.value} type="button"
                      className={feedbackType === type.value ? 'is-selected' : ''}
                      aria-pressed={feedbackType === type.value}
                      onClick={() => setFeedbackType(type.value)}>{type.label}</button>
                  ))}
                </div>
              </fieldset>
              <label className="hint-feedback__detail" htmlFor={`hint-feedback-${questionId}`}>
                자세히 알려주세요
                <textarea id={`hint-feedback-${questionId}`} value={detail}
                  onChange={event => setDetail(event.target.value)} maxLength={500} required
                  placeholder="어느 문장이 어렵거나 부족했는지 편하게 적어주세요." />
                <span>{detail.length}/500</span>
              </label>
              <button className="hint-feedback__submit" type="submit" disabled={isSubmitting || !detail.trim()}>
                {isSubmitting ? '보내는 중…' : '피드백 보내기'}
              </button>
              {error && <p className="hint-feedback__error" role="alert">{error}</p>}
            </form>
          )}
        </div>
      )}
    </section>
  );
}
