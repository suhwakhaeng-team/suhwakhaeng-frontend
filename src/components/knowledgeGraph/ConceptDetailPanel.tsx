import { useMemo } from 'react';
import type { ConceptStatus, GraphIndex, ProgressMap } from '../../types/learningGraph';
import { getMissingPrerequisites, getRootLearningGaps, statusOf } from '../../services/learningGraph';
import GraphIcon from './GraphIcon';

const statusLabels = { unset: '미정', known: '앎', unknown: '모름' };
export default function ConceptDetailPanel({ index, selected, progress, onSelect, onUpdate, onClose }: {
  index: GraphIndex; selected: string; progress: ProgressMap; onSelect: (id: string) => void; onUpdate: (id: string, status: ConceptStatus) => void; onClose: () => void;
}) {
  const concept = index.concepts.get(selected)!;
  const unit = index.units.get(concept.unitId)!;
  const status = statusOf(progress, selected);
  const diagnosis = useMemo(() => getRootLearningGaps(index, selected, progress), [index, selected, progress]);
  const missing = useMemo(() => getMissingPrerequisites(index, selected, progress), [index, selected, progress]);
  const chip = (id: string) => <button key={id} className={`kg-related status-${statusOf(progress, id)}`} onClick={() => onSelect(id)}><span className="kg-status-dot" /><span>{index.concepts.get(id)!.name}</span><GraphIcon name="arrow" size={14} /></button>;
  return <aside className="kg-detail" aria-label="선택한 개념 상세">
    <header><span className="kg-eyebrow">CONCEPT NOTES</span><button className="kg-icon-button" aria-label="상세 패널 닫기" onClick={onClose}><GraphIcon name="close" /></button></header>
    <div className="kg-detail-body">
      <span className="kg-unit-breadcrumb">{index.data.subject.name} <span>/</span> {unit.name}</span>
      <h2>{concept.name}</h2><p className="kg-description">{concept.description}</p>
      <section className="kg-self-status"><h3>이 개념, 얼마나 알고 있나요?</h3><div className="kg-status-buttons" role="group" aria-label="학습 상태 변경">
        {(['unset', 'known', 'unknown'] as const).map(value => <button key={value} className={`status-${value} ${status === value ? 'is-active' : ''}`} aria-pressed={status === value} onClick={() => onUpdate(selected, value)}><span>{value === 'known' ? '✓' : value === 'unknown' ? '?' : '○'}</span>{statusLabels[value]}</button>)}
      </div><small>스스로 표시한 상태예요. 테스트 점수는 바뀌지 않아요.</small></section>
      <section className="kg-diagnosis"><span className="kg-eyebrow">YOUR NEXT STEP</span><h3>{diagnosis.roots.length ? '여기서부터 연결해보세요' : diagnosis.cycleBlocked.length ? '관계를 확인해주세요' : missing.length ? '이전 개념도 확인해보세요' : '배울 준비가 되었어요'}</h3>
        {diagnosis.roots.map(({ concept: root, status: rootStatus, path }) => <button className="kg-gap-recommendation" key={root.id} onClick={() => onSelect(root.id)}><span className={`kg-status-dot status-${rootStatus}`} /><span><strong>{root.name}</strong><small>{rootStatus === 'unknown' ? '먼저 복습 추천' : '이해하고 있는지 확인'} · {path.length - 1}단계 이전</small><em>{path.map(id => index.concepts.get(id)!.name).join(' ← ')}</em></span><GraphIcon name="arrow" size={16} /></button>)}
        {!diagnosis.roots.length && !diagnosis.cycleBlocked.length && <p>{!concept.prerequisites.length ? '이 개념은 출발점이에요. 여기서 학습을 시작해도 좋아요.' : !missing.length ? '필요한 선수개념을 모두 알고 있습니다.' : '직접 선수개념은 알고 있지만, 그 이전에 미정·모름인 개념이 있어요.'}</p>}
        {!!diagnosis.cycleBlocked.length && <p className="kg-warning">선수 관계에 순환이 있어 일부 학습 순서를 정할 수 없어요. 개념 관계 검토가 필요해요.</p>}
        <small>표시한 상태와 선수 관계를 따른 제안이며, 능력 평가 결과는 아니에요.</small>
      </section>
      <section className="kg-relationships"><h3>직접 선수개념 <span>{concept.prerequisites.length}</span></h3>{concept.prerequisites.length ? concept.prerequisites.map(chip) : <p>선수개념이 없어요.</p>}</section>
      {!!missing.length && <details className="kg-missing"><summary>부족한 선수개념 전체 <span>{missing.length}</span></summary><div><h4>먼저 복습 · 모름</h4>{missing.filter(m => m.status === 'unknown').map(m => chip(m.concept.id))}<h4>확인 필요 · 미정</h4>{missing.filter(m => m.status === 'unset').map(m => chip(m.concept.id))}</div></details>}
      <section className="kg-relationships"><h3>이어지는 개념 <span>{index.successors.get(selected)!.length}</span></h3>{index.successors.get(selected)!.length ? index.successors.get(selected)!.map(chip) : <p>등록된 후속개념이 없어요.</p>}</section>
    </div>
    <footer><span className="kg-save-dot" /> 로컬 자기평가 · 테스트 점수와 별도</footer>
  </aside>;
}
