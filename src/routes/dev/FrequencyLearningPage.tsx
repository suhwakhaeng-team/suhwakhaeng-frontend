import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkMission, DATASETS, EMPTY_PROGRESS, frequencies, parseProgress, RANGES, STEPS, STORAGE_KEY } from './frequencyCourse';
import type { CourseProgress } from './frequencyCourse';
import './FrequencyLearningPage.css';
import FrequencyExploration from './FrequencyExploration';

function loadProgress() {
  try { return parseProgress(localStorage.getItem(STORAGE_KEY)); } catch { return EMPTY_PROGRESS; }
}

export default function FrequencyLearningPage({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState<CourseProgress>(loadProgress);
  const [step, setStep] = useState(() => Math.min(loadProgress().completed.length, 5));
  const [review, setReview] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [answers, setAnswers] = useState<string[]>(() => loadProgress().completed.length === 3 ? ['2'] : []);
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [hint, setHint] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const finished = progress.completed.length === STEPS.length;
  const xp = progress.completed.length * 20 + (progress.reviewPassed ? 30 : 0);
  const lesson = STEPS[step];
  const data = review ? DATASETS.review : step === 4 ? DATASETS.independent : step === 5 ? DATASETS.challenge : DATASETS.practice;
  const counts = frequencies(data);
  const correct = feedback === 'correct';

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Private mode: in-memory progress remains usable. */ }
  }, [progress]);

  function goTo(next: number, isReview = false) {
    setPracticing(isReview);
    setStep(next); setReview(isReview); setAnswers(next === 3 ? ['2'] : []);
    setSelected([]); setFeedback(null); setHint(false);
  }

  function answer(index: number, value: string) {
    setAnswers(previous => { const next = [...previous]; next[index] = value; return next; });
    setFeedback(null);
  }

  function check() {
    if (!checkMission(step, answers, selected, review)) { setFeedback('incorrect'); return; }
    setFeedback('correct');
    setProgress(previous => review
      ? { ...previous, reviewPassed: !hint || previous.reviewPassed }
      : { ...previous, completed: [...new Set([...previous.completed, step])].sort((a, b) => a - b) });
  }

  function numericInput(index: number, label: string) {
    return <input aria-label={label} type="number" min="0" step="1" inputMode="numeric" value={answers[index] ?? ''} disabled={correct}
      onChange={event => answer(index, event.target.value)} placeholder="?" />;
  }

  return <div className="fl-shell">
    <nav className="fl-nav"><strong>수확행</strong><Link to="/dev/knowledge-graph">개념 지도</Link><span>{onComplete ? '도수분포표 기초 학습' : '로컬 체험판'}</span></nav>
    <main className="fl-main">
      <header className="fl-heading"><div><p>자료의 정리 · 기초 코스</p><h1>도수분포표</h1></div><div className="fl-xp"><span>✦</span> {xp} XP <small>학습 경험치</small></div></header>
      <div className="fl-layout">
        <aside className="fl-roadmap" aria-label="학습 단계">
          <div className="fl-roadmap-heading"><strong>학습 순서</strong><span>{progress.completed.length} / 6</span></div>
          <div className="fl-progress" role="progressbar" aria-label="코스 진행" aria-valuenow={progress.completed.length} aria-valuemin={0} aria-valuemax={6}><i style={{ width: `${progress.completed.length / 6 * 100}%` }} /></div>
          <ol>{STEPS.map((item, index) => {
            const done = progress.completed.includes(index);
            const locked = index > progress.completed.length;
            return <li key={item.title}><button aria-label={`${index + 1}단계 ${item.title}${locked ? ' (잠김)' : ''}`} className={`${step === index && !review ? 'active' : ''} ${done ? 'done' : ''}`} disabled={locked} aria-current={step === index && !review ? 'step' : undefined} onClick={() => goTo(index)}>
              <span className="fl-station">{done ? '✓' : locked ? '·' : index + 1}</span><span><strong>{item.title}</strong></span>{locked && <span className="fl-lock">잠김</span>}
            </button></li>;
          })}</ol>
          <div className={`fl-harvest ${finished ? 'is-complete' : ''}`}><span className="fl-harvest-icon">{finished ? '✦' : '◇'}</span><strong>{progress.reviewPassed ? '복습까지 확인했어요' : finished ? '학습을 완료했어요' : '도수분포표 학습'}</strong><p>{finished ? '도수분포표 · 1차 학습 완료' : '6단계 학습'}</p>
            {finished && (onComplete ? <button className="fl-secondary" onClick={onComplete}>상황에 적용하기 →</button> : <button className="fl-secondary" onClick={() => goTo(5, true)}>{progress.reviewPassed ? '복습 다시 하기' : '복습 미션 체험'}</button>)}
          </div>
        </aside>
        <section className="fl-lesson" aria-label="현재 미션">
          <div className="fl-lesson-top"><span>{review ? '복습 미션' : `STEP ${step + 1}`}</span><span>{review ? '복습' : progress.completed.includes(step) ? '재도전' : '첫 완료 +20 XP'}</span></div>
          <h2>{review ? '새 자료로 복습해보기' : lesson.title}</h2>{(practicing || review) && <p className="fl-goal">{lesson.goal}</p>}
          {!review && <div className="fl-phase-tabs"><button aria-pressed={!practicing} onClick={() => setPracticing(false)}>1. 개념과 예시</button><span>→</span><button disabled={!practicing} aria-pressed={practicing}>2. 혼자 풀기</button></div>}
          {!review && !practicing ? <FrequencyExploration key={step} step={step} onPractice={() => { setPracticing(true); setFeedback(null); }} /> : <>
          {review && <p className="fl-review-notice">체험판에서는 바로 복습할 수 있어요. 실제 서비스의 시간차 복습은 아직 연결하지 않았어요.</p>}
          {step === 0 ? <div className="fl-example"><div><span className="fl-caption">학생 8명의 통학 시간 · 분</span><div className="fl-data">{data.map((value, index) => <span key={index}>{value}</span>)}</div></div><span className="fl-example-arrow" aria-hidden="true">→</span><table><caption>구간별로 정리하면</caption><thead><tr><th>통학 시간 (분)</th><th>도수 (명)</th></tr></thead><tbody>{RANGES.map((range, index) => <tr key={range}><td>{range}</td><td>{counts[index]}</td></tr>)}</tbody></table></div>
            : step === 1 ? <div className="fl-card-game"><span className="fl-caption">20 ≤ 통학 시간 &lt; 30</span><div>{[19, 20, 23, 29, 30, 35].map(value => <button key={value} aria-pressed={selected.includes(value)} disabled={correct} className={selected.includes(value) ? 'selected' : ''} onClick={() => { setSelected(previous => previous.includes(value) ? previous.filter(item => item !== value) : [...previous, value]); setFeedback(null); }}>{value}<small>분</small></button>)}</div><p>카드를 눌러 선택하거나 해제하세요.</p></div>
            : <div className="fl-dataset"><span className="fl-caption">{step >= 4 ? `새로운 학생 ${data.length}명의` : '학생 8명의'} 통학 시간 · 분</span><div className="fl-data">{data.map((value, index) => <span className={step === 2 && hint && value >= 20 && value < 30 ? 'highlight' : ''} key={index}>{value}</span>)}</div></div>}

          <form onSubmit={event => { event.preventDefault(); if (!correct) check(); }}>
            {step === 0 && <fieldset className="fl-options"><legend>20 이상 30 미만인 학생은 몇 명인가요?</legend>{['2명', '4명', '8명'].map((label, index) => <label key={label} className={answers[0] === String(index) ? 'selected' : ''}><input type="radio" name="read-table" value={index} checked={answers[0] === String(index)} disabled={correct} onChange={() => answer(0, String(index))} />{label}</label>)}</fieldset>}
            {step === 2 && <label className="fl-count-answer">도수 {numericInput(0, '20 이상 30 미만의 도수')} 명</label>}
            {step >= 3 && <table className="fl-answer-table"><caption>도수분포표 완성하기</caption><thead><tr><th>통학 시간 (분)</th><th>도수 (명)</th></tr></thead><tbody>{RANGES.map((range, index) => <tr key={range}><td>{range}</td><td>{step === 3 && index === 0 ? <span className="fl-given">2 <small>예시</small></span> : numericInput(index, `${range}의 도수`)}</td></tr>)}</tbody></table>}
            {step === 5 && <div className="fl-interpret"><label>가장 많은 학생이 속한 구간<select aria-label="가장 많은 구간" value={answers[3] ?? ''} disabled={correct} onChange={event => answer(3, event.target.value)}><option value="">구간 선택</option>{RANGES.map((range, index) => <option value={index} key={range}>{range}</option>)}</select></label><label>전체 학생 수 <span>{numericInput(4, '전체 학생 수')} 명</span></label></div>}
            <div className="fl-feedback" aria-live="polite">{feedback === 'incorrect' && <div className="fl-retry"><strong>조금만 다시 살펴봐요.</strong><p>{step === 1 ? '20은 포함, 30은 제외예요. 선택한 카드들을 확인해보세요.' : step >= 3 ? '각 구간의 개수와 경계값을 확인해요. 마지막 도전에서는 구간과 전체 인원도 확인해야 해요.' : '표의 해당 행 또는 구간에 들어가는 자료를 다시 확인해보세요.'}</p></div>}
              {correct && <div className="fl-success"><strong>{review && hint ? '도움을 받아 해결했어요!' : review ? '새로운 자료에서도 성공했어요!' : '미션 성공!'}</strong><p>{review && hint ? '복습 확인 배지는 힌트 없이 다시 도전하면 받을 수 있어요.' : review ? '복습 확인 배지 획득 · 보상은 최초 1회만 지급돼요.' : step === 5 && onComplete ? '기초 학습 완료. 이제 이야기 속 자료에 적용해봐요.' : step === 5 ? '도수분포표 1차 학습 완료. 다음은 복습으로 확인해요.' : '다음 단계로 진행하세요.'}</p></div>}
            </div>
            {hint && <div className="fl-hint"><strong>힌트</strong><p>{lesson.tip}</p></div>}
            <footer className="fl-actions">{!correct ? <><button type="button" className="fl-hint-button" onClick={() => setHint(true)}>힌트 보기</button><button className="fl-primary" type="submit">정답 확인</button></> : <><span className="fl-no-penalty">{hint ? '도움을 받은 학습' : '스스로 해결했어요'}</span><button className="fl-primary" type="button" onClick={event => { event.preventDefault(); if (step === 5 && !review && onComplete) onComplete(); else if (review || step === 5) goTo(5, true); else goTo(step + 1); }}>{review ? hint ? '힌트 없이 재도전' : '다시 연습하기' : step === 5 && onComplete ? '상황에 적용하기 →' : step === 5 ? '복습 미션 체험' : '다음 미션 →'}</button></>}</footer>
          </form>
          </>}
        </section>
      </div>
      <footer className="fl-local-footer"><span>{onComplete ? '학습 활동은 이 기기에 임시 저장 · 실전 문제 결과는 계정에 기록' : '운영 DB 연결 없음 · 브라우저 저장 허용 시 이 기기에만 기록'}</span>{resetConfirm ? <div>체험 기록을 초기화할까요? <button onClick={() => { setProgress(EMPTY_PROGRESS); goTo(0); setResetConfirm(false); }}>초기화</button><button onClick={() => setResetConfirm(false)}>취소</button></div> : <button onClick={() => setResetConfirm(true)}>체험 초기화</button>}</footer>
    </main>
  </div>;
}
