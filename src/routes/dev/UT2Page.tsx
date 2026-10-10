import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MathText from '../../components/MathText';
import ProblemLearningMap from './ProblemLearningMap';
import ConditionalConceptLesson from './ConditionalConceptLesson';
import { CONDITIONAL_GOALS, CONDITIONAL_NODES, breakdownQuestion, parseProbabilityAnswer } from './conditionalProblemBreakdown';
import useUT2Server from './useUT2Server';
import { ut2Score, type UT2Session } from './ut2ServerApi';
import './LevelTestMapPreviewPage.css';
import './ProblemLearningPreviewPage.css';
import './ConditionalProblemMapPage.css';
import './UT2Page.css';

type Remote = ReturnType<typeof useUT2Server>;
const percent = (n: number | null) => n === null ? '미완료' : `${n.toFixed(0)}%`;
const time = (n: number | null) => n === null ? '—' : `${n.toFixed(1)}초`;
function useQuestionTime(key: string) {
  const timer = useRef({ elapsed: 0, started: null as number | null });
  const [error, setError] = useState('');
  useEffect(() => {
    const storageKey = `suhwakhaeng:ut2:time:${key}`;
    try {
      const saved = Number(localStorage.getItem(storageKey) || 0);
      timer.current = { elapsed: Number.isFinite(saved) && saved >= 0 ? saved : 0, started: document.hidden ? null : Date.now() };
    } catch {
      // An external storage failure must be surfaced instead of silently corrupting timing.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('풀이 시간 복구용 저장소에 접근할 수 없어요.');
    }
    const pause = () => {
      if (timer.current.started !== null) { timer.current.elapsed += (Date.now() - timer.current.started) / 1000; timer.current.started = null; }
      try { localStorage.setItem(storageKey, String(timer.current.elapsed)); }
      catch { setError('풀이 시간을 이 기기에 보관하지 못했어요.'); }
    };
    const visibility = () => { pause(); if (!document.hidden) timer.current.started = Date.now(); };
    const interval = window.setInterval(() => { pause(); if (!document.hidden) timer.current.started = Date.now(); }, 2000);
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', pause);
    return () => { pause(); window.clearInterval(interval); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pause); };
  }, [key]);
  return { error, seconds: () => Math.min(86400, Math.max(0, timer.current.elapsed + (timer.current.started === null ? 0 : (Date.now() - timer.current.started) / 1000))) };
}

export default function UT2Page() {
  const remote = useUT2Server();
  const location = useLocation();
  const entryPassword = typeof location.state?.entryPassword === 'string' ? location.state.entryPassword : '';
  const [password, setPassword] = useState(entryPassword);
  const [nickname, setNickname] = useState('');
  const [entered, setEntered] = useState(!!entryPassword);
  const [entryBusy, setEntryBusy] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [study, setStudy] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(CONDITIONAL_GOALS[0].id);
  const main = useRef<HTMLElement>(null);
  const s = remote.reply?.session;
  useEffect(() => { main.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [s?.stage, s?.pre.responses.length, s?.post.responses.length, study]);
  async function enter() {
    if (entryBusy) return;
    setEntryBusy(true); setEntryError('');
    try { await remote.enter(password); setEntered(true); }
    catch (e) { setEntryError(e instanceof Error ? e.message : '입장하지 못했어요.'); }
    finally { setEntryBusy(false); }
  }
  async function open(id: string) {
    const next = await remote.act({ type: 'open', nodeId: id });
    if (next) {
      if (!CONDITIONAL_GOALS.find(g => g.id === selectedGoal)!.positions[id]) setSelectedGoal(CONDITIONAL_GOALS.find(g => g.positions[id])!.id);
      setStudy(true);
    }
  }
  const blocked = remote.loading || remote.busy || remote.hasPending || remote.blocked;
  return <div className="cpm-page ut2-page">
    <nav className="cpm-nav"><strong>수확행</strong><Link to="/">홈</Link></nav>
    <main ref={main} tabIndex={-1}>
      <header className="cpm-header"><h1>2차 학습 체험</h1><span>조건부확률{s ? ` · ${s.participant}` : ''}</span></header>
      <ol className="ut2-stages" aria-label="학습 진행 단계">{[['pre', '사전검사'], ['learning', '맞춤 학습 · 기출'], ['post', '사후검사'], ['done', '결과']].map(([id, label]) => <li key={id} aria-current={s?.stage === id ? 'step' : undefined}>{label}</li>)}</ol>
      {(remote.error || entryError) && <div className="ut2-error" role="alert"><p>{remote.error || entryError}</p>{remote.hasPending ? <button className="cpm-primary" disabled={remote.busy} onClick={async () => { const next = await remote.retry(); if (next?.session.stage === 'learning') setStudy(!!next.session.feedback); }}>다시 저장</button> : remote.error && <button className="cpm-text-button" onClick={() => window.location.reload()}>다시 연결</button>}</div>}
      {remote.conflict && <div className="ut2-error"><p>다른 탭을 닫고 이어가세요. 미저장 답안은 이 기기에 별도 보관합니다.</p><button className="cpm-text-button" disabled={remote.busy} onClick={async () => { await remote.recoverConflict(); setStudy(false); }}>다른 탭 기록으로 이어가기</button></div>}
      {remote.loading ? <p role="status">기록을 불러오는 중…</p> : !s ? <section className="cpm-study ut2-entry">
        <h2>{entered ? '닉네임을 알려주세요' : '학습 체험하기'}</h2>
        <p>사전검사 → 틀린 개념 중심 학습 → 기출 3문제 → 사후검사로 진행해요. 검사마다 개념 10문항과 기출형 3문항을 풉니다.</p>
        <p>닉네임, 답안, 풀이 시간과 학습 기록이 서버에 저장돼요. 계정 로그인은 필요 없어요.</p>
        <form onSubmit={e => { e.preventDefault(); if (entered) void remote.create(nickname.trim(), password); else void enter(); }}>
          <label>{entered ? '닉네임' : '입장 암호'}<input autoFocus key={String(entered)} type={entered ? 'text' : 'password'} autoComplete="off" aria-label={entered ? '닉네임' : '입장 암호'} maxLength={entered ? 40 : 100} value={entered ? nickname : password} onChange={e => entered ? setNickname(e.target.value) : setPassword(e.target.value)} /></label>
          <button className="cpm-primary" disabled={blocked || entryBusy || (entered ? !nickname.trim() : !password)}>{remote.busy || entryBusy ? '확인 중…' : entered ? '사전검사 시작 →' : '다음 →'}</button>
        </form>
      </section> : s.stage === 'pre' || s.stage === 'post' ? <Assessment key={`${s.id}:${s.stage}:${s[s.stage].responses.length}`} session={s} remote={remote} />
        : s.stage === 'done' ? <section className="cpm-study"><h2>학습 전후 결과</h2><Comparison session={s} />
          <p>동일 문항 암기를 줄이기 위해 사전·사후 숫자를 다르게 냈어요. 결과는 이 참가자의 학습 전후 변화이며, 서비스 효과의 인과관계를 단독으로 증명하는 것은 아니에요.</p>
          <button className="cpm-text-button" onClick={() => { remote.startNew(); setEntered(false); setPassword(''); setNickname(''); setStudy(false); }}>새 참가자로 시작 →</button></section>
          : study && s.learningNode ? <Study key={`${s.learningNode}:${s.attempts[s.learningNode] || 0}:${!!s.feedback}`} session={s} remote={remote} onMap={() => setStudy(false)} /> : <>
            <section className="ut2-diagnostic"><h2>틀린 부분부터 이어가요</h2><p>사전검사 {percent(ut2Score(s.pre).accuracy)} · 기출형 {percent(ut2Score(s.pre, 'application').accuracy)}</p>
              <div className="ut2-weak">{s.weak.length ? s.weak.map(id => <button key={id} disabled={blocked} onClick={() => void open(id)}>{s.results[id] === 'passed' ? '✓ ' : ''}{CONDITIONAL_NODES[id].label}</button>) : <span>기초 개념을 모두 확인했어요. 기출 적용부터 시작해요.</span>}</div>
              {s.recommended && <button className="cpm-primary" disabled={blocked} onClick={() => void open(s.recommended!)}>추천 학습: {CONDITIONAL_NODES[s.recommended].label} →</button>}
            </section>
            <div className="cpm-tabs" role="tablist" aria-label="기출 문제 선택">{CONDITIONAL_GOALS.map((goal, i) => <button key={goal.id} role="tab" aria-selected={selectedGoal === goal.id} onClick={() => setSelectedGoal(goal.id)}><b>{s.completed.includes(goal.rootId) ? '✓' : `0${i + 1}`}</b>{goal.title}</button>)}</div>
            <section className="cpm-target"><div><span>목표 기출문제</span><p><MathText text={breakdownQuestion(CONDITIONAL_GOALS.find(g => g.id === selectedGoal)!.rootId).prompt} /></p></div><button className="cpm-primary" disabled={blocked} onClick={() => void open(CONDITIONAL_GOALS.find(g => g.id === selectedGoal)!.rootId)}>기출 풀기 →</button></section>
            <section className="cpm-map"><ProblemLearningMap goal={CONDITIONAL_GOALS.find(g => g.id === selectedGoal)!} nodes={CONDITIONAL_NODES} state={{ results: Object.fromEntries(Object.entries(s.results).filter(([id]) => s.history.some(r => r.nodeId === id))), complete: s.completed.includes(CONDITIONAL_GOALS.find(g => g.id === selectedGoal)!.rootId) }} diagnostic={Object.fromEntries(Object.values(CONDITIONAL_NODES).filter(n => n.kind === 'concept').map(n => [n.id, s.weak.includes(n.id) ? 'failed' : 'passed']))} currentId={s.recommended || ''} columnGap={220} horizontalPadding={30} onSelectNode={blocked ? undefined : id => void open(id)} kindLabels={{ BN: '기출', AN: '미니 문제', concept: '개념' }} /></section>
            <footer className="cpm-map-footer"><span>기출 {s.completed.length}/3 완료 · 노드를 누르면 학습할 수 있어요.</span>
              <button className="cpm-primary" disabled={blocked || s.completed.length !== 3 || !!s.recommended} onClick={() => void remote.act({ type: 'post' })}>사후검사 시작 →</button></footer>
          </>}
    </main>
  </div>;
}

function Assessment({ session: s, remote }: { session: UT2Session; remote: Remote }) {
  const [answer, setAnswer] = useState('');
  const phase = s.stage as 'pre' | 'post';
  const clock = useQuestionTime(`${s.id}:${phase}:${s.question!.id}`);
  const send = (unknown = false) => void remote.act({ type: 'answer', questionId: s.question!.id, answer: unknown ? null : answer, seconds: clock.seconds() });
  return <section className="cpm-study"><header><strong>{phase === 'pre' ? '학습 전' : '학습 후'} 레벨테스트</strong><span>{s[phase].responses.length + 1} / {s[phase].total}</span></header>
    <p className="ut2-test-note">검사 중에는 정답과 힌트를 보여주지 않아요. 모르면 ‘모르겠습니다’를 눌러 주세요.</p>
    <p className="cpm-prompt"><MathText text={s.question!.prompt} /></p>
    {clock.error && <p role="alert">{clock.error}</p>}
    <AnswerForm answer={answer} setAnswer={setAnswer} disabled={remote.busy || remote.hasPending || !!clock.error} onSubmit={() => send()} onUnknown={() => send(true)} />
  </section>;
}
function Study({ session: s, remote, onMap }: { session: UT2Session; remote: Remote; onMap: () => void }) {
  const id = s.learningNode!; const node = CONDITIONAL_NODES[id];
  const [reading, setReading] = useState(node.kind === 'concept' && !s.feedback);
  const [answer, setAnswer] = useState('');
  const clock = useQuestionTime(`${s.id}:learning:${id}:${s.attempts[id] || 0}`);
  const submit = async (unknown = false) => {
    const next = await remote.act({ type: 'answer', nodeId: id, variant: s.attempts[id] || 0, answer: unknown ? null : answer, seconds: clock.seconds() });
    if (next && !next.session.feedback) onMap();
  };
  return <section className="cpm-study"><header><button className="cpm-text-button" onClick={onMap}>← 문제 지도</button><span>{node.kind === 'BN' ? '기출 문제' : node.kind === 'AN' ? '미니 문제' : '개념 학습'}</span></header>
    <h2>{node.label}</h2>
    {reading ? <ConditionalConceptLesson nodeId={id} onConfirm={() => setReading(false)} /> : <>
      <p className="cpm-prompt"><MathText text={s.feedback?.prompt || s.question!.prompt} /></p>
      {clock.error && <p role="alert">{clock.error}</p>}
      {s.feedback ? <div className="cpm-feedback" role="status"><strong>{s.feedback.unknown ? '기초부터 확인해 볼까요?' : '필요한 부분을 다시 확인해요'}</strong>{s.feedback.explanation ? <p><MathText text={s.feedback.explanation} /></p> : <p>‘{CONDITIONAL_NODES[s.feedback.nextNode]?.label}’부터 확인한 뒤 이 문제로 돌아와요.</p>}<button className="cpm-primary" disabled={remote.busy || remote.hasPending} onClick={() => void remote.act({ type: 'continue' })}>{s.feedback.nextNode === id ? '숫자를 바꿔 다시 풀기 →' : '필요한 하위 학습으로 이어가기 →'}</button></div>
        : <><AnswerForm answer={answer} setAnswer={setAnswer} disabled={remote.busy || remote.hasPending || !!clock.error} onSubmit={() => void submit()} onUnknown={() => void submit(true)} />
          {node.kind === 'concept' && <button className="cpm-text-button" onClick={() => setReading(true)}>개념 설명 다시 보기</button>}</>}
    </>}
  </section>;
}
function AnswerForm({ answer, setAnswer, disabled, onSubmit, onUnknown }: { answer: string; setAnswer: (v: string) => void; disabled: boolean; onSubmit: () => void; onUnknown: () => void }) {
  return <form onSubmit={e => { e.preventDefault(); if (!disabled && parseProbabilityAnswer(answer) !== null) onSubmit(); }}><label>답안<input type="text" aria-label="답안" inputMode="text" autoComplete="off" maxLength={100} placeholder="분수 또는 소수 (예: 1/2)" value={answer} onChange={e => setAnswer(e.target.value)} disabled={disabled} /></label>
    <div className="cpm-actions"><button className="cpm-text-button" type="button" disabled={disabled} onClick={onUnknown}>모르겠습니다</button><button className="cpm-primary" disabled={disabled || parseProbabilityAnswer(answer) === null}>제출 →</button></div></form>;
}
function Comparison({ session: s }: { session: UT2Session }) {
  return <div className="ut2-comparison"><table><thead><tr><th>구분</th><th>학습 전</th><th>학습 후</th><th>변화</th></tr></thead><tbody>{[[undefined, '전체'], ['foundation', '개념'], ['application', '기출형']].map(([group, label]) => {
    const pre = ut2Score(s.pre, group as 'foundation' | 'application' | undefined), post = ut2Score(s.post, group as 'foundation' | 'application' | undefined);
    const gain = pre.accuracy !== null && post.accuracy !== null ? post.accuracy - pre.accuracy : null;
    return <tr key={label}><th>{label}</th><td>{percent(pre.accuracy)}</td><td>{percent(post.accuracy)}</td><td>{gain === null ? '—' : `${gain > 0 ? '+' : ''}${gain.toFixed(0)}%p`}</td></tr>;
  })}<tr><th>평균 풀이 시간</th><td>{time(ut2Score(s.pre).average)}</td><td>{time(ut2Score(s.post).average)}</td><td>—</td></tr><tr><th>모름</th><td>{ut2Score(s.pre).unknown}</td><td>{ut2Score(s.post).unknown}</td><td>—</td></tr></tbody></table></div>;
}
