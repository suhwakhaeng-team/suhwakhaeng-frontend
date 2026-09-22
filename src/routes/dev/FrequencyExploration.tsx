import { useState } from 'react';
import { DATASETS, frequencies, RANGES } from './frequencyCourse';

const CONTEXTS = [
  { name: '통학 시간', unit: '분', question: '30분 이상 걸리는 학생 수 확인해보기', data: DATASETS.practice, lowers: [10, 20, 30], use: '통학 지원이 필요한 학생 수를 파악할 때 사용해요.' },
  { name: '시험 점수', unit: '점', question: '학생이 가장 많은 점수대 찾아보기', data: [52, 58, 60, 63, 63, 69, 70, 75], lowers: [50, 60, 70], use: '점수대별 학생 수를 보고 보충 학습을 계획해요.' },
  { name: '운동 시간', unit: '분', question: '20 이상 30 미만인 운동 시간 확인해보기', data: DATASETS.practice, lowers: [10, 20, 30], use: '운동 시간별 인원을 보고 활동 프로그램을 계획해요.' },
];

const CONCEPTS = [
  { title: '도수분포표', text: '자료를 구간별로 나누고 개수를 적은 표예요.' },
  { title: '계급', text: '계급은 자료를 나눈 구간이에요. ‘이상’은 포함하고 ‘미만’은 제외해요.' },
  { title: '도수', text: '도수는 계급에 속하는 자료의 개수예요. 같은 숫자도 각각 세어요.' },
  { title: '자료 분류', text: '자료를 해당 계급에 한 번씩 넣으면 도수가 1씩 늘어나요.' },
  { title: '도수의 합', text: '도수의 합은 전체 자료 수와 같아요. 합이 맞아도 각 계급의 도수를 확인해야 해요.' },
  { title: '표 해석', text: '큰 도수로 많이 모인 구간을 찾고, 도수를 더해 여러 구간의 자료 수를 구해요.' },
];

export default function FrequencyExploration({ step, onPractice }: { step: number; onPractice: () => void }) {
  const [context, setContext] = useState(0);
  const [grouped, setGrouped] = useState(false);
  const [boundary, setBoundary] = useState(20);
  const [counted, setCounted] = useState<number[]>([]);
  const [card, setCard] = useState<number | null>(null);
  const [placed, setPlaced] = useState<Record<number, number>>({});
  const [message, setMessage] = useState('');
  const [fixedCount, setFixedCount] = useState(5);
  const [applied, setApplied] = useState<number[]>([]);
  const data = DATASETS.practice;
  const scenario = CONTEXTS[context];
  const ready = step === 0 ? grouped : step === 1 ? boundary === 30 : step === 2 ? counted.length === 4 : step === 3 ? Object.keys(placed).length === data.length : step === 4 ? fixedCount === 4 : applied.length === 2;

  function count(index: number) {
    const value = data[index];
    if (value < 20 || value >= 30) { setMessage(`${value}분은 20 이상 30 미만에 속하지 않아요. 이번 도수에는 세지 않아요.`); return; }
    const already = counted.includes(index);
    setCounted(previous => already ? previous.filter(item => item !== index) : [...previous, index]);
    setMessage(already ? '선택을 해제했어요. 도수가 1 줄었어요.' : `${value}분 자료 한 개를 세었어요. 도수가 1 올라갔어요.`);
  }

  function place(index: number | null, range: number) {
    if (index === null || !Number.isInteger(index) || index < 0 || index >= data.length || placed[index] !== undefined) return;
    if (Math.floor((data[index] - 10) / 10) !== range) { setMessage(`${data[index]}분은 ${RANGES[range]}에 들어가지 않아요. 구간의 양 끝을 확인해요.`); return; }
    setPlaced(previous => ({ ...previous, [index]: range })); setCard(null);
    setMessage(`${data[index]}분을 분류했어요. 이 구간의 도수가 1 올라갔어요.`);
  }

  return <div className="fl-exploration">
    <div className="fl-concept"><h3>{CONCEPTS[step].title}</h3><p>{CONCEPTS[step].text}</p></div>
    {step === 0 && <>
      <div className="fl-context-tabs" aria-label="예시 선택">{CONTEXTS.map((item, index) => <button key={item.name} aria-pressed={context === index} onClick={() => { setContext(index); setGrouped(false); }}>{item.name}</button>)}</div>
      <h3 className="fl-activity-title">{scenario.question}</h3>
      <div className="fl-dataset"><span className="fl-caption">학생 8명의 {scenario.name} · {scenario.unit}</span><div className="fl-data">{scenario.data.map((value,index) => <span key={index}>{value}</span>)}</div></div>
      <button className="fl-secondary" onClick={() => setGrouped(previous => !previous)}>{grouped ? '원자료만 보기' : '구간별로 정리해 보기'}</button>
      {grouped && <table className="fl-live-table"><caption>같은 자료를 구간별로 묶은 도수분포표</caption><thead><tr><th>{scenario.name} ({scenario.unit})</th><th>도수 (명)</th></tr></thead><tbody>{scenario.lowers.map(lower => <tr key={lower}><td>{lower} 이상 {lower + 10} 미만</td><td>{scenario.data.filter(value => value >= lower && value < lower + 10).length}</td></tr>)}</tbody></table>}
      <p className="fl-use-case"><strong>어디에 쓰나요?</strong>{scenario.use}</p>
      {grouped && <p className="fl-small-note">표에서는 구간별 개수가 보이지만, 각 학생의 정확한 값은 알 수 없어요. 목적에 따라 원자료도 함께 보관해요.</p>}
    </>}
    {step === 1 && <div className="fl-boundary-demo"><h3 className="fl-activity-title">슬라이더로 경계값 확인해보기</h3><div className="fl-boundary-number">{boundary}<small>분</small></div><label>통학 시간<input aria-label="통학 시간 슬라이더" type="range" min="19" max="31" value={boundary} onChange={event => setBoundary(Number(event.target.value))} /></label><div className="fl-slider-ticks"><span>19</span><span>31</span></div><div className="fl-range-result" aria-live="polite"><strong>{boundary < 20 ? '10 이상 20 미만' : boundary < 30 ? '20 이상 30 미만' : '30 이상 40 미만'}</strong><p>{boundary === 20 ? '20은 “20 이상”에 포함돼요.' : boundary === 30 ? '30은 “30 미만”에 포함되지 않아요. 다음 계급으로 가요.' : '이 숫자가 어느 구간에 속하는지 확인해보세요.'}</p></div><p className="fl-small-note">30분으로 움직여 경계값을 확인하세요.</p></div>}
    {step === 2 && <><h3 className="fl-activity-title">자료를 눌러 도수 세어보기</h3><div className="fl-count-demo">도수 <strong aria-live="polite">{counted.length}</strong><span>명</span></div><div className="fl-data fl-click-data">{data.map((value,index) => <button key={index} aria-label={`자료 ${index + 1}: ${value}분`} aria-pressed={counted.includes(index)} className={counted.includes(index) ? 'selected' : ''} onClick={() => count(index)}>{value}<small>{counted.includes(index) ? '✓' : '분'}</small></button>)}</div><p className="fl-small-note">23분이 두 번 나와도 학생이 두 명이므로 각각 세어요. 선택한 자료를 다시 누르면 해제돼요.</p></>}
    {step === 3 && <><h3 className="fl-activity-title">카드를 구간에 분류해보기</h3><p className="fl-small-note">카드와 구간을 차례로 누르거나, 끌어서 넣으세요.</p><div className="fl-data fl-click-data">{data.map((value,index) => <button draggable={placed[index] === undefined} onDragStart={event => { event.dataTransfer.setData('text/plain', String(index)); event.dataTransfer.effectAllowed = 'move'; }} disabled={placed[index] !== undefined} key={index} aria-label={`분류할 자료 ${index + 1}: ${value}분`} aria-pressed={card === index} className={card === index ? 'selected' : ''} onClick={() => setCard(index)}>{value}<small>{placed[index] !== undefined ? '✓' : '분'}</small></button>)}</div><div className="fl-sort-bins">{RANGES.map((range,index) => <button key={range} className={card !== null ? 'can-place' : ''} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const raw = event.dataTransfer.getData('text/plain'); if (raw !== '') place(Number(raw), index); }} onClick={() => place(card,index)}><strong>{range}</strong><span>{data.filter((_,item) => placed[item] === index).join(', ') || '자료 넣기'}</span><small>도수 <b>{Object.values(placed).filter(value => value === index).length}</b> 명</small></button>)}</div><p className="fl-small-note">분류한 자료 {Object.keys(placed).length} / {data.length} · 모두 분류하면 도수의 합은 {data.length}이에요.</p></>}
    {step === 4 && <><h3 className="fl-activity-title">학생은 8명인데, 표의 도수 합은 맞나요?</h3><div className="fl-dataset"><div className="fl-data">{data.map((value,index) => <span key={index}>{value}</span>)}</div></div><table className="fl-live-table"><caption>잘못된 도수 고쳐보기</caption><thead><tr><th>통학 시간 (분)</th><th>도수 (명)</th></tr></thead><tbody>{RANGES.map((range,index) => <tr key={range}><td>{range}</td><td>{index === 1 ? <div className="fl-stepper"><button aria-label="도수 줄이기" disabled={fixedCount === 0} onClick={() => setFixedCount(value => value - 1)}>−</button><strong>{fixedCount}</strong><button aria-label="도수 늘리기" disabled={fixedCount === 8} onClick={() => setFixedCount(value => value + 1)}>+</button></div> : 2}</td></tr>)}</tbody></table><p className={`fl-total-check ${fixedCount === 4 ? 'is-balanced' : ''}`} aria-live="polite">도수의 합 {fixedCount + 4}명 {fixedCount === 4 ? '= 학생 8명 · 이 예시의 도수도 올바르게 고쳤어요!' : '≠ 학생 8명 · 중복되거나 빠진 자료를 확인해요.'}</p></>}
    {step === 5 && <><table className="fl-live-table"><caption>학생 8명의 통학 시간</caption><thead><tr><th>통학 시간 (분)</th><th>도수 (명)</th></tr></thead><tbody>{RANGES.map((range,index) => <tr key={range}><td>{range}</td><td>{frequencies(data)[index]}</td></tr>)}</tbody></table>{['30분 이상 통학하는 학생에게 설문을 보내려 해요. 몇 명에게 보내면 될까요?', '20분 이상 통학하는 학생 전체에게 설문을 보내려 해요. 몇 명일까요?'].map((question,index) => <fieldset className="fl-application" key={question}><legend>{question}</legend><div>{[2,4,6].map(value => <button key={value} disabled={applied.includes(index)} className={applied.includes(index) && value === (index === 0 ? 2 : 6) ? 'selected' : ''} onClick={() => { if (value === (index === 0 ? 2 : 6)) { setApplied(previous => [...new Set([...previous,index])]); setMessage(index === 0 ? '맞아요. 30 이상 40 미만의 도수는 2예요. 모든 자료가 이 표의 구간 안에 있어요.' : '맞아요. 20분 이상인 두 계급의 도수 4 + 2 = 6명이에요.'); } else setMessage(index === 0 ? '30분 이상인 계급의 도수를 읽어보세요.' : '20분 이상이면 두 계급이 포함돼요. 두 도수를 합해보세요.'); }}>{value}명</button>)}</div></fieldset>)}</>}
    <p className="fl-explore-message" role="status">{message}</p>
    <footer className="fl-actions"><button className="fl-primary" disabled={!ready} onClick={onPractice}>혼자 풀어보기 →</button></footer>
  </div>;
}
