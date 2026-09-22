import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SortableDataCards from './SortableDataCards';
import { frequencies, RANGES } from './frequencyCourse';
import { checkStoryReport, OTHER_CLASS_DATA, placeStoryCard, STORY_DATA, STORY_NAMES, STORY_STORAGE_KEY } from './frequencyStory';
import './FrequencyStoryPage.css';

const CHAPTERS = ['예상해보기', '분류해보기', '용어 확인해보기', '표 해석해보기', '표 만들어보기'];
const TITLES = ['통학 시간 예상해보기', '카드를 구간에 분류해보기', '계급과 도수 확인해보기', '표를 읽고 답해보기', '새 자료로 표 만들어보기'];

function readCompletion() {
  try { return localStorage.getItem(STORY_STORAGE_KEY) === 'true'; } catch { return false; }
}

function StoryExperience({ onComplete }: { onComplete?: () => void }) {
  const [chapter, setChapter] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [card, setCard] = useState<number | null>(null);
  const [placed, setPlaced] = useState<Record<number, number>>({});
  const [term, setTerm] = useState<'range' | 'count'>('range');
  const [seenTerms, setSeenTerms] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [reportReady, setReportReady] = useState(false);
  const [finished, setFinished] = useState(false);
  const [everCompleted, setEverCompleted] = useState(readCompletion);
  const [resetConfirm, setResetConfirm] = useState(false);
  const counts = frequencies(STORY_DATA);
  const data = chapter === 4 ? OTHER_CLASS_DATA : STORY_DATA;
  const bins = [0,1,2].map(range => Object.entries(placed).filter(([,value]) => value === range).map(([index]) => Number(index)));

  useEffect(() => {
    try { localStorage.setItem(STORY_STORAGE_KEY, String(everCompleted)); } catch { /* Local-only experience also works without storage. */ }
  }, [everCompleted]);

  function next() {
    setChapter(value => value + 1); setAnswers([]); setMessage(''); setReportReady(false);
  }

  function place(index: number | null, range: number) {
    if (index === null) { setMessage('먼저 시간 카드를 선택하세요.'); return; }
    const updated = placeStoryCard(placed,index,range);
    if (updated === placed) { setMessage(`${STORY_DATA[index]}분은 ${RANGES[range]}에 포함되지 않아요. ‘이상’은 포함, ‘미만’은 제외예요.`); return; }
    setPlaced(updated); setCard(null); setMessage(`${STORY_NAMES[index]}의 ${STORY_DATA[index]}분을 분류했어요. 도수가 1 늘었어요.`);
  }

  function answer(index: number, value: string) {
    setAnswers(previous => { const updated = [...previous]; updated[index] = value; return updated; }); setMessage('');
  }

  function check() {
    if (!checkStoryReport(data,answers,chapter === 4)) { setMessage(chapter === 4 ? '구간별 도수와 답을 확인하세요. 경계값은 한 구간에만 넣으세요.' : '30분 이상인 인원과 가장 많은 구간을 확인하세요.'); return; }
    if (chapter === 4) { setFinished(true); setEverCompleted(true); }
    else { setReportReady(true); setMessage('정답이에요.'); }
  }

  function numberInput(index: number, label: string) {
    return <input type="number" inputMode="numeric" min="0" step="1" aria-label={label} placeholder="?" value={answers[index] ?? ''} disabled={reportReady || finished} onChange={event => answer(index,event.target.value)} />;
  }

  function table(editable = false) {
    return <table className={`fs-table ${chapter === 2 ? `show-${term}` : ''}`}><caption>{editable ? '옆 반 통학 시간' : '우리 반 통학 시간'}</caption><thead><tr><th>통학 시간 (분)</th><th>도수 (명)</th></tr></thead><tbody>{RANGES.map((range,index) => <tr key={range}><td>{range}</td><td>{editable ? numberInput(index,`${range}의 도수`) : counts[index]}</td></tr>)}</tbody></table>;
  }

  const ready = chapter === 0 ? guess !== null : chapter === 1 ? Object.keys(placed).length === STORY_DATA.length : chapter === 2 ? seenTerms.length === 2 : reportReady;

  return <div className="fs-shell">
    <nav className="fs-nav"><strong>수확행</strong><Link to="/dev/knowledge-graph">개념 지도</Link><span>{onComplete ? '도수분포표 상황 적용' : '이야기형 체험'}</span></nav>
    <main className="fs-main">
      <header className="fs-header"><div><span>자료의 정리</span><h1>도수분포표 학습해보기</h1></div><span className="fs-reward">{everCompleted ? '✦ 100 XP' : '완료 보상 ✦ 100 XP'}</span></header>
      <ol className="fs-chapters" aria-label="이야기 진행">{CHAPTERS.map((title,index) => <li className={index === chapter ? 'active' : index < chapter || finished ? 'done' : ''} aria-current={index === chapter ? 'step' : undefined} key={title}><span>{index < chapter || finished ? '✓' : index + 1}</span>{title}</li>)}</ol>
      {finished ? <section className="fs-scene fs-finish"><span className="fs-finish-star">✦</span><p className="fs-eyebrow">체험 완료 · 최초 완료 보상 100 XP</p><h2>도수분포표 학습 완료</h2><div className="fs-poster"><h3>우리 반 통학 시간</h3>{RANGES.map((range,index) => <div className="fs-poster-row" key={range}><span>{range}</span><i style={{ width: `${counts[index] / STORY_DATA.length * 100}%` }} /><strong>{counts[index]}명</strong></div>)}<p>가장 많은 구간: 20 이상 30 미만<br />30분 이상 걸리는 친구: 2명</p></div><div className="fs-concept-earned"><span>✓</span><div><strong>도수분포표 · 이번 체험 완료</strong><small>{onComplete ? '이제 실제 문제로 확인해요.' : '운영 숙련도에는 반영되지 않아요.'}</small></div></div>{onComplete && <button className="fs-primary" onClick={onComplete}>REAL 문제 풀기 →</button>}<button className={onComplete ? 'fs-secondary' : 'fs-primary'} onClick={() => { setChapter(0); setGuess(null); setPlaced({}); setCard(null); setSeenTerms([]); setTerm('range'); setAnswers([]); setFinished(false); setMessage(''); setReportReady(false); }}>처음부터 다시 해보기</button></section>
      : <section className="fs-scene"><p className="fs-eyebrow">{`STEP ${chapter + 1}`}</p><h2>{TITLES[chapter]}</h2>
        {chapter === 0 && <><p className="fs-dialogue">학생 8명의 통학 시간을 살펴보세요.</p><div className="fs-cards scattered">{STORY_DATA.map((value,index) => <div key={index}><span>{STORY_NAMES[index]}</span><strong>{value}<small>분</small></strong></div>)}</div><p className="fs-prompt">가장 많아 보이는 시간대를 선택하세요.</p><div className="fs-choices">{RANGES.map((range,index) => <button aria-pressed={guess === index} key={range} onClick={() => setGuess(index)}>{range}</button>)}</div></>}
        {chapter === 1 && <><p className="fs-dialogue">카드와 구간을 차례로 누르거나 끌어서 넣으세요.<br />20은 두 번째 구간에, 30은 세 번째 구간에 포함돼요.</p><button className="fs-demo" disabled={placed[1] !== undefined} onClick={() => place(1,0)}>12분 카드 예시 보기</button><div className="fs-cards movable">{STORY_DATA.map((value,index) => <button key={index} draggable={placed[index] === undefined} aria-label={`${STORY_NAMES[index]} ${value}분`} disabled={placed[index] !== undefined} aria-pressed={card === index} onDragStart={event => event.dataTransfer.setData('text/plain',String(index))} onClick={() => setCard(index)}><span>{STORY_NAMES[index]}</span><strong>{value}<small>{placed[index] !== undefined ? '✓' : '분'}</small></strong></button>)}</div><div className="fs-bins">{RANGES.map((range,index) => <button key={range} onClick={() => place(card,index)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const raw = event.dataTransfer.getData('text/plain'); const value = Number(raw); if (raw !== '' && Number.isInteger(value) && value >= 0 && value < STORY_DATA.length) place(value,index); }}><strong>{range}</strong><span className="fs-bin-cards">{bins[index].length === 0 ? '여기에 넣기' : bins[index].map(id => <i key={id}>{STORY_DATA[id]}분</i>)}</span><b>{bins[index].length}<small>명</small></b></button>)}</div><p className="fs-inline-note">분류 {Object.keys(placed).length} / 8 · 23분 카드도 각각 세세요.</p></>}
        {chapter === 2 && <><p className="fs-dialogue">계급과 도수를 각각 눌러 확인하세요.</p>{table()}<div className="fs-choices fs-term-choices"><button aria-pressed={term === 'range'} onClick={() => { setTerm('range'); setSeenTerms(previous => [...new Set([...previous,'range'])]); }}>계급</button><button aria-pressed={term === 'count'} onClick={() => { setTerm('count'); setSeenTerms(previous => [...new Set([...previous,'count'])]); }}>도수</button></div><div className="fs-definition" aria-live="polite"><strong>{term === 'range' ? '계급 = 자료를 나눈 구간' : '도수 = 그 계급에 들어가는 자료의 개수'}</strong><p>{term === 'range' ? '‘20 이상 30 미만’이 하나의 계급이에요.' : '이 계급에 4명이 속하므로 도수는 4예요.'}</p></div><p className="fs-inline-note">도수분포표는 구간별 인원을 나타내요. 개별 학생의 정확한 시간은 알 수 없어요.</p></>}
        {(chapter === 3 || chapter === 4) && <><p className="fs-dialogue">{chapter === 3 ? '30분 이상 통학하는 학생에게 설문을 보내려고 해요. 표를 읽고 답하세요.' : '새 자료의 도수를 세어 표를 완성하고, 두 질문에 답하세요.'}</p>{chapter === 4 && <SortableDataCards data={data} />}{table(chapter === 4)}<form onSubmit={event => { event.preventDefault(); check(); }}><div className="fs-report-questions"><label>설문 대상 인원<small>30분 이상 걸리는 친구</small><span>{numberInput(chapter === 4 ? 3 : 0,'30분 이상인 친구 수')} 명</span></label><label>가장 많은 시간대<select aria-label="가장 많은 시간대" disabled={reportReady || finished} value={answers[chapter === 4 ? 4 : 1] ?? ''} onChange={event => answer(chapter === 4 ? 4 : 1,event.target.value)}><option value="">시간대 선택</option>{RANGES.map((range,index) => <option key={range} value={index}>{range}</option>)}</select></label></div>{!reportReady && <button className="fs-primary" type="submit">{chapter === 4 ? '표와 답 확인하기' : '답 확인하기'}</button>}</form>{reportReady && <div className="fs-report-preview"><span>✓ 정답 확인</span><p>가장 많은 시간대는 <strong>20 이상 30 미만</strong>.<br />30분 이상 걸리는 <strong>2명</strong>에게 설문을 보내면 돼요.</p></div>}</>}
        {chapter === 1 && ready && guess !== null && <div className="fs-definition"><strong>예상과 비교하기</strong><p>예상: {RANGES[guess]}<br />실제: 20 이상 30 미만 · 4명</p></div>}
        <p className="fs-message" role="status">{message}</p>
        {chapter < 4 && <footer className="fs-scene-footer"><button className="fs-primary" disabled={!ready} onClick={next}>{['카드 분류해보기 →','계급과 도수 확인해보기 →','표 해석해보기 →','새 자료로 표 만들어보기 →'][chapter]}</button></footer>}
      </section>}
      <footer className="fs-local"><span>{onComplete ? '가상 학습 자료 · 이어지는 REAL 문제 결과는 계정에 기록' : '버전 2 · 가상 예시 · 운영 DB 연결 없음'}</span>{resetConfirm ? <span>버전 2 보상을 초기화할까요? <button onClick={() => { setEverCompleted(false); setResetConfirm(false); }}>보상 초기화</button><button onClick={() => setResetConfirm(false)}>취소</button></span> : <button onClick={() => setResetConfirm(true)}>버전 2 보상 초기화</button>}</footer>
    </main>
  </div>;
}

export default function FrequencyStoryPage({ onComplete }: { onComplete?: () => void }) {
  return <StoryExperience onComplete={onComplete} />;
}
