import { useEffect, useRef, useState } from 'react';
import './GoalLearningPreviewPage.css';

type Topic = 'table' | 'graph';
type Screen = 'intro' | 'goal' | 'lesson' | 'complete' | 'ended';
type Question = 'original' | 'transfer';
const topicNames: Record<Topic, string> = { table: '구간의 도수 읽기', graph: '막대의 높이 읽기' };
const questions = {
  original: { frequencies: [2, 5, 8, 5], pairs: [[8, 8], [8, 13], [20, 13], [5, 10]] },
  transfer: { frequencies: [4, 6, 7, 3], pairs: [[7, 7], [7, 10], [20, 10], [3, 10]] },
};

function Histogram({ values, hidden = -1, highlight = -1 }: { values: number[]; hidden?: number; highlight?: number }) {
  const chartId = `histogram-${values.join('-')}-${hidden}-${highlight}`;
  const maximum = hidden >= 0 ? 10 : Math.max(6, Math.ceil((Math.max(...values) + 1) / 2) * 2);
  const unit = 140 / maximum;
  return <svg className="gl-chart" viewBox="0 0 330 235" role="img" aria-labelledby={chartId}>
    <title id={chartId}>독서 시간 히스토그램. {values.map((v, i) => `${i * 10} 이상 ${(i + 1) * 10} 미만: ${i === hidden ? '가려진 도수' : `${v}명`}`).join(', ')}</title>
    {Array.from({ length: maximum / 2 + 1 }, (_, i) => i * 2).map(tick => <g key={tick}>
      <line x1="42" x2="310" y1={184 - tick * unit} y2={184 - tick * unit} stroke="#e5e7eb" strokeDasharray={tick === 0 ? undefined : '3 5'} />
      <text x="29" y={188 - tick * unit} textAnchor="end">{tick}</text>
    </g>)}
    <text x="13" y="22">도수(명)</text>
    {values.map((value, i) => <g key={i}>
      {i === hidden ? <>
        <rect x={43 + i * 64} y="39" width="63" height="145" rx="3" fill="#eff6ff" stroke="#93c5fd" strokeDasharray="4 4" />
        <text className="gl-chart__unknown" x={74 + i * 64} y="121" textAnchor="middle">?</text>
      </> : <rect x={43 + i * 64} y={184 - value * unit} width="63" height={value * unit} fill={highlight < 0 || highlight === i ? '#3b82f6' : '#bfdbfe'} stroke="#ffffff" strokeWidth="1" />}
      <text x={43 + i * 64} y="203" textAnchor="middle">{i * 10}</text>
    </g>)}
    <text x={43 + values.length * 64} y="203" textAnchor="middle">{values.length * 10}</text>
    <text x="305" y="226" textAnchor="end">독서 시간(분)</text>
  </svg>;
}

function FrequencyTable({ values }: { values: number[] }) {
  return <table className="gl-table">
    <caption>20명의 하루 독서 시간</caption>
    <thead><tr><th scope="col">독서 시간(분)</th><th scope="col">도수(명)</th></tr></thead>
    <tbody>{values.map((value, i) => <tr key={i}><th scope="row">{i * 10} 이상 {(i + 1) * 10} 미만</th><td>{value}</td></tr>)}</tbody>
    <tfoot><tr><th scope="row">합계</th><td>{values.reduce((sum, value) => sum + value, 0)}</td></tr></tfoot>
  </table>;
}

function GoalData({ question }: { question: Question }) {
  return <div className="gl-data"><FrequencyTable values={questions[question].frequencies} /><Histogram values={questions[question].frequencies} hidden={2} /></div>;
}

function ConnectionMap({ practiced, solved, selectedTopic, onInspect }: { practiced: Topic[]; solved: boolean; selectedTopic?: Topic; onInspect: (topic: Topic) => void }) {
  return <div className="gl-map" aria-label="목표 문제와 연결된 연습 문제">
    <svg viewBox="0 0 320 225" preserveAspectRatio="none" aria-hidden="true">
      <path d="M 160 65 C 160 120, 79 90, 79 157" className={practiced.includes('table') ? 'is-done' : ''} />
      <path d="M 160 65 C 160 120, 241 90, 241 157" className={practiced.includes('graph') ? 'is-done' : ''} />
    </svg>
    <div className={`gl-map__goal${solved ? ' is-done' : ''}`}><span>{solved ? '✓ 해결한 목표 문제' : '오늘의 목표 문제'}</span><strong>표와 그래프 연결하기</strong></div>
    {(['table', 'graph'] as Topic[]).map(topic => <button type="button" key={topic} onClick={() => onInspect(topic)} aria-pressed={selectedTopic === topic} className={`gl-map__branch gl-map__branch--${topic}${practiced.includes(topic) ? ' is-done' : ''}`}>
      <span>{practiced.includes(topic) ? '✓ 연습 완료' : '연결된 연습'}</span><strong>{topicNames[topic]}</strong>
    </button>)}
  </div>;
}

export default function GoalLearningPreviewPage() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [question, setQuestion] = useState<Question>('original');
  const [answer, setAnswer] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);
  const [pending, setPending] = useState<Topic[]>([]);
  const [practiced, setPracticed] = useState<Topic[]>([]);
  const [phase, setPhase] = useState<'example' | 'practice'>('example');
  const [picked, setPicked] = useState<number[]>([]);
  const [lessonAnswer, setLessonAnswer] = useState<number | null>(null);
  const [lessonResult, setLessonResult] = useState<'correct' | 'wrong' | null>(null);
  const [attempts, setAttempts] = useState({ original: 0, transfer: 0 });
  const [hints, setHints] = useState({ original: false, transfer: false });
  const [supported, setSupported] = useState({ original: false, transfer: false });
  const [solved, setSolved] = useState({ original: false, transfer: false });
  const [inspectedTopic, setInspectedTopic] = useState<Topic | undefined>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const topic = pending[0] ?? 'table';
  const data = questions[question];
  const lessonComplete = lessonResult === 'correct';
  const remedialTopics: Topic[] = answer === 0 ? ['graph'] : answer === 2 ? ['table'] : ['table', 'graph'];

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [screen, phase, topic, question]);

  function resetLesson() {
    setPicked([]); setLessonAnswer(null); setLessonResult(null);
  }

  function startSupport(topics: Topic[]) {
    setSupported(current => ({ ...current, [question]: true }));
    setPending(topics); setPhase('example'); resetLesson(); setWrong(false); setAnswer(null); setScreen('lesson');
  }

  function startGoal() {
    setAnswer(null); setWrong(false); setScreen('goal');
  }

  function checkGoal() {
    if (answer == null || wrong) return;
    setAttempts(current => ({ ...current, [question]: current[question] + 1 }));
    if (answer === 1) {
      setSolved(current => ({ ...current, [question]: true }));
      setScreen('complete');
    } else setWrong(true);
  }

  function checkLesson() {
    let correct: boolean;
    if (topic === 'table' && phase === 'example') correct = picked.length === 2 && picked.includes(20) && picked.includes(24);
    else correct = lessonAnswer === (topic === 'table' ? 3 : phase === 'example' ? 4 : 6);
    setLessonResult(correct ? 'correct' : 'wrong');
    if (correct && phase === 'practice') setPracticed(current => current.includes(topic) ? current : [...current, topic]);
  }

  function advanceLesson() {
    if (!lessonComplete) return;
    if (phase === 'example') { setPhase('practice'); resetLesson(); return; }
    if (pending.length > 1) { setPending(current => current.slice(1)); setPhase('example'); resetLesson(); }
    else { setPending([]); startGoal(); }
  }

  function restart() {
    setScreen('intro'); setQuestion('original'); setAnswer(null); setWrong(false); setPending([]); setPracticed([]);
    setPhase('example'); resetLesson(); setAttempts({ original: 0, transfer: 0 }); setHints({ original: false, transfer: false });
    setSupported({ original: false, transfer: false });
    setSolved({ original: false, transfer: false }); setInspectedTopic(undefined);
  }

  const lessonHint = topic === 'table'
    ? phase === 'example'
      ? '20 이상에는 20이 들어가요. 30 미만에는 30이 들어가지 않아요. 20과 30 사이를 다시 살펴봐요.'
      : '10은 포함하고, 20은 빼야 해요. 10, 14, 19를 하나씩 세어 보세요.'
    : phase === 'example'
      ? '10과 20 사이의 진한 막대를 찾아요. 그 막대의 꼭대기가 세로축의 어디에 닿는지 보세요.'
      : '20분 이상에는 20~30분 구간과 30~40분 구간이 들어가요. 두 막대의 도수 4와 2를 더해 보세요.';

  const isFinish = screen === 'complete' || screen === 'ended';
  const resultTitle = solved.transfer
    ? hints.transfer || supported.transfer || attempts.transfer > 1 ? '새로운 문제도 해결했어요.' : '새로운 자료도 스스로 읽었어요.'
    : supported.original ? '함께 살펴본 내용을 문제에 연결했어요.'
      : hints.original ? '힌트를 활용해 해결했어요.'
        : attempts.original > 1 ? '다시 생각해서 해결했어요.' : '목표 문제를 바로 해결했어요.';

  return <main className="gl-page">
    <header className="gl-header">
      <a href="/dev/q-map" className="gl-back">← Q-Map</a>
      <span className="gl-brand">수확행</span>
      <span className="gl-preview-label">학습 체험</span>
      <button type="button" onClick={restart} className="gl-reset">처음부터 체험</button>
    </header>
    <div className="gl-shell">
      <div className="gl-breadcrumb"><a href="/dev/q-map">문제 지도</a><span aria-hidden="true">/</span><strong>{screen === 'lesson' ? '필요한 부분 연습하기' : isFinish ? '학습 결과' : '목표 문제'}</strong></div>
      <div className={`gl-layout${isFinish ? ' gl-layout--finished' : ''}`}>
        <section className="gl-main" aria-label="학습 활동">
          {screen === 'intro' && <>
            <div className="gl-eyebrow">오늘의 목표 <span>도수분포표 · 히스토그램</span></div>
            <h1 ref={headingRef} tabIndex={-1}>표와 그래프 연결하기</h1>
            <p className="gl-lead">표와 그래프는 같은 학생 20명의 독서 시간을 나타내요.</p>
            <div className="gl-problem-paper">
              <p className="gl-question"><strong>가려진 막대의 도수</strong>와 <strong>20분 이상 책을 읽은 학생 수</strong>를 구해보세요.</p>
              <GoalData question="original" />
            </div>
            <div className="gl-actions gl-actions--intro"><button className="gl-primary" onClick={startGoal}>먼저 풀어볼게요 <span>↗</span></button><button className="gl-secondary" onClick={() => startSupport(['table', 'graph'])}>차근차근 같이 할래요</button></div>
            <p className="gl-footnote">이미 알고 있다면 바로 풀고 마칠 수 있어요.</p>
          </>}

          {screen === 'goal' && <>
            <div className="gl-eyebrow">{question === 'transfer' ? '새로운 자료로 확인' : practiced.length ? '처음의 목표 문제로 돌아왔어요' : '오늘의 목표 문제'}</div>
            <h1 ref={headingRef} tabIndex={-1}>{question === 'transfer' ? '자료가 달라도 할 수 있을까?' : practiced.length ? '이제 직접 연결해 볼까?' : '직접 풀어볼까?'}</h1>
            <p className="gl-lead">표와 그래프는 같은 학생 20명의 독서 시간을 나타내요.</p>
            <div className="gl-problem-paper">
              <fieldset className="gl-answers"><legend><strong>가려진 막대의 도수</strong>와 <strong>20분 이상 책을 읽은 학생 수</strong>를 차례대로 고르세요.</legend>
                <GoalData question={question} />
                <div className="gl-answer-grid">{data.pairs.map(([bar, total], index) => <label key={index} className={answer === index ? 'is-selected' : ''}>
                  <input type="radio" name="goal-answer" value={index} checked={answer === index} onChange={() => { setAnswer(index); setWrong(false); }} />
                  <span className="gl-option-letter">{index + 1}</span><span>{bar}명, {total}명</span>
                </label>)}</div>
              </fieldset>
            </div>
            {hints[question] && <div className="gl-note" role="status"><strong>이렇게 나누어 생각해 봐요.</strong><p>가려진 구간은 20 이상 30 미만이에요. 표에서 그 구간의 도수를 찾고, 20분 이상인 학생 수에는 30 이상 40 미만의 학생도 더해요.</p></div>}
            {wrong && <div className="gl-feedback gl-feedback--try" role="status"><strong>한 부분만 다시 살펴보자.</strong><p>{answer === 0 ? '20분 이상에는 30분 이상 읽은 학생도 들어가요. 두 구간을 함께 세어 볼까요?' : answer === 2 ? '가로축의 20은 시간이에요. 막대의 높이는 그 구간에 들어간 학생 수를 나타내요.' : '가려진 막대가 어느 시간 구간에 있는지 먼저 확인해 봐요.'}</p>
              <button className="gl-primary" onClick={() => startSupport(remedialTopics)}>{remedialTopics.length === 1 ? `${topicNames[remedialTopics[0]]} 연습하기` : '필요한 부분 같이 연습하기'} →</button>
              <button className="gl-text-button" onClick={() => { setWrong(false); setAnswer(null); }}>내가 다시 골라볼게요</button>
            </div>}
            <div className="gl-actions"><button className="gl-primary" disabled={answer == null || wrong} onClick={checkGoal}>답 확인하기 →</button><button className="gl-secondary" onClick={() => startSupport(['table', 'graph'])}>모르겠어요 · 같이 해보기</button></div>
            {!hints[question] && <button className="gl-text-button" onClick={() => setHints(current => ({ ...current, [question]: true }))}>작은 힌트 보기</button>}
          </>}

          {screen === 'lesson' && <>
            <div className="gl-eyebrow">{phase === 'example' ? '함께 해보기' : '이제 혼자 해보기'} <span>· {topicNames[topic]}</span></div>
            <h1 ref={headingRef} tabIndex={-1}>{topic === 'table' ? phase === 'example' ? '어떤 숫자가 들어갈까?' : '이번 구간은 직접 세어볼까?' : phase === 'example' ? '막대의 높이가 학생 수야.' : '다른 막대도 읽어볼까?'}</h1>
            <p className="gl-lead">{topic === 'table' ? '구간에 들어가는 자료의 개수가 바로 ‘도수’예요.' : '가로축에서 구간을 찾고, 세로축에서 높이를 읽어요.'}</p>
            <div className="gl-why"><span aria-hidden="true">↳</span> {topic === 'table' ? '목표 문제에서 가려진 막대의 도수를 찾을 때 써요.' : '목표 문제에서 20분 이상인 두 구간을 읽을 때 써요.'}</div>
            <div className="gl-problem-paper gl-lesson-paper">
              {topic === 'table' && phase === 'example' ? <>
                <div className="gl-interval"><span>20 <small>이상</small></span><i aria-hidden="true">─────</i><span>30 <small>미만</small></span></div>
                <p className="gl-centered-copy">20은 포함하고, 30은 포함하지 않아요.</p>
                <h2>이 구간에 들어가는 숫자를 모두 눌러보세요.</h2>
                <div className="gl-number-tiles">{[12, 20, 24, 30].map(value => <button key={value} type="button" aria-pressed={picked.includes(value)} disabled={lessonComplete} className={picked.includes(value) ? 'is-selected' : ''} onClick={() => { setPicked(current => current.includes(value) ? current.filter(n => n !== value) : [...current, value]); setLessonResult(null); }}>{value}</button>)}</div>
                <p className="gl-centered-copy">선택한 자료 <strong>{picked.length}개</strong></p>
              </> : <>
                {topic === 'table' ? <><div className="gl-raw-data" aria-label="자료">9, 10, 14, 19, 20, 27</div><h2>10 이상 20 미만인 구간의 도수는 얼마일까요?</h2></> : <>
                  <Histogram values={phase === 'example' ? [2, 4, 3] : [3, 6, 4, 2]} highlight={phase === 'example' ? 1 : -1} />
                  <h2>{phase === 'example' ? '10 이상 20 미만인 학생은 몇 명일까요?' : '20분 이상 책을 읽은 학생은 몇 명일까요?'}</h2>
                </>}
                <fieldset className="gl-mini-answers"><legend className="gl-sr-only">정답 선택</legend>{(topic === 'table' ? [2, 3, 4] : phase === 'example' ? [3, 4, 20] : [4, 6, 20]).map(value => <label key={value} className={lessonAnswer === value ? 'is-selected' : ''}>
                  <input type="radio" name="lesson-answer" value={value} checked={lessonAnswer === value} disabled={lessonComplete} onChange={() => { setLessonAnswer(value); setLessonResult(null); }} />{value}{topic === 'graph' ? '명' : '개'}
                </label>)}</fieldset>
              </>}
            </div>
            {lessonResult && <div role="status" className={`gl-feedback ${lessonComplete ? 'gl-feedback--success' : 'gl-feedback--try'}`}><strong>{lessonComplete ? '맞았어요. 이렇게 읽으면 돼요!' : '조건을 하나씩 확인해 보자.'}</strong><p>{lessonComplete ? topic === 'table' ? phase === 'example' ? '20과 24가 들어가니까, 이 구간의 도수는 2예요.' : '10, 14, 19가 들어가므로 도수는 3이에요.' : phase === 'example' ? '해당 구간의 막대 높이는 4예요. 학생이 4명이라는 뜻이에요.' : '20분 이상인 두 구간의 도수 4와 2를 더하면 6명이에요.' : lessonHint}</p></div>}
            <div className="gl-actions">{lessonComplete ? <button className="gl-primary" onClick={advanceLesson}>{phase === 'example' ? '비슷한 문제 혼자 해보기' : pending.length > 1 ? '그래프도 같이 읽어보기' : '목표 문제로 돌아가기'} →</button> : <button className="gl-primary" disabled={topic === 'table' && phase === 'example' ? picked.length === 0 : lessonAnswer == null} onClick={checkLesson}>확인하기 →</button>}
              <button className="gl-text-button" onClick={startGoal}>목표 문제 먼저 풀어볼래요</button></div>
            {phase === 'practice' && !lessonComplete && <button className="gl-text-button" onClick={() => { setPhase('example'); resetLesson(); }}>함께 푼 예시 다시 보기</button>}
          </>}

          {isFinish && <>
            <div className="gl-result-mark" aria-hidden="true">✓</div>
            <div className="gl-eyebrow">{screen === 'ended' ? '오늘의 학습을 마쳤어요' : '오늘의 수확'}</div>
            <h1 ref={headingRef} tabIndex={-1}>{resultTitle}</h1>
            <p className="gl-lead">{solved.transfer ? '표에서 찾은 도수를 그래프에 연결하고, 두 구간의 학생 수도 구했어요.' : '가려진 막대는 8명, 20분 이상 읽은 학생은 8 + 5 = 13명이에요.'}</p>
            <div className="gl-result-map"><ConnectionMap practiced={practiced} solved={solved.original} selectedTopic={inspectedTopic} onInspect={setInspectedTopic} /></div>
            <div className="gl-result-evidence"><span>{practiced.length > 0 ? `연결된 연습 ${practiced.length}개 완료` : supported[question] ? '예시를 함께 살펴봄' : '목표 문제 직접 도전'}</span><span>{question === 'transfer' ? '새 문제 · ' : ''}{hints[question] ? '힌트 활용 후 해결' : supported[question] ? '연습 후 해결' : attempts[question] > 1 ? '피드백 후 다시 해결' : '첫 시도에 해결'}</span>{solved.transfer && <span>새 자료에서도 해결</span>}</div>
            {inspectedTopic && <div className="gl-note"><strong>{topicNames[inspectedTopic]}</strong><p>{inspectedTopic === 'table' ? '20 이상 30 미만 구간의 도수 8을 읽어 가려진 막대와 연결했어요.' : '20분 이상인 두 구간의 도수 8과 5를 합쳐 13명을 구했어요.'}</p></div>}
            <p className="gl-reflection">오늘 해결한 문제를 남겨뒀어요. 다음 학습에서 비슷한 문제로 다시 확인해 봐요.</p>
            {screen === 'complete' ? <div className="gl-actions"><button className="gl-primary" onClick={() => setScreen('ended')}>오늘은 여기까지 ✓</button>{!solved.transfer && <button className="gl-secondary" onClick={() => { setQuestion('transfer'); startGoal(); }}>새 문제로 한 번 더 해보기</button>}</div> : <div className="gl-end-card"><strong>수고했어요. 오늘은 여기까지!</strong><span>아까 해결한 문제와 연결된 연습을 다시 살펴볼 수 있어요.</span><button className="gl-text-button" onClick={restart}>다른 경로로 다시 체험하기 →</button></div>}
          </>}
        </section>

        {!isFinish && <aside className="gl-aside">
          <div className="gl-guide-title"><span className="gl-guide-dot" /> 이 문제의 연결 지도</div>
          <p className="gl-guide-copy">필요한 부분을 연습하고<br />목표 문제로 돌아와요.</p>
          <ConnectionMap practiced={practiced} solved={solved.original} selectedTopic={inspectedTopic} onInspect={setInspectedTopic} />
          {inspectedTopic ? <div className="gl-map-explanation"><strong>{topicNames[inspectedTopic]}</strong><p>{inspectedTopic === 'table' ? '도수는 한 구간에 들어가는 자료의 개수예요. 목표 문제에서는 표에서 그 개수를 찾아요.' : '막대의 높이는 그 구간의 도수예요. 여러 구간의 학생 수는 각 막대의 도수를 더해 구해요.'}</p></div> : <p className="gl-map-help">연결된 연습을 누르면<br />목표 문제에 필요한 개념을 볼 수 있어요.</p>}
          <div className="gl-route-status"><span>{isFinish ? '✓ 목표 문제 해결' : screen === 'lesson' ? `지금 · ${topicNames[topic]}` : '지금 · 목표 문제 살펴보기'}</span><p>{screen === 'lesson' ? '필요한 연습을 마치면 목표 문제로 돌아와요.' : isFinish ? '한 번의 정답은 오늘의 해결 기록으로 남겨요.' : '바로 풀거나, 필요한 부분부터 같이 시작해요.'}</p></div>
        </aside>}
      </div>
      <footer className="gl-footer">로컬 프로토타입 · 체험 기록은 이 화면에서만 유지됩니다. <a href="/dev/q-map">문제 지도 시안 보기 ↗</a></footer>
    </div>
  </main>;
}
