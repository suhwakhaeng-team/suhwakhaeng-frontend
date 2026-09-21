import { useEffect, useRef, useState, type FormEvent } from 'react';
import { submitConceptNoteRevision } from '../../lib/conceptNoteRevisionClient';
import type { ConceptNoteRevisionType } from '../../types/conceptNoteRevision';

const requestTypes: { value: ConceptNoteRevisionType; label: string }[] = [
  { value: 'HARD_TO_UNDERSTAND', label: '설명이 어려워요' },
  { value: 'POSSIBLE_ERROR', label: '내용이 틀린 것 같아요' },
  { value: 'NEED_EXAMPLE', label: '예시가 더 필요해요' },
  { value: 'CONFUSING_VISUAL', label: '그림이 헷갈려요' },
  { value: 'OTHER', label: '기타' },
];

export default function ConceptNoteRevisionForm({ conceptName, uid }: {
  conceptName: string;
  uid: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [requestType, setRequestType] = useState<ConceptNoteRevisionType>('HARD_TO_UNDERSTAND');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const detailRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen || message) return;
    const scrollTimer = window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 140);
    return () => window.clearTimeout(scrollTimer);
  }, [isOpen, message]);

  const openForm = () => {
    setMessage('');
    setError('');
    setIsOpen(true);
  };

  const closeForm = () => setIsOpen(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail.trim()) return;

    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      const result = await submitConceptNoteRevision(uid, {
        conceptName,
        requestType,
        detail: detail.trim(),
      });
      setDetail('');
      setMessage(result.savedLocally
        ? '개발 화면이라 요청을 이 기기에 임시 저장했어요.'
        : '수정 요청을 보냈어요. 더 좋은 노트로 다듬을게요!');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : '수정 요청을 보내지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <section className="kg-note-revision">
    <div className="kg-note-revision-intro">
      <div><strong>노트에서 아쉬운 점을 발견했나요?</strong><p>어려운 설명이나 부족한 예시를 알려주세요.</p></div>
      <button type="button" aria-expanded={isOpen} onClick={isOpen ? closeForm : openForm}>
        {isOpen ? '닫기' : '수정 요청'}
      </button>
    </div>

    {isOpen && <div className="kg-note-revision-panel">
      {message ? <div className="kg-note-revision-success" role="status">
        <span aria-hidden="true">✓</span>
        <div>
          <strong>피드백 감사합니다!</strong>
          <p>{message}</p>
        </div>
        <button type="button" onClick={closeForm}>확인</button>
      </div> : <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>어떤 점을 고치면 좋을까요?</legend>
          <div className="kg-note-revision-types">
            {requestTypes.map(type => <button
              key={type.value}
              type="button"
              className={requestType === type.value ? 'is-selected' : ''}
              aria-pressed={requestType === type.value}
              onClick={() => setRequestType(type.value)}
            >{type.label}</button>)}
          </div>
        </fieldset>
        <label className="kg-note-revision-detail" htmlFor={`note-revision-${conceptName}`}>
          자세히 알려주세요
          <textarea
            ref={detailRef}
            id={`note-revision-${conceptName}`}
            value={detail}
            onChange={event => setDetail(event.target.value)}
            placeholder="어느 부분이 어려웠는지 편하게 적어주세요."
            maxLength={500}
            required
          />
          <span>{detail.length}/500</span>
        </label>
        <button className="kg-note-revision-submit" type="submit" disabled={isSubmitting || !detail.trim()}>
          {isSubmitting ? '보내는 중…' : '요청 보내기'}
        </button>
        {error && <p className="kg-note-revision-error" role="alert">{error}</p>}
      </form>}
    </div>}
  </section>;
}
