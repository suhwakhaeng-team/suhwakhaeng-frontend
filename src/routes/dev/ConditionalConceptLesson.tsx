import { useId, useRef, useState } from 'react';
import MathText from '../../components/MathText';
import { ADDITION_REGIONS, CONCEPT_LESSONS, DICE_OUTCOMES, EXAMPLE_PEOPLE, inDiceEvent, referenceCounts } from './conditionalConceptLessons';
import type { DiceEvent, LessonDiagram, ReferenceGroup } from './conditionalConceptLessons';
import './ConditionalConceptLesson.css';
import { TeamConceptSupplement } from '../../components/knowledgeGraph/TeamConceptContent';

export default function ConditionalConceptLesson({ nodeId, onConfirm, teamReference = false }: { nodeId: string; onConfirm: () => void; teamReference?: boolean }) {
  const lesson = CONCEPT_LESSONS[nodeId];
  const [stepIndex, setStepIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  if (!lesson) return null;
  const step = lesson.steps[stepIndex];
  const move = (direction: number) => {
    setStepIndex(index => Math.max(0, Math.min(lesson.steps.length - 1, index + direction)));
    heading.current?.focus();
  };
  return <div className="ccl-lesson">
    <p className="ccl-lead">{lesson.lead}</p>
    <ol className="ccl-progress" aria-label="개념 설명 단계">{lesson.steps.map((item, index) => <li key={item.title} aria-current={index === stepIndex ? 'step' : undefined} className={index <= stepIndex ? 'is-reached' : ''}><span>{index + 1}</span></li>)}</ol>
    <section className="ccl-step" aria-label={step.title}>
      <h3 tabIndex={-1} ref={heading}>{step.title}</h3>
      {step.paragraphs.map(paragraph => <p key={paragraph}><MathText text={paragraph} /></p>)}
      {step.diagram && <LessonVisual key={`${nodeId}:${stepIndex}`} kind={step.diagram} nodeId={nodeId} stepIndex={stepIndex} />}
      {step.formulas && <div className="ccl-formulas">{step.formulas.map(formula => <p key={formula}><MathText text={formula} /></p>)}</div>}
      <p className="ccl-takeaway"><MathText text={step.takeaway} /></p>
    </section>
    {teamReference && <TeamConceptSupplement conceptName={({'c-events':'표본공간과 사건','c-complement':'여사건','c-addition':'확률의 덧셈 정리','c-conditional':'조건부확률','c-multiplication':'확률의 곱셈정리'} as Record<string,string>)[nodeId]} />}
    <div className="ccl-navigation"><span>{stepIndex + 1} / {lesson.steps.length}</span><div>
      {stepIndex > 0 && <button type="button" className="cpm-text-button" onClick={() => move(-1)}>← 이전</button>}
      <button type="button" className="cpm-primary" onClick={stepIndex < lesson.steps.length - 1 ? () => move(1) : onConfirm}>{stepIndex < lesson.steps.length - 1 ? '다음 →' : '확인 문제 풀기 →'}</button>
    </div></div>
  </div>;
}

function LessonVisual({ kind, nodeId, stepIndex }: { kind: LessonDiagram; nodeId: string; stepIndex: number }) {
  if (kind === 'dice' || kind === 'events') return <DiceVisual combined={kind === 'events'} />;
  if (kind === 'conditional' || kind === 'multiplication') return <PeopleVisual initialGroup={kind === 'multiplication' || stepIndex === 1 ? 'A' : 'B'} multiplying={kind === 'multiplication'} />;
  if (kind === 'addition') return <AdditionVisual />;
  if (kind === 'complement') return <ComplementVisual />;
  return <PartitionVisual mode={nodeId === 'c-complement' ? 'B' : stepIndex === 1 ? 'A' : 'outsideB'} />;
}

function DiceVisual({ combined }: { combined: boolean }) {
  const [event, setEvent] = useState<DiceEvent>(combined ? 'union' : 'A');
  const choices: [DiceEvent, string][] = combined ? [['A', 'A：짝수'], ['B', 'B：3의 배수'], ['union', 'A ∪ B'], ['intersection', 'A ∩ B']] : [['all', '전체 S'], ['A', 'A：짝수']];
  const selected = DICE_OUTCOMES.filter(value => inDiceEvent(value, event));
  return <figure className="ccl-visual">
    <div className="ccl-switches" role="group" aria-label="주사위 사건 선택">{choices.map(([value, label]) => <button key={value} type="button" aria-pressed={event === value} onClick={() => setEvent(value)}>{label}</button>)}</div>
    <div className="ccl-dice" role="img" aria-label={`가능한 눈은 1부터 6, 선택한 결과는 ${selected.join(', ')}예요.`}>{DICE_OUTCOMES.map(value => <span key={value} className={inDiceEvent(value, event) ? 'is-selected' : ''}>{value}<i aria-hidden="true">{inDiceEvent(value, event) ? '●' : '○'}</i></span>)}</div>
    <figcaption aria-live="polite">선택한 결과：{'{'}{selected.join(', ')}{'}'} · {selected.length}가지</figcaption>
  </figure>;
}

type Region = 'A' | 'B' | 'union' | 'intersection' | 'complement' | 'aOnly' | 'bOnly';
/** A set diagram illustrates membership only; circle areas do not encode probabilities. */
function Venn({ region, single = false, counts = false, overlapTwice = false, label }: { region: Region; single?: boolean; counts?: boolean; overlapTwice?: boolean; label: string }) {
  const unique = useId().replace(/:/g, '');
  const aClip = `${unique}-a`, aHole = `${unique}-ah`, bHole = `${unique}-bh`;
  const fill = '#bfdbfe';
  return <svg className="ccl-venn" viewBox="0 0 360 200" role="img" aria-label={label}>
    <defs>
      <clipPath id={aClip}><circle cx={single ? 150 : 140} cy="105" r="62" /></clipPath>
      <mask id={aHole}><rect width="360" height="200" fill="white" /><circle cx={single ? 150 : 140} cy="105" r="62" fill="black" /></mask>
      <mask id={bHole}><rect width="360" height="200" fill="white" /><circle cx="220" cy="105" r="62" fill="black" /></mask>
    </defs>
    <rect x="20" y="18" width="320" height="164" rx="12" fill="#fff" stroke="#cbd5e1" />
    {region === 'complement' && <rect x="20" y="18" width="320" height="164" rx="12" fill={fill} mask={`url(#${aHole})`} />}
    {(region === 'A' || region === 'union') && <circle cx={single ? 150 : 140} cy="105" r="62" fill={fill} />}
    {(region === 'B' || region === 'union') && <circle cx="220" cy="105" r="62" fill={fill} />}
    {region === 'intersection' && <circle cx="220" cy="105" r="62" fill={fill} clipPath={`url(#${aClip})`} />}
    {region === 'aOnly' && <circle cx="140" cy="105" r="62" fill={fill} mask={`url(#${bHole})`} />}
    {region === 'bOnly' && <circle cx="220" cy="105" r="62" fill={fill} mask={`url(#${aHole})`} />}
    {overlapTwice && <circle cx="220" cy="105" r="62" fill="#fdba74" clipPath={`url(#${aClip})`} />}
    <circle cx={single ? 150 : 140} cy="105" r="62" fill="none" stroke="#64748b" strokeWidth="1.5" />
    {!single && <circle cx="220" cy="105" r="62" fill="none" stroke="#64748b" strokeWidth="1.5" />}
    <text x="30" y="40">S</text><text x={single ? 145 : 105} y="67">A</text>
    {!single && <text x="245" y="67">B</text>}
    {single && <text x="272" y="110">Aᶜ</text>}
    {counts && <><text x="109" y="111">{ADDITION_REGIONS.aOnly}/10</text><text x="179" y="111">{ADDITION_REGIONS.both}/10</text><text x="251" y="111">{ADDITION_REGIONS.bOnly}/10</text><text x="310" y="164">{ADDITION_REGIONS.neither}/10</text></>}
    {overlapTwice && <text className="ccl-overlap-count" x="180" y="142">두 번</text>}
  </svg>;
}

function ComplementVisual() {
  const [outside, setOutside] = useState(true);
  return <figure className="ccl-visual"><div className="ccl-switches" role="group" aria-label="사건과 여사건 선택"><button type="button" aria-pressed={!outside} onClick={() => setOutside(false)}>A</button><button type="button" aria-pressed={outside} onClick={() => setOutside(true)}>Aᶜ：A가 아닌 부분</button></div>
    <Venn single region={outside ? 'complement' : 'A'} label={outside ? '표본공간 S에서 사건 A 바깥의 여사건 Aᶜ가 강조돼요.' : '표본공간 S에서 원 A 안쪽이 강조돼요.'} />
    <figcaption aria-live="polite">{outside ? 'A 바깥의 나머지 전부가 Aᶜ예요.' : 'A와 Aᶜ는 겹치지 않고, 합치면 S 전체예요.'}</figcaption>
  </figure>;
}

function PartitionVisual({ mode }: { mode: 'A' | 'B' | 'outsideB' }) {
  const options: [Region, string][] = mode === 'A' ? [['A', 'A 전체'], ['intersection', 'A ∩ B'], ['aOnly', 'A ∩ Bᶜ']] : mode === 'B' ? [['B', 'B 전체'], ['intersection', 'A ∩ B'], ['bOnly', 'Aᶜ ∩ B']] : [['union', 'A ∪ B'], ['B', '빼는 B'], ['aOnly', '남은 A ∩ Bᶜ']];
  const [region, setRegion] = useState<Region>(options[0][0]);
  const caption = options.find(([value]) => value === region)![1];
  return <figure className="ccl-visual"><div className="ccl-switches" role="group" aria-label="나누어진 영역 선택">{options.map(([value, label]) => <button key={value} type="button" aria-pressed={region === value} onClick={() => setRegion(value)}>{label}</button>)}</div>
    <Venn region={region} label={`${caption} 영역을 파란색으로 강조한 두 사건의 벤 다이어그램`} />
    <figcaption aria-live="polite">지금 강조한 영역：{caption}</figcaption>
  </figure>;
}

function AdditionVisual() {
  const [stage, setStage] = useState(0);
  const regions: Region[] = ['A', 'B', 'union', 'union'];
  const captions = ['A는 3/10 + 2/10 = 5/10이에요.', 'B는 2/10 + 2/10 = 4/10이에요.', '5/10 + 4/10 = 9/10. 공통 부분 2/10을 두 번 셌어요.', '9/10 − 2/10 = 7/10. 이제 공통 부분도 한 번만 세어요.'];
  return <figure className="ccl-visual"><div className="ccl-switches" role="group" aria-label="겹침을 세는 단계">{['A를 세기', 'B를 세기', '그대로 더하기', '겹침 한 번 빼기'].map((label, index) => <button key={label} type="button" aria-pressed={stage === index} onClick={() => setStage(index)}>{label}</button>)}</div>
    <Venn region={regions[stage]} counts overlapTwice={stage === 2} label={`A에만 속하는 확률 3/10, 교집합 2/10, B에만 속하는 확률 2/10, 둘 다 아닌 확률 3/10. ${captions[stage]}`} />
    <figcaption aria-live="polite">{captions[stage]}</figcaption>
    <small>그림은 사건의 포함 관계예요. 확률은 원의 크기가 아니라 적힌 값으로 확인해요.</small>
  </figure>;
}

function PeopleVisual({ initialGroup, multiplying }: { initialGroup: ReferenceGroup; multiplying: boolean }) {
  const [group, setGroup] = useState<ReferenceGroup>(initialGroup);
  const counts = referenceCounts(group);
  const expression = group === 'all' ? String.raw`$P(A)=\frac6{12}=\frac12$` : group === 'A' ? String.raw`$P(B\mid A)=\frac46=\frac23$` : String.raw`$P(A\mid B)=\frac48=\frac12$`;
  return <figure className="ccl-visual"><div className="ccl-switches" role="group" aria-label="확률의 기준 범위">{([['all', '전체 12명'], ['B', 'B인 8명'], ['A', 'A인 6명']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={group === value} onClick={() => setGroup(value)}>{label}</button>)}</div>
    <p className="ccl-people-key">A：안경을 쓴 사람 · B：모자를 쓴 사람</p>
    <div className="ccl-people" role="img" aria-label={`12명 중 A는 6명, B는 8명, 공통은 4명. 지금 후보 ${counts.total}명 중 찾는 사람 ${counts.matches}명.`}>{EXAMPLE_PEOPLE.map(person => {
      const eligible = counts.ids.includes(person.id);
      const match = eligible && (group === 'A' ? person.b : person.a);
      return <div key={person.id} className={`${eligible ? '' : 'is-outside'} ${match ? 'is-match' : ''}`}><b>{person.id}</b><span>{person.a ? 'A' : '—'} · {person.b ? 'B' : '—'}</span></div>;
    })}</div>
    <figcaption aria-live="polite"><MathText text={expression} /><span>{counts.total}명 중 {counts.matches}명 · {group === 'all' ? '전체가 기준' : `${group}가 새로운 기준`}</span></figcaption>
    {multiplying && group !== 'all' && <p className="ccl-product-caption"><MathText text={group === 'A' ? String.raw`$\frac6{12}\times\frac46=\frac4{12}$` : String.raw`$\frac8{12}\times\frac48=\frac4{12}$`} /> · 기준을 바꿔도 전체에서 둘 다인 사람은 4명이에요.</p>}
  </figure>;
}
