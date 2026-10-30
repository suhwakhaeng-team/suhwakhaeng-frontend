import { useEffect, useRef, useState } from 'react';
import MathText from '../../components/MathText';
import { EXAMPLE_PEOPLE, referenceCounts, type ReferenceGroup } from './conditionalConceptLessons';
import { activityCorrect, formulaPreview, UT4_INTERACTIVE_LESSONS, type RegionId } from './ut4InteractiveLessons';
import './UT4InteractiveLesson.css';
import './ConditionalConceptLesson.css';

export default function UT4InteractiveLesson({ nodeId, disabled, onComplete, onSkip, confirmLabel }: {
  nodeId: string; disabled: boolean; onComplete: () => void; onSkip?: () => void; confirmLabel: string;
}) {
  const activities = UT4_INTERACTIVE_LESSONS[nodeId];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Record<string, string[]>>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [index]);
  const activity = activities[index], current = answers[index] || {};
  const correct = checked[index] && activityCorrect(activity, current);
  function select(groupId: string, optionId: string) {
    const group = activity.groups.find(item => item.id === groupId)!;
    const previous = current[groupId] || [];
    const values = group.multiple ? previous.includes(optionId) ? previous.filter(id => id !== optionId) : [...previous, optionId] : [optionId];
    setAnswers(old => ({ ...old, [index]: { ...current, [groupId]: values } }));
    setChecked(old => ({ ...old, [index]: false }));
  }
  return <section className="ut4-activity" aria-label="참여형 개념 학습">
    <div className="ut4-activity-header"><span>직접 해보며 배우기 · {index + 1} / {activities.length}</span>
      {onSkip && <button type="button" disabled={disabled} onClick={onSkip}>넘어가기 →</button>}</div>
    {onSkip && <p className="ut4-activity-resume">한 번 완료한 개념이에요. 다시 해보거나 넘어갈 수 있어요.</p>}
    <ol className="ccl-progress" aria-label="참여형 학습 단계">{activities.map((step, i) => <li key={step.title} className={i <= index ? 'is-reached' : ''} aria-current={i === index ? 'step' : undefined}><span>{i + 1}</span></li>)}</ol>
    <h3 ref={heading} tabIndex={-1}>{activity.title}</h3><p className="ut4-activity-task">{activity.task}</p>
    {activity.visual === 'people' && <People group={(current.base?.[0] || 'all') as ReferenceGroup} />}
    {activity.visual === 'regions' && <Regions selected={current.region || []} onSelect={activity.groups.some(group => group.id === 'region') ? id => select('region', id) : undefined} disabled={disabled} />}
    {activity.visual === 'formula' && <div className="ut4-activity-preview" aria-live="polite"><span>내가 만든 식</span><MathText text={formulaPreview(nodeId, current)} /></div>}
    {activity.groups.map(group => <fieldset key={group.id} className="ut4-activity-options" disabled={disabled}><legend>{group.label}{group.multiple ? ' · 여러 개 선택 가능' : ''}</legend><div>{group.options.map(option => <button type="button" key={option.id} aria-pressed={current[group.id]?.includes(option.id) || false} onClick={() => select(group.id, option.id)}>{option.label}</button>)}</div></fieldset>)}
    <button className="ut4-activity-check" type="button" disabled={disabled || !activity.groups.every(group => current[group.id]?.length)} onClick={() => setChecked(old => ({ ...old, [index]: true }))}>선택 확인</button>
    {checked[index] && <div className={`ut4-activity-feedback${correct ? ' is-correct' : ''}`} role="status"><strong>{correct ? '선택한 부분으로 이렇게 연결돼요' : '이 부분을 다시 살펴보세요'}</strong><p>{correct ? activity.explanation : activity.hint}</p>{correct && <div className="ut4-activity-formula"><MathText text={activity.formula} /></div>}</div>}
    {!checked[index] && <p className="ut4-activity-instruction">직접 선택한 뒤 ‘선택 확인’을 눌러 보세요.</p>}
    <div className="ut4-activity-navigation">{index > 0 && <button type="button" disabled={disabled} onClick={() => setIndex(i => i - 1)}>← 이전 활동</button>}
      <button className="ut4-activity-next" type="button" disabled={disabled || !correct} onClick={index < activities.length - 1 ? () => setIndex(i => i + 1) : onComplete}>{index < activities.length - 1 ? '다음 활동 →' : confirmLabel}</button></div>
  </section>;
}

function People({ group }: { group: ReferenceGroup }) {
  const counts = referenceCounts(group);
  return <figure className="ccl-visual"><p className="ccl-people-key">A: 안경 · B: 모자 · 공통인 사람은 4명이에요.</p><div className="ccl-people" role="img" aria-label={`현재 기준은 ${counts.total}명`}>{EXAMPLE_PEOPLE.map(person => <div key={person.id} className={`${counts.ids.includes(person.id) ? '' : 'is-outside'} ${person.a && person.b ? 'is-match' : ''}`}><b>{person.id}</b><span>{person.a ? 'A' : '—'} · {person.b ? 'B' : '—'}</span></div>)}</div><figcaption aria-live="polite">지금 전체로 보는 사람: {counts.total}명</figcaption></figure>;
}

function Regions({ selected, onSelect, disabled }: { selected: string[]; onSelect?: (id: RegionId) => void; disabled: boolean }) {
  const fill = (region: RegionId) => selected.includes(region) ? '#93c5fd' : '#fff';
  const paths: Record<RegionId, string> = {
    'a-only': 'M180 57.63 A62 62 0 1 0 180 152.37 A62 62 0 0 1 180 57.63 Z',
    'both': 'M180 57.63 A62 62 0 0 1 180 152.37 A62 62 0 0 1 180 57.63 Z',
    'b-only': 'M180 57.63 A62 62 0 1 1 180 152.37 A62 62 0 0 0 180 57.63 Z',
    'neither': 'M20 18 H340 V202 H20 Z M180 57.63 A62 62 0 1 0 180 152.37 A62 62 0 1 0 180 57.63 Z',
  };
  const pieces: { id: RegionId; label: string; value: string }[] = [
    { id: 'a-only', label: 'A에만 속한 부분', value: '3/10' }, { id: 'both', label: 'A와 B의 공통 부분', value: '2/10' },
    { id: 'b-only', label: 'B에만 속한 부분', value: '2/10' }, { id: 'neither', label: 'A도 B도 아닌 부분', value: '3/10' },
  ];
  return <figure className="ccl-visual"><svg className="ccl-venn ut4-region-picker" viewBox="0 0 360 220" role="group" aria-label="네 부분으로 나뉜 두 사건의 영역">
    {pieces.map(piece => <g key={piece.id} role={onSelect ? 'button' : 'img'} tabIndex={onSelect && !disabled ? 0 : undefined} aria-label={`${piece.label} ${piece.value}`} aria-pressed={onSelect ? selected.includes(piece.id) : undefined} aria-disabled={onSelect ? disabled : undefined} onClick={onSelect && !disabled ? () => onSelect(piece.id) : undefined} onKeyDown={onSelect && !disabled ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(piece.id); } } : undefined}>
      <path d={paths[piece.id]} fill={fill(piece.id)} fillRule="evenodd" />
      <title>{piece.label}</title>
    </g>)}
    <g pointerEvents="none"><rect x="20" y="18" width="320" height="184" rx="12" fill="none" stroke="#94a3b8" /><circle cx="140" cy="105" r="62" fill="none" stroke="#64748b" /><circle cx="220" cy="105" r="62" fill="none" stroke="#64748b" /><text x="110" y="65">A</text><text x="250" y="65">B</text><text x="107" y="112">3/10</text><text x="180" y="112">2/10</text><text x="253" y="112">2/10</text><text x="300" y="184">3/10</text></g>
  </svg><figcaption>파란 부분이 직접 선택한 영역이에요.</figcaption><small>영역의 크기는 확률의 크기를 나타내지 않아요. 적힌 값으로 확인해요.</small></figure>;
}
