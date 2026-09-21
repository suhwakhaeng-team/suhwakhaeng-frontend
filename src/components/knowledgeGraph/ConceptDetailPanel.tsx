import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GraphIndex, ProgressMap } from '../../types/learningGraph';
import type { AdaptiveQuestion } from '../../types/adaptive';
import { statusOf } from '../../services/learningGraph';
import { apiClient } from '../../lib/apiClient';
import { conceptNotesByName } from '../../data/conceptNotes';
import { conceptNotePdfFilename, createConceptNotePdfBlob } from '../../utils/conceptNoteExport';
import GraphIcon from './GraphIcon';
import ConceptNoteView from './ConceptNoteView';

const serverLabel = { MASTERED: '통과', IN_PROGRESS: '진행 중', WEAK: '약점', UNDIAGNOSED: '미진단' };
type PdfState =
  | { status: 'idle' }
  | { status: 'loading' | 'error'; noteTitle: string }
  | { status: 'ready'; noteTitle: string; url: string; blob: Blob };

const isIosDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function ConceptDetailPanel({ index, selected, progress, practiceUid, onClose }: {
  index: GraphIndex;
  selected: string;
  progress: ProgressMap;
  practiceUid: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [isLoadingPractice, setIsLoadingPractice] = useState(false);
  const [practiceMessage, setPracticeMessage] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [pdfState, setPdfState] = useState<PdfState>({ status: 'idle' });
  const [pdfRetry, setPdfRetry] = useState(0);
  const [shareError, setShareError] = useState('');
  const noteRef = useRef<HTMLElement>(null);
  const concept = index.concepts.get(selected)!;
  const unit = index.units.get(concept.unitId)!;
  const note = conceptNotesByName[concept.name];
  const tagId = /^\d+$/.test(concept.id) ? Number(concept.id) : null;
  const currentStatus = concept.metadata?.assessmentStatus
    ? serverLabel[concept.metadata.assessmentStatus]
    : ({ known: '앎', unknown: '모름', unset: '미정' })[statusOf(progress, selected)];

  useEffect(() => {
    if (!showNote || !note || !noteRef.current) return;
    const noteElement = noteRef.current;
    let cancelled = false;
    let objectUrl: string | null = null;
    void createConceptNotePdfBlob(note, noteElement).then(blob => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setPdfState({ status: 'ready', noteTitle: note.title, url: objectUrl, blob });
    }).catch(() => {
      if (!cancelled) setPdfState({ status: 'error', noteTitle: note.title });
    });

    return () => {
      cancelled = true;
      // Safari may still be opening the downloaded file when the note closes.
      if (objectUrl) {
        const urlToRelease = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(urlToRelease), 60_000);
      }
    };
  }, [showNote, note, pdfRetry]);

  const readyPdf = pdfState.status === 'ready' && pdfState.noteTitle === note?.title ? pdfState : null;
  const pdfFile = readyPdf && note && isIosDevice() && typeof File !== 'undefined'
    && typeof navigator.share === 'function' && typeof navigator.canShare === 'function'
    ? new File([readyPdf.blob], conceptNotePdfFilename(note), { type: 'application/pdf' })
    : null;
  let canSharePdf = false;
  try {
    canSharePdf = Boolean(pdfFile && navigator.canShare({ files: [pdfFile] }));
  } catch {
    // The direct PDF link remains available if this browser cannot share files.
  }

  const startPractice = async () => {
    if (!practiceUid || tagId === null) {
      setPracticeMessage('실서비스에서 로그인하면 DB 문제와 연결됩니다.');
      return;
    }

    setIsLoadingPractice(true);
    setPracticeMessage('');
    const response = await apiClient.get<AdaptiveQuestion[]>(
      `/adaptive/questions?uid=${encodeURIComponent(practiceUid)}&tagId=${tagId}`,
    );
    setIsLoadingPractice(false);

    if (!response.success) {
      setPracticeMessage(response.error ?? '문제를 불러오지 못했습니다.');
      return;
    }
    if (!response.data?.length) {
      setPracticeMessage('이 개념에 연결된 문제가 아직 없습니다.');
      return;
    }

    navigate('/main/problem/start', {
      state: { questions: response.data, currentIndex: 0 },
    });
  };

  const sharePdf = () => {
    if (!pdfFile) return;
    setShareError('');
    void navigator.share({ files: [pdfFile], title: `${note?.title} 개념 노트` }).catch(error => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareError('공유 메뉴를 열지 못했어요. PDF 버튼으로 저장해 주세요.');
    });
  };

  const openNote = () => {
    if (!note) return;
    setPdfState({ status: 'loading', noteTitle: note.title });
    setShareError('');
    setShowNote(true);
  };

  const closeNote = () => {
    setShowNote(false);
    setPdfState({ status: 'idle' });
  };

  return <aside className={`kg-detail ${showNote ? 'is-note-open' : ''}`} aria-label="선택한 개념">
    <header>
      <div className="kg-detail-header-main">
        {showNote
          ? <button className="kg-note-back" type="button" onClick={closeNote}>← 개념 정보</button>
          : <span>개념 정보</span>}
        {showNote && note && <div className="kg-note-export" aria-label="개념 노트 다운로드">
          <strong>노트 저장</strong>
          {readyPdf ? <>
            <a href={readyPdf.url} download={conceptNotePdfFilename(note)} target="_blank" rel="noopener noreferrer" title="PDF 파일을 다운로드합니다">PDF</a>
            {canSharePdf && <button type="button" onClick={sharePdf} title="공유 메뉴에서 파일에 저장할 수 있어요">공유</button>}
          </> : <button
            type="button"
            disabled={pdfState.status !== 'error' || pdfState.noteTitle !== note.title}
            onClick={() => {
              setPdfState({ status: 'loading', noteTitle: note.title });
              setPdfRetry(previous => previous + 1);
            }}
          >{pdfState.status === 'error' && pdfState.noteTitle === note.title ? '다시 시도' : 'PDF 준비 중…'}</button>}
        </div>}
      </div>
      <button className="kg-icon-button" aria-label="닫기" onClick={onClose}><GraphIcon name="close" /></button>
    </header>
    <div className="kg-detail-body">
      {showNote && shareError && <p className="kg-note-export-error" role="alert">{shareError}</p>}
      {showNote && note ? <ConceptNoteView note={note} uid={practiceUid} noteRef={noteRef} /> : <>
        <span className="kg-unit-breadcrumb">{unit.name}</span>
        <div className="kg-title-row"><h2>{concept.name}</h2><span className="kg-grade-badge">{concept.metadata?.grade ?? '학년 미정'}</span><span className={`kg-current-status assessment-${concept.metadata?.assessmentStatus?.toLowerCase() ?? statusOf(progress, selected)}`}>{currentStatus}</span></div>
        <section className="kg-practice" aria-label="선택한 개념 연습">
          <span>연습 문제</span>
          <strong>{concept.name}</strong>
          <button type="button" onClick={() => void startPractice()} disabled={isLoadingPractice}>
            {isLoadingPractice ? '불러오는 중…' : '문제 풀기'}
            {!isLoadingPractice && <GraphIcon name="arrow" size={17} />}
          </button>
          {practiceMessage && <p role="status">{practiceMessage}</p>}
        </section>
        {note && <section className="kg-note-entry" aria-label={`${concept.name} 개념 노트`}>
          <span>쉬운 개념 노트</span>
          <strong>필기 없이 바로 이해해요</strong>
          <p>쉬운 말과 단계별 예제로 정리한 {concept.name} 노트예요.</p>
          <button type="button" onClick={openNote}>
            노트 보기 <GraphIcon name="arrow" size={17} />
          </button>
        </section>}
      </>}
    </div>
  </aside>;
}
