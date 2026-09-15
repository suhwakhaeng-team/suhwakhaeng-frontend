import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GraphIndex, ProgressMap } from '../../types/learningGraph';
import type { AdaptiveQuestion } from '../../types/adaptive';
import { statusOf } from '../../services/learningGraph';
import { apiClient } from '../../lib/apiClient';
import GraphIcon from './GraphIcon';

const serverLabel = { MASTERED: '통과', IN_PROGRESS: '진행 중', WEAK: '약점', UNDIAGNOSED: '미진단' };

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
  const concept = index.concepts.get(selected)!;
  const unit = index.units.get(concept.unitId)!;
  const tagId = /^\d+$/.test(concept.id) ? Number(concept.id) : null;
  const currentStatus = concept.metadata?.assessmentStatus
    ? serverLabel[concept.metadata.assessmentStatus]
    : ({ known: '앎', unknown: '모름', unset: '미정' })[statusOf(progress, selected)];

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

  return <aside className="kg-detail" aria-label="선택한 개념">
    <header><span>개념 정보</span><button className="kg-icon-button" aria-label="닫기" onClick={onClose}><GraphIcon name="close" /></button></header>
    <div className="kg-detail-body">
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
    </div>
  </aside>;
}
