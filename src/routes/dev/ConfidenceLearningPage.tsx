import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MathText from '../../components/MathText';
import { checkCalculation, checkTransfer, CI_STEPS, contains, histogram, interval, LEVELS, mean, MODEL, sample, seededRandom, simulateMeans, standardError } from './confidenceCourse';
import type { ConfidenceLevel } from './confidenceCourse';
import './ConfidenceLearningPage.css';

const TERMS = [
  { title: '모집단 확인해보기', question: '전교생의 평균 통학 시간을 알고 싶어요. 모집단은?', options: ['조사한 9명', '전교생', '9명의 평균'], correct: 1, help: '모집단은 알고 싶은 대상 전체예요. 그중 조사한 일부가 표본이에요.' },
  { title: '표본평균 확인해보기', question: '표본의 통학 시간이 30, 40, 50분이면 표본평균은?', options: ['30분', '40분', '50분'], correct: 1, help: '표본평균은 조사한 값의 합을 자료 수로 나눈 값이에요. (30 + 40 + 50) ÷ 3 = 40이에요.' },
  { title: '정규분포 확인해보기', question: '정규분포에서 값이 상대적으로 많이 모이는 곳은?', options: ['중심 부근', '양쪽 끝', '모든 위치가 같음'], correct: 0, help: '정규분포는 중심 부근이 높고 양쪽으로 갈수록 낮아지는 대칭적인 분포예요.' },
];

function MeanChart({ values, maximumCount }: { values: number[]; maximumCount?: number }) {
  const { counts, outside } = histogram(values);
  const maximum = Math.max(1, maximumCount ?? 0, ...counts);
  return <figure className="ci-chart"><svg viewBox="0 0 560 220" role="img" aria-label={`표본평균 ${values.length}개의 분포. 표시 범위 밖 ${outside}개.`}>
    <line x1="34" y1="180" x2="526" y2="180" stroke="#d1d5db" />
    {counts.map((count, index) => <rect key={index} x={36 + index * 30.5} y={180 - count / maximum * 140} width="27" height={count / maximum * 140} rx="3" fill="#3b82f6"><title>{32 + index} 이상 {33 + index} {index === 15 ? '이하' : '미만'}: {count}개</title></rect>)}
    {[32, 36, 40, 44, 48].map(value => <text key={value} x={36 + (value - 32) / 16 * 488} y="202" textAnchor="middle">{value}</text>)}
    <text x="38" y="20">빈도</text>
  </svg><figcaption>가로: 표본평균 (분) · 세로: 개수{outside > 0 && ` · 표시 범위 밖 ${outside}개`}</figcaption></figure>;
}

function IntervalPlot({ centers, n, level }: { centers: number[]; n: number; level: ConfidenceLevel }) {
  const rows = centers.map(center => interval(center, MODEL.sigma, n, level));
  const lower = Math.min(32, ...rows.map(row => row.lower)) - 1;
  const upper = Math.max(48, ...rows.map(row => row.upper)) + 1;
  const x = (value: number) => 40 + (value - lower) / (upper - lower) * 480;
  return <div className="ci-interval-scroll"><svg viewBox={`0 0 560 ${Math.max(130, rows.length * 15 + 50)}`} role="img" aria-label={`${rows.length}개의 신뢰구간. 파란 실선은 모평균 포함, 빨간 점선은 미포함.`}>
    <line x1={x(MODEL.mean)} x2={x(MODEL.mean)} y1="20" y2={rows.length * 15 + 35} stroke="#111827" strokeDasharray="4 4" />
    <text x={x(MODEL.mean)} y="14" textAnchor="middle">모평균 40분</text>
    {rows.map((row, index) => { const hit = contains(row.lower, row.upper); return <g key={index}>
      <line x1={x(row.lower)} x2={x(row.upper)} y1={35 + index * 15} y2={35 + index * 15} stroke={hit ? '#3b82f6' : '#ef4444'} strokeWidth="2.5" strokeDasharray={hit ? undefined : '4 3'} />
      <circle cx={x(row.center)} cy={35 + index * 15} r="3" fill={hit ? '#3b82f6' : '#ef4444'} />
    </g>; })}
  </svg></div>;
}

export default function ConfidenceLearningPage() {
  const [step, setStep] = useState(0);
  const [terms, setTerms] = useState<(number | null)[]>([null, null, null]);
  const [termChecked, setTermChecked] = useState(false);
  const [observations, setObservations] = useState<number[]>([]);
  const [drawnMeans, setDrawnMeans] = useState<number[]>([]);
  const [distribution, setDistribution] = useState<number[]>([]);
  const [size, setSize] = useState(10);
  const [visitedSizes, setVisitedSizes] = useState<number[]>([10]);
  const [prediction, setPrediction] = useState('');
  const [spreadMeaning, setSpreadMeaning] = useState('');
  const [width, setWidth] = useState(2);
  const [revealed, setRevealed] = useState(false);
  const [level, setLevel] = useState<ConfidenceLevel>(95);
  const [intervalCenters, setIntervalCenters] = useState<number[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [calculation, setCalculation] = useState<string[]>([]);
  const [calculationPassed, setCalculationPassed] = useState(false);
  const [transfer, setTransfer] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState('');
  const random = useRef<(() => number) | null>(null);
  if (random.current === null) random.current = seededRandom(20260918);
  const center = observations.length ? mean(observations) : 40;
  const comparisonMeans = simulateMeans(size, 240, seededRandom(317));
  const comparisonMaximum = Math.max(...[10, 30, 100].flatMap(n => histogram(simulateMeans(n, 240, seededRandom(317))).counts));
  const hits = intervalCenters.filter(value => { const row = interval(value, MODEL.sigma, 9, level); return contains(row.lower, row.upper); }).length;
  const termsPassed = TERMS.every((term, index) => terms[index] === term.correct);
  const comparedSizes = visitedSizes.includes(10) && visitedSizes.includes(100);
  const ready = [termChecked && termsPassed, observations.length > 0, drawnMeans.length >= 3, distribution.length >= 40, prediction === 'narrow' && comparedSizes && spreadMeaning === 'means', revealed, intervalCenters.length >= 100 && interpretation === 'repeat', calculationPassed, finished][step];

  function draw() {
    const values = sample(9, random.current!);
    setObservations(values); setDrawnMeans(previous => [...previous, mean(values)]); setRevealed(false);
  }

  function updateAnswer(index: number, value: string, independent: boolean) {
    const setter = independent ? setTransfer : setCalculation;
    setter(previous => { const updated = [...previous]; updated[index] = value; return updated; });
    if (!independent) setCalculationPassed(false);
    setMessage('');
  }

  function input(index: number, label: string, independent = false) {
    return <label className="ci-number-label">{label}<input type="number" step="0.01" inputMode="decimal" value={(independent ? transfer : calculation)[index] ?? ''} disabled={independent ? finished : calculationPassed} onChange={event => updateAnswer(index, event.target.value, independent)} /></label>;
  }

  return <div className="ci-shell">
    <nav className="ci-nav"><strong>수확행</strong><Link to="/dev/knowledge-graph">개념 지도</Link><span>로컬 체험</span></nav>
    <main className="ci-main">
      <header className="ci-heading"><div><p>통계적 추정 · Case 3</p><h1>신뢰구간</h1></div></header>
      <div className="ci-layout">
        <aside className="ci-roadmap"><strong>학습 순서</strong><ol>{CI_STEPS.map((title, index) => <li key={title} aria-current={index === step ? 'step' : undefined} className={index === step ? 'active' : index < step || finished ? 'done' : ''}><span>{index < step || finished ? '✓' : index + 1}</span>{title}</li>)}</ol></aside>
        <section className="ci-lesson">
          <span className="ci-eyebrow">STEP {step + 1}</span><h2>{finished ? '신뢰구간 체험 완료' : CI_STEPS[step]}</h2>
          {step === 1 && <p className="ci-instruction">알고 싶은 전교생 전체가 <strong>모집단</strong>, 조사할 일부 학생이 <strong>표본</strong>이에요. 모평균은 전교생의 평균, 표본평균은 뽑힌 학생들의 평균이에요. 이 체험의 임의추출은 각 학생이 뽑힐 기회가 같도록 무작위로 뽑는 거예요.</p>}
          {step === 3 && <p className="ci-note">평균 하나는 ‘9명을 한 번 뽑아 구한 평균’이에요. 분포는 이 평균들이 어느 값에 얼마나 모이는지 나타내요.</p>}
          {step === 5 && <p className="ci-note">모평균은 전교생의 실제 평균이에요. 표본평균은 뽑을 때마다 달라지므로, 한 값이 아니라 아래 끝값부터 위 끝값까지의 범위인 <strong>구간</strong>으로 추정해볼 거예요.</p>}
          {step === 6 && <p className="ci-note"><strong>신뢰수준</strong>은 같은 방법을 반복할 때 모평균을 포함하는 구간의 비율이에요. <strong>오차한계</strong>는 구간의 중심에서 한쪽 끝까지의 거리예요. 90%·95%·99%를 바꾸며 구간의 폭을 비교하세요.</p>}
          {step === 7 && <p className="ci-note"><strong>모표준편차 σ</strong>는 학생 개개인의 통학 시간이 얼마나 흩어지는지 나타내요. 여기서는 6분이라고 알고 있어요. <strong>n</strong>은 한 번에 뽑는 학생 수, <strong>x̄</strong>는 그 학생들의 평균이에요. z는 정규분포에서 신뢰수준에 맞는 구간 폭을 정하는 값이에요.</p>}
          {step === 0 && <><p className="ci-instruction">세 질문에 답하세요. 모르는 용어는 설명을 확인할 수 있어요.</p>{TERMS.map((term, index) => <fieldset className="ci-question" key={term.title}><legend>{term.question}</legend><div className="ci-options">{term.options.map((option, choice) => <button type="button" key={option} aria-pressed={terms[index] === choice} onClick={() => { setTerms(previous => previous.map((value, i) => i === index ? choice : value)); setTermChecked(false); setMessage(''); }}>{option}</button>)}</div><details open={termChecked && terms[index] !== term.correct ? true : undefined}><summary>용어 확인하기</summary><p>{term.help}</p></details></fieldset>)}<button className="ci-secondary" onClick={() => { setTermChecked(true); setMessage(termsPassed ? '확인했어요. 개념을 연결해볼까요?' : '표시된 설명을 읽고 다시 답하세요.'); }}>선수 개념 확인하기</button><p className="ci-note">이 세 문항은 입문 확인용이에요. 전체 선수 개념의 숙련도 진단은 아니에요.</p></>}
          {(step === 1 || step === 2) && <><p className="ci-instruction">{step === 1 ? '전교생 평균을 추정하려고 9명을 임의추출해요.' : '같은 모집단에서 다시 뽑고 평균을 비교하세요. 총 3회 이상 뽑아보세요.'}</p><button className="ci-primary" onClick={draw}>{observations.length ? '9명 다시 뽑아보기' : '9명 뽑아보기'}</button>{observations.length > 0 && <><div className="ci-data" aria-label="추출한 통학 시간">{observations.map((value, index) => <span key={index}>{value.toFixed(1)}</span>)}</div><div className="ci-stat"><span>이번 표본평균</span><strong>{center.toFixed(2)} <small>분</small></strong></div><p className="ci-note">카드는 소수 첫째 자리로 표시하고, 평균은 반올림 전 값으로 계산해요.</p></>}{step === 2 && <><div className="ci-mean-history">{drawnMeans.map((value, index) => <span key={index}>{index + 1}회 <strong>{value.toFixed(2)}분</strong></span>)}</div>{drawnMeans.length >= 3 && <div className="ci-concept"><strong>표본평균도 달라져요</strong><p>모집단은 같아도 뽑힌 표본이 달라지면 평균이 달라져요.</p></div>}</>}</>}
          {step === 3 && <><p className="ci-instruction">9명을 뽑아 평균을 구하는 과정을 반복하세요.</p><button className="ci-primary" disabled={distribution.length >= 200} onClick={() => setDistribution(previous => [...previous, ...simulateMeans(9, 20, random.current!)] )}>표본평균 20개 쌓아보기</button><span className="ci-inline-count">{distribution.length} / 200개</span><MeanChart values={distribution} />{distribution.length >= 40 && <div className="ci-concept"><strong>표본평균의 분포</strong><p>학생들의 값이 아니라, 여러 표본에서 구한 평균들의 분포예요. 이 체험의 정규모집단에서는 표본평균도 정규분포를 따라요.</p></div>}</>}
          {step === 4 && <>
            <p className="ci-instruction">뽑힌 학생이 달라지면 평균도 달라져요. 한 번에 10명씩 뽑을 때와 100명씩 뽑을 때, 평균들이 얼마나 흩어지는지 비교하세요.</p>
            <p className="ci-note"><strong>표본 수</strong>는 한 번에 뽑는 학생 수예요. 각 그래프는 그 인원으로 뽑아 구한 평균 240개를 모은 거예요. 학생 240명의 통학 시간 그래프가 아니에요.</p>
            <div className="ci-options" aria-label="표본 크기 선택">
              {[10, 30, 100].map(n => <button key={n} aria-pressed={size === n} onClick={() => { setSize(n); setVisitedSizes(previous => [...new Set([...previous, n])]); }}>{n}명씩 뽑기</button>)}
            </div>
            <MeanChart values={comparisonMeans} maximumCount={comparisonMaximum} />
            <p className="ci-note">가로·세로 눈금은 같아요. 10명과 100명을 모두 선택해 비교하세요.</p>
            {comparedSizes && <>
              <div className="ci-concept">
                <strong>좁아지는 건 ‘평균들의 분포’예요</strong>
                <p>100명씩 뽑은 평균들이 모평균 40분 부근에 더 가까이 모여요. 더 많은 학생의 값을 평균 내면 표본평균의 흔들림이 작아져요. 학생 개개인의 통학 시간 차이가 줄어드는 건 아니에요.</p>
                <p>이 평균들의 흩어짐을 나타내는 표준편차를 <strong>표준오차</strong>라고 해요. 값이 작을수록 반복해서 구한 평균들이 덜 흩어져요.</p>
              </div>
              <div className="ci-stat"><span>표준오차 · {size}명씩 뽑을 때</span><strong>{standardError(6, size).toFixed(2)} <small>분</small></strong></div>
              <details className="ci-conditions"><summary>공식과 기호 확인하기</summary><MathText text="$\text{표준오차}=\dfrac{\sigma}{\sqrt{n}}$" /><p>σ는 학생 개개인의 통학 시간의 표준편차로, 여기서는 6분이에요. n은 한 번에 뽑는 학생 수예요. n이 커지면 √n으로 나눈 값은 작아져요.</p><p>표준오차는 이번 평균이 실제 평균에서 정확히 얼마나 벗어났는지를 뜻하지는 않아요.</p></details>
              <fieldset className="ci-question"><legend>10명에서 100명으로 늘렸을 때, 평균들의 분포는?</legend><div className="ci-options">{[['narrow', '더 좁아져요'], ['wide', '더 넓어져요']].map(([value, label]) => <button key={value} aria-pressed={prediction === value} onClick={() => setPrediction(value)}>{label}</button>)}</div></fieldset>
              {prediction !== '' && <p className="ci-message" role="status">{prediction === 'narrow' ? '맞아요. 반복해서 구한 평균들이 더 가까이 모여요.' : '100명일 때 평균들이 모이는 가로 범위를 다시 비교하세요.'}</p>}
              <fieldset className="ci-question"><legend>표본 수가 늘면 무엇이 덜 흩어지나요?</legend><div className="ci-options ci-options-column">{[['means', '여러 번 뽑아 구한 표본평균들'], ['students', '학생 개개인의 통학 시간들']].map(([value, label]) => <button key={value} aria-pressed={spreadMeaning === value} onClick={() => setSpreadMeaning(value)}>{label}</button>)}</div></fieldset>
              {spreadMeaning !== '' && <p className="ci-message" role="status">{spreadMeaning === 'means' ? '맞아요. 학생들의 시간 분포는 그대로이고, 평균들의 흔들림이 작아져요.' : '학생들의 실제 통학 시간은 그대로예요. 달라지는 건 반복해서 구한 평균들의 분포예요.'}</p>}
            </>}
            <p className="ci-note">비교를 위해 같은 난수 기준을 사용해요. 표본 수는 바꾸지만 모집단과 반복 횟수는 같아요.</p>
          </>}
          {step === 5 && <><p className="ci-instruction">이번 평균 주변에 구간을 만들고, 실제 모평균을 포함하는지 확인하세요.</p><div className="ci-stat"><span>이번 표본평균</span><strong>{center.toFixed(2)} <small>분</small></strong></div><label className="ci-slider">평균의 양쪽으로 {width.toFixed(1)}분씩<input aria-label="추정 구간 반폭" type="range" min="0" max="6" step="0.1" value={width} onChange={event => { setWidth(Number(event.target.value)); setRevealed(false); }} /></label><div className="ci-range-number">{(center - width).toFixed(2)}분 ~ {(center + width).toFixed(2)}분</div><button className="ci-secondary" onClick={() => setRevealed(true)}>모평균 공개하기</button>{revealed && <div className="ci-concept"><strong>모평균 40분 · {contains(center - width, center + width) ? '포함했어요' : '포함하지 못했어요'}</strong><p>표본평균 한 값 대신 구간으로 추정할 수 있어요. 지금 폭은 직접 정한 값이라 95% 신뢰구간이라고 부를 수는 없어요.</p></div>}</>}
          {step === 6 && <><p className="ci-instruction">정해진 방법으로 구간을 반복해서 만들어보세요. 표본은 매번 새로 뽑아요.</p><div className="ci-options" aria-label="신뢰수준 선택">{([90, 95, 99] as ConfidenceLevel[]).map(value => <button key={value} aria-pressed={level === value} onClick={() => { setLevel(value); setInterpretation(''); }}>{value}%</button>)}</div><p className="ci-note">표본 수 9명 · 오차한계 {interval(40, 6, 9, level).margin.toFixed(2)}분. 신뢰수준을 바꾸면 같은 표본들의 구간 폭을 비교해요.</p><button className="ci-primary ci-spaced" disabled={intervalCenters.length >= 200} onClick={() => setIntervalCenters(previous => [...previous, ...simulateMeans(9, 100, random.current!)] )}>구간 100개 만들어보기</button>{intervalCenters.length > 0 && <><div className="ci-result"><strong>{intervalCenters.length}개 중 {hits}개 포함 · {(hits / intervalCenters.length * 100).toFixed(1)}%</strong><span>이번 실험 결과예요. 선택한 신뢰수준과 정확히 일치하지 않을 수 있어요.</span></div><IntervalPlot centers={intervalCenters} n={9} level={level} /><p className="ci-note">파란 실선: 모평균 포함 · 빨간 점선: 미포함</p><div className="ci-concept"><strong>신뢰수준 = 구간을 만드는 방법의 포함률</strong><p>같은 방법을 아주 많이 반복하면 약 {level}%의 구간이 모평균을 포함해요. 학생 {level}%의 통학 시간이 이 안에 있다는 뜻은 아니에요.</p></div><fieldset className="ci-question"><legend>신뢰수준 {level}%의 의미는?</legend><div className="ci-options ci-options-column">{[['repeat', '반복해 만든 구간 중 약 '+level+'%가 모평균을 포함해요'], ['students', '학생 '+level+'%의 통학 시간이 구간 안에 있어요']].map(([value, label]) => <button key={value} aria-pressed={interpretation === value} onClick={() => setInterpretation(value)}>{label}</button>)}</div></fieldset>{interpretation === 'students' && <p className="ci-note">추정 대상은 학생 개개인의 시간이 아니라 모평균이에요.</p>}</>}</>}
          {step === 7 && <><p className="ci-instruction">표본평균 41분, 표본 수 9명, 모표준편차 6분의 95% 신뢰구간을 구하세요.</p><div className="ci-formula"><MathText text="$\bar{x}\pm z\dfrac{\sigma}{\sqrt{n}}$" /><span>표본평균 ± 오차한계</span></div><dl className="ci-symbols"><div><dt>표본평균</dt><dd>구간의 중심 · 41</dd></div><div><dt>표준오차</dt><dd>평균의 흔들림 · 6 ÷ √9 = 2</dd></div><div><dt>z</dt><dd>95%에 해당하는 값 · 약 1.96</dd></div></dl><form onSubmit={event => { event.preventDefault(); const passed = checkCalculation(calculation); setCalculationPassed(passed); setMessage(passed ? '오차한계와 양 끝값을 계산했어요.' : '오차한계는 1.96 × 2예요. 중심에서 빼고 더해 양 끝값을 구하세요.'); }}><div className="ci-number-grid">{input(0, '오차한계 (분)')}{input(1, '아래 끝값 (분)')}{input(2, '위 끝값 (분)')}</div><p className="ci-note">소수 둘째 자리까지 입력하세요.</p><button className="ci-primary" disabled={calculationPassed}>계산 확인하기</button></form></>}
          {step === 8 && (finished ? <><div className="ci-concept"><strong>선수 개념을 연결해 구간을 계산하고 해석했어요.</strong><p>새 자료 문제를 통과했어요. 운영 숙련도 판정과 시간차 복습은 연결되지 않았어요.</p></div><div className="ci-completion">이번 체험 완료</div><button className="ci-secondary" onClick={() => { setFinished(false); setTransfer([]); setMessage(''); }}>새 자료 문제 다시 풀어보기</button></> : <><p className="ci-instruction">다른 학교의 자료예요. 정규모집단에서 독립적으로 임의추출했다고 가정해요.</p><div className="ci-given"><span>표본평균 <strong>42분</strong></span><span>표본 수 <strong>36명</strong></span><span>알려진 모표준편차 <strong>6분</strong></span><span>신뢰수준 <strong>95% · z ≈ 1.96</strong></span></div><form onSubmit={event => { event.preventDefault(); const passed = checkTransfer(transfer); setFinished(passed); setMessage(passed ? '' : '양 끝값, 신뢰수준의 의미, 표본 수에 따른 폭을 다시 확인하세요.'); }}><div className="ci-number-grid">{input(0, '아래 끝값 (분)', true)}{input(1, '위 끝값 (분)', true)}</div><fieldset className="ci-question"><legend>이 95%는 무엇을 뜻하나요?</legend><div className="ci-options ci-options-column">{[['repeat', '같은 방법을 반복할 때 약 95%의 구간이 모평균을 포함해요'], ['students', '학생 95%의 시간이 이 구간에 있어요'], ['fixed', '모평균이 움직이며 이 구간에 95% 확률로 들어와요']].map(([value, label]) => <button type="button" key={value} aria-pressed={transfer[2] === value} onClick={() => updateAnswer(2, value, true)}>{label}</button>)}</div></fieldset><fieldset className="ci-question"><legend>다른 조건이 같다면, 9명일 때보다 구간의 폭은?</legend><div className="ci-options">{[['narrow', '더 좁아요'], ['wide', '더 넓어요'], ['same', '같아요']].map(([value, label]) => <button type="button" key={value} aria-pressed={transfer[3] === value} onClick={() => updateAnswer(3, value, true)}>{label}</button>)}</div></fieldset><p className="ci-note">끝값은 소수 둘째 자리까지 입력하세요.</p><button className="ci-primary">답 확인하기</button></form></>)}
          <p className="ci-message" role="status">{message}</p>
          {step < 8 && <footer className="ci-actions"><button className="ci-secondary" disabled={step === 0} onClick={() => { setStep(previous => previous - 1); setMessage(''); }}>이전</button><button className="ci-primary" disabled={!ready} onClick={() => { setStep(previous => previous + 1); setMessage(''); }}>다음 단계 →</button></footer>}
          <details className="ci-conditions"><summary>체험 조건 확인하기</summary><p>가상의 통학 시간 정규모집단, 알려진 모표준편차 σ = 6분, 독립적인 임의추출을 가정해요. 실제 학생 자료가 아니에요. 모표준편차를 모르는 경우와 모비율 신뢰구간은 별도 학습이 필요해요.</p><p>현재 신뢰수준의 z 값: {LEVELS[level].toFixed(3)}</p><a href="https://www.itl.nist.gov/div898/handbook/prc/section1/prc14.htm" target="_blank" rel="noreferrer">통계 조건과 정의 · NIST</a></details>
        </section>
      </div>
      <footer className="ci-local">Case 3 · 운영 DB 연결 없음 · 진행은 이 화면에서만 유지</footer>
    </main>
  </div>;
}
