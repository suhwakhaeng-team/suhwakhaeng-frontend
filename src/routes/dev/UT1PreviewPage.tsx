import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import HomeDashboard from '../../components/home/HomeDashboard';
import CurriculumListSection from '../../components/home/CurriculumListSection';
import ProblemQuestionCard from '../../components/ProblemQuestionCard';
import ProblemContent from '../../components/ProblemContent';
import ProblemLearningMap from './ProblemLearningMap';
import GuidedConceptActivity from './UT1ConceptActivities';
import { hasGuidedActivity } from './ut1ConceptActivityModel';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { archiveLearning, beginPost, beginUTLearning, createSession, decodeStore, FOUNDATION_ROOTS, gain, isNumericAnswer,
  LABELS, learningDiagnostic, learningQuestion, makeGoal, nextUTLearning, pauseTimer, prepareUTSession, recommendedUTNode, resumeTest, runSummary, SKILLS,
  submitTest, submitUTLearning, UT_GOALS, UT_NODES, UT_STORAGE_KEY, type UTSession, type UTStore } from './ut1Model';
import type { Diagnostic } from './problemLearningModel';
import { acceptsUTPreviewPassword, validUTNickname } from './ut1EntryModel';
import useUT1Server from './useUT1Server';
import UT1ConnectionNotice from './UT1ConnectionNotice';
import './LevelTestMapPreviewPage.css';
import './ProblemLearningPreviewPage.css';
import './UT1PreviewPage.css';

type View = 'home' | 'test' | 'study' | 'map' | 'results';
const card = { padding: spacing.xl, background: colors.white, borderRadius: radius.lg };
const primary = { padding: '14px 24px', background: colors.brand600, color: colors.white, border: 'none', borderRadius: radius.sm,
  ...typography.bodyTextXLSemiBold, fontSize: 16, cursor: 'pointer' };
const textButton = { border: 'none', background: 'none', color: colors.gray500, fontSize: 14, cursor: 'pointer', padding: 0 };
const signed = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(0)}%p`;
const seconds = (value: number | null) => value === null ? '—' : `${value.toFixed(1)}초`;

function readLocal(storageKey: string) {
  try {
    const raw = localStorage.getItem(storageKey); const store = decodeStore(raw);
    // Do not replace malformed or incompatible saved records on mount.
    const blocked = !!raw && store.sessions.length === 0 && JSON.stringify(JSON.parse(raw)) !== JSON.stringify({ version: 1, activeId: null, sessions: [] });
    return { store, blocked, error: blocked ? '저장된 UT 기록을 읽을 수 없어요. 기존 기록을 보존하기 위해 저장을 중단했어요.' : '' };
  } catch { return { store: decodeStore(null), blocked: true, error: '브라우저 저장소에 접근할 수 없어요. 저장 허용 여부를 확인해 주세요.' }; }
}

function useLocalUT(storageKey: string, readOnly = false) {
  const [initial] = useState(() => readLocal(storageKey));
  const [store, setStore] = useState<UTStore>(initial.store);
  const [error, setError] = useState(initial.error);
  useEffect(() => {
    if (initial.blocked || readOnly) return;
    try { localStorage.setItem(storageKey, JSON.stringify(store)); }
    catch {
      // A failed external-storage synchronization must be visible to the user.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('기록을 저장하지 못했어요. 이 브라우저의 저장 공간과 설정을 확인해 주세요.');
    }
  }, [store, initial.blocked, readOnly, storageKey]);
  // Persist elapsed active time, excluding leaving the page and hidden tabs.
  useEffect(() => {
    if (initial.blocked || readOnly) return;
    const snapshot = () => {
      const paused = { ...store, sessions: store.sessions.map(session => session.id === store.activeId ? pauseTimer(session) : session) };
      try { localStorage.setItem(storageKey, JSON.stringify(paused)); } catch { /* Main save reports errors. */ }
    };
    const interval = window.setInterval(snapshot, 2000);
    window.addEventListener('pagehide', snapshot);
    return () => { window.clearInterval(interval); window.removeEventListener('pagehide', snapshot); };
  }, [store, initial.blocked, readOnly, storageKey]);
  useEffect(() => {
    if (!readOnly) return;
    const refresh = (event: StorageEvent) => { if (event.key === storageKey) setStore(decodeStore(event.newValue)); };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [readOnly, storageKey]);
  return { store, setStore, error, blocked: initial.blocked };
}

function NumericAnswer({ value, onChange, onSubmit, disabled = false }: {
  value: string; onChange: (value: string) => void; onSubmit: () => void; disabled?: boolean;
}) {
  return <label className="plm-number-answer">답안
    <input aria-label="숫자 답안" inputMode="numeric" autoComplete="off" placeholder="숫자로 입력하세요" value={value} disabled={disabled}
      onChange={event => onChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && isNumericAnswer(value) && !disabled) { event.preventDefault(); onSubmit(); } }} />
  </label>;
}

// 활동 완료는 확인 문제를 열기만 한다. 통과/기록은 기존 submitUTLearning만 담당한다.
function ConceptLesson({ nodeId, retry, onContinue }: { nodeId: string; retry: boolean; onContinue: () => void }) {
  const guided = hasGuidedActivity(nodeId);
  const [ready, setReady] = useState(!guided);
  return <><h2 style={typography.headingXLBold}>{UT_NODES[nodeId].label}</h2>
    {guided ? <GuidedConceptActivity nodeId={nodeId} retry={retry} onComplete={() => setReady(true)} />
      : <div className="ut-concept-note"><ProblemContent content={UT_NODES[nodeId].note!} /></div>}
    {ready && <div className="uca-continue"><button style={primary} onClick={onContinue}>확인 문제 풀기 →</button></div>}
  </>;
}

function Comparison({ session }: { session: UTSession }) {
  const pre = runSummary(session.pre); const post = runSummary(session.post);
  return <div className="ut-comparison">
    <div className="ut-score-row"><div><span>학습 전</span><strong>{pre.accuracy === null ? '진행 중' : `${pre.accuracy.toFixed(0)}%`}</strong><small>{pre.correct} / {pre.total} 정답</small></div>
      <div><span>학습 후</span><strong>{post.accuracy === null ? '미완료' : `${post.accuracy.toFixed(0)}%`}</strong><small>{post.answered ? `${post.correct} / ${post.total} 정답` : '아직 응답 없음'}</small></div>
      <div><span>정답률 변화</span><strong className="ut-gain">{signed(gain(session))}</strong><small>퍼센트포인트 차이</small></div></div>
    <div className="ut-table-scroll"><table><thead><tr><th>개념</th><th>학습 전</th><th>학습 후</th><th>변화</th><th>평균 시간 · 전 / 후</th></tr></thead><tbody>
      {SKILLS.map(skill => { const a = runSummary(session.pre, skill); const b = runSummary(session.post, skill); return <tr key={skill}><th>{LABELS[skill]}</th><td>{a.complete ? `${a.correct}/2` : '—'}</td><td>{b.complete ? `${b.correct}/2` : '—'}</td><td>{signed(gain(session, skill))}</td><td>{seconds(a.average)} / {seconds(b.average)}</td></tr>; })}
    </tbody></table></div>
    <p className="plm-live-muted">평균 풀이 시간 {seconds(pre.average)} → {seconds(post.average)} · 모르겠습니다 {pre.unknown} → {post.unknown}문항</p>
  </div>;
}

export default function UT1PreviewPage({ server = false }: { server?: boolean }) {
  const location = useLocation();
  const demo = new URLSearchParams(location.search).get('demo') === '1';
  const local = useLocalUT(`${UT_STORAGE_KEY}${demo ? ':demo' : ''}`, server);
  const remote = useUT1Server(server);
  const { store, setStore, error, blocked } = server ? remote : local;
  const session = store.sessions.find(item => item.id === store.activeId);
  const [entry, setEntry] = useState<'password' | 'nickname' | 'ready'>('password');
  const [password, setPassword] = useState(''); const [entryError, setEntryError] = useState('');
  const [entryBusy, setEntryBusy] = useState(false);
  const [view, setView] = useState<View>('home'); const [mapReturn, setMapReturn] = useState<View>('home');
  const [name, setName] = useState(''); const [answer, setAnswer] = useState(''); const [notice, setNotice] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('bn-1'); const mainRef = useRef<HTMLElement>(null);
  const stage = session?.stage;
  const run = stage === 'pre' || stage === 'post' ? session?.[stage] : null;
  const question = run?.questions[run.responses.length]; const state = session ? prepareUTSession(session).learning : null;
  const diagnostic: Diagnostic = session ? learningDiagnostic(session) : {};
  const preparingIds = stage === 'learning' ? [
    ...SKILLS.filter(skill => diagnostic[`c-${skill}`] !== 'passed').map(skill => FOUNDATION_ROOTS[skill]),
    ...(state ? [state.currentId, ...state.parents, ...(state.preparation ?? [])] : []),
  ] : [];
  const goal = makeGoal(state?.goalId ?? selectedGoal, false, preparingIds);
  const node = state ? UT_NODES[state.currentId] : null; const learningQ = state ? learningQuestion(state) : null;
  const remaining = UT_GOALS.filter(item => !session?.completed.includes(item.id));
  const recommended = remaining[0] ?? UT_GOALS[0];
  const recommendationGoal = state ? makeGoal(state.goalId) : recommended;
  const recommendationNode = session ? recommendedUTNode(session, recommendationGoal.rootId) : recommendationGoal.rootId;
  const preparing = recommendationNode !== recommendationGoal.rootId;
  const passMap = view === 'map' && state?.feedback === 'correct';
  const afterPass = passMap && state ? nextUTLearning(state, diagnostic) : null;
  const retryingHere = state && state.feedback && state.feedback !== 'correct'
    && nextUTLearning(state, diagnostic).currentId === state.currentId;
  function update(transform: (value: UTSession) => UTSession) {
    setStore(previous => ({ ...previous, sessions: previous.sessions.map(value => value.id === previous.activeId ? transform(prepareUTSession(value)) : value) }));
  }
  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [view, question?.id, state?.currentId, state?.reading, state?.complete]);
  useEffect(() => {
    const visibility = () => {
      if (view !== 'test') return;
      setStore(previous => ({ ...previous, sessions: previous.sessions.map(value => value.id !== previous.activeId ? value : document.hidden ? pauseTimer(value) : resumeTest(value)) }));
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [view, setStore]);
  // Learning timers count visible problem time, excluding notes and maps.
  const learningClock = useRef({ key: '', started: 0, elapsed: 0 });
  useEffect(() => {
    if (view !== 'study' || !state || state.reading || state.feedback || state.complete) return;
    const key = `${session?.id}:${state.currentId}:${state.attempts[state.currentId] ?? 0}:${state.history.length}`;
    if (learningClock.current.key !== key) learningClock.current = { key, started: 0, elapsed: 0 };
    const start = () => { if (!document.hidden) learningClock.current.started = Date.now(); };
    const pause = () => { if (learningClock.current.started) { learningClock.current.elapsed += Date.now() - learningClock.current.started; learningClock.current.started = 0; } };
    const visibility = () => { if (document.hidden) pause(); else start(); };
    start(); document.addEventListener('visibilitychange', visibility);
    return () => { pause(); document.removeEventListener('visibilitychange', visibility); };
  }, [view, state, session?.id]);
  function goHome() { update(pauseTimer); setView('home'); setAnswer(''); }
  function beginTest() { update(resumeTest); setAnswer(''); setNotice(''); setView('test'); }
  function submit(answerValue: string | null) {
    if (!question) return;
    const id = question.id;
    update(value => {
      const next = submitTest(value, answerValue, Date.now(), id);
      return next === value ? value : resumeTest(next);
    });
    setAnswer('');
    if (run?.responses.length === 9) { setView(stage === 'pre' ? 'home' : 'results'); setNotice(stage === 'pre' ? '사전 테스트가 끝났어요. 결과에 맞춰 필요한 기초부터 학습해요.' : ''); }
  }
  function beginLearning(rootId: string) {
    if (stage !== 'learning') { setNotice('사전 테스트를 끝낸 뒤 학습할 수 있어요.'); return; }
    if (state && state.goalId !== rootId) { setNotice('진행 중인 문제를 먼저 끝내 주세요.'); setView('study'); return; }
    update(value => beginUTLearning(value, rootId)); setAnswer(''); setNotice('');
    setMapReturn('study'); setView(state?.feedback === 'correct' ? 'map' : 'study');
  }
  function submitLearning(answerValue: string | null) {
    if (!state || state.reading || state.feedback || state.complete) return;
    const clock = learningClock.current;
    const duration = clock.elapsed + (clock.started ? Date.now() - clock.started : 0);
    const now = Date.now();
    const result = submitUTLearning({ ...state, startedAt: now - duration }, answerValue, now);
    update(value => value.learning ? { ...value, learning: submitUTLearning({ ...value.learning, startedAt: now - duration }, answerValue, now) } : value);
    setAnswer('');
    if (result.feedback === 'correct') { setMapReturn('study'); setView('map'); }
  }
  function nextLearning() {
    const next = state ? nextUTLearning(state, diagnostic) : null;
    update(value => {
      if (!value.learning) return value;
      const advanced = { ...value, learning: nextUTLearning(value.learning, learningDiagnostic(value)) };
      return advanced.learning.complete ? archiveLearning(advanced) : advanced;
    });
    setAnswer('');
    if (next?.complete) { setSelectedGoal(remaining.find(item => item.id !== state?.goalId)?.id ?? 'bn-1'); setView('home'); }
    else setView('study');
  }
  function finishGoal() {
    update(archiveLearning); setSelectedGoal(remaining.find(item => item.id !== state?.goalId)?.id ?? 'bn-1'); setView('home');
  }
  async function newParticipant() {
    if (blocked || entryBusy || !validUTNickname(name)) return;
    setEntryBusy(true); setEntryError('');
    try {
      if (server) { const next = await remote.createParticipant(name.trim(), password); setStore({ version: 1, activeId: next.id, sessions: [resumeTest(next)] }); }
      else setStore(previous => { const next = resumeTest(createSession(name.trim(), previous.sessions.length)); return { ...previous, activeId: next.id, sessions: [...previous.sessions.map(item => pauseTimer(item)), next] }; });
      setPassword(''); setName(''); setNotice(''); setEntry('ready'); setView('test');
    } catch (caught) { setEntryError(caught instanceof Error ? caught.message : '참가자를 만들지 못했어요.'); }
    finally { setEntryBusy(false); }
  }
  async function checkEntry() {
    if (entryBusy || blocked) return;
    setEntryBusy(true); setEntryError('');
    try {
      if (server) await remote.enter(password);
      else if (!acceptsUTPreviewPassword(password)) throw new Error('입장 암호가 맞지 않아요. 다시 확인해 주세요.');
      if (!server) setPassword(''); setEntry('nickname');
    } catch (caught) { setEntryError(caught instanceof Error ? caught.message : '입장할 수 없어요.'); }
    finally { setEntryBusy(false); }
  }
  function openMap() { setMapReturn(view); setView('map'); }
  function resetEntry() {
    setPassword(''); setName(''); setAnswer(''); setEntryError(''); setNotice('');
    setSelectedGoal('bn-1'); setView('home'); setEntry('password');
  }
  function disconnectDeleted() {
    if (remote.startNewParticipant()) resetEntry();
  }
  const connectionNotice = server
    ? <UT1ConnectionNotice message={error} deleted={remote.deleted} onRetry={() => void remote.retry()} onStartNew={disconnectDeleted} />
    : error && <p className="ut-error" role="alert">{error}</p>;
  if (entry !== 'ready') return <div className="ut-preview ut-entry"><main className="ut-registration" style={card}>
    <div className="ut-entry-brand">수확행</div>
    <h1>{entry === 'password' ? '학습 체험하기' : '닉네임을 알려주세요'}</h1>
    <p>{entry === 'password' ? '안내받은 입장 암호를 입력해 주세요.' : '이 닉네임으로 학습 전후 기록을 남겨요.'}</p>
    {connectionNotice}
    {entry === 'password' ? <form onSubmit={event => { event.preventDefault(); void checkEntry(); }}>
      <label>입장 암호<input autoFocus type="password" inputMode="numeric" autoComplete="off" aria-label="입장 암호" value={password} onChange={event => { setPassword(event.target.value); setEntryError(''); }} /></label>
      {entryError && <p className="ut-error" role="alert">{entryError}</p>}
      <button type="submit" style={primary} disabled={!password || blocked || entryBusy}>{entryBusy ? '확인 중…' : '다음 →'}</button>
    </form> : <>
      {entryError && <p className="ut-error" role="alert">{entryError}</p>}
      <form onSubmit={event => { event.preventDefault(); void newParticipant(); }}><label>닉네임<input autoFocus aria-label="닉네임" autoComplete="off" value={name} onChange={event => setName(event.target.value)} maxLength={40} placeholder="사용할 닉네임" /></label>
        <button type="submit" style={primary} disabled={!validUTNickname(name) || blocked || entryBusy}>{entryBusy ? '준비 중…' : '레벨테스트 시작 →'}</button>
      </form>
      {session && <div className="ut-entry-resume"><p>이전 학습 이어하기</p><button style={textButton} disabled={blocked} onClick={() => { setEntry('ready'); setView('home'); }}>{session.participant} · 이어하기 →</button></div>}
    </>}
  </main></div>;
  const map = <ProblemLearningMap goal={goal} nodes={UT_NODES} columnGap={260} horizontalPadding={54} state={state ?? null} diagnostic={diagnostic} currentId={passMap ? '' : state?.currentId ?? (stage === 'learning' && session ? recommendedUTNode(session, goal.rootId) : '')} />;
  const foundationCards = <section className="ut-foundations" id="ut-foundations" aria-labelledby="ut-foundation-heading">
    <h3 className="ut-section-title" id="ut-foundation-heading">기초 확인 문제</h3>
    <p className="plm-live-muted">필요한 개념을 골라 짧은 문제로 확인해 보세요.</p>
    <div className="ut-foundation-list">{SKILLS.map(skill => {
      const summary = session && runSummary(session.pre, skill);
      const confirmed = diagnostic[`c-${skill}`] === 'passed';
      const available = stage === 'learning';
      return <button key={skill} type="button" className={confirmed ? 'is-confirmed' : ''} onClick={() => beginLearning(FOUNDATION_ROOTS[skill])} disabled={!available}>
        <span className="ut-foundation-top"><span className="ut-foundation-name">{LABELS[skill]}</span><span className="ut-foundation-arrow" aria-hidden="true">→</span></span>
        <span className="ut-foundation-status">{confirmed ? '기초 확인 완료' : stage === 'pre' ? '테스트 후 열려요' : stage === 'done' || stage === 'post' ? '학습 종료' : '기초 확인 필요'}</span>
        <small>{summary?.complete ? `사전 테스트 ${summary.correct}/${summary.total} 정답` : '사전 테스트 진행 전'}</small>
      </button>;
    })}</div>
  </section>;
  const homeNotice = notice && <p className="plm-live-notice ut-home-notice" role="status">{notice}</p>;
  const participantFooter = <footer className="ut-participants">
    {demo && !!store.sessions.length && <label>참가자 선택 <select aria-label="참가자 선택" value={store.activeId ?? ''} onChange={event => { update(pauseTimer); setStore(previous => ({ ...previous, activeId: event.target.value })); setAnswer(''); setSelectedGoal('bn-1'); setNotice(''); }}>{store.sessions.map(item => <option key={item.id} value={item.id}>{item.participant} · {item.stage === 'done' ? '완료' : '진행 중'}</option>)}</select></label>}
    {session && <button type="button" className="ut-new-participant" disabled={blocked} onClick={() => { goHome(); resetEntry(); }}>새 참가자로 시작 <span aria-hidden="true">→</span></button>}
  </footer>;
  const comparison = session && <Comparison session={session} />;
  return <div className="plm-live-preview ut-preview"><MainLayout showTagCatalog={false} activePath="/main/home" onNavigate={path => { goHome(); if (path === '/main/ai-concept') setNotice('홈 아래의 기초 확인 문제에서 개념 학습을 시작할 수 있어요.'); if (path === '/main/mypage') setNotice('참가자를 바꾸려면 홈 아래의 ‘새 참가자로 시작’을 눌러 주세요.'); }}>
    <main ref={mainRef} tabIndex={-1} data-screen={`ut1-${view}`}>
      {connectionNotice}
      <fieldset disabled={server && blocked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {notice && (view !== 'home' || !session) && <p className="plm-live-notice" role="status">{notice}</p>}
      {view === 'home' ? <>
        {!session ? <section className="ut-registration" style={card}><h1>중복조합 학습</h1><p>학습 전 테스트를 보고, 다섯 문제를 풀어본 뒤 다시 확인해요.</p>
          <label>닉네임<input aria-label="닉네임" value={name} onChange={event => setName(event.target.value)} placeholder="사용할 닉네임" maxLength={40} /></label>
          <button style={primary} disabled={blocked || !validUTNickname(name)} onClick={newParticipant}>시작하기 →</button></section>
          : <HomeDashboard nickname={session.participant} notice={homeNotice} footer={participantFooter} recommendation={stage === 'learning' && (remaining.length || state) ? <CurriculumListSection
            items={[{ id: recommendationGoal.id, topicName: preparing ? UT_NODES[recommendationNode].label : recommendationGoal.title,
              categoryPath: preparing ? '목표 문제를 위한 기초 학습' : UT_NODES[recommendationGoal.rootId].kind === 'BN' ? `중복조합 · 목표 문제 ${UT_GOALS.findIndex(item => item.id === recommendationGoal.id) + 1}` : '기초 확인 문제', problemCount: 1,
              reasoning: preparing ? '사전 테스트에서 확인하지 못한 기초부터 학습해요. 확인 문제를 풀면 다음 개념으로 이어져요.' : '필요한 기초가 확인됐어요. 이제 목표 문제에 적용해 보세요.' }]}
            activeId={recommendationGoal.id} showReasoning actionLabel={state ? '학습 이어가기' : preparing ? '기초부터 학습' : '문제 풀기'} onSolveClick={() => beginLearning(recommendationGoal.id)} />
            : <section style={card}><h3 className="ut-section-title">{stage === 'done' ? '학습 결과' : stage === 'pre' ? '학습 전 레벨테스트' : '학습 후 레벨테스트'}</h3>
              <p className="plm-live-muted">{stage === 'done' ? '학습 전후 정답률과 풀이 시간을 비교해 보세요.' : stage === 'pre' ? '5개 개념 · 10문항. 답은 숫자로 적어 주세요.' : '같은 유형의 10문항을 숫자를 바꿔 다시 풀어요.'}</p>
              <button style={primary} onClick={() => { if (stage === 'done') setView('results'); else if (stage === 'learning') { update(value => resumeTest(beginPost(value))); setView('test'); } else beginTest(); }}>
                {stage === 'done' ? '결과 보기 →' : run?.responses.length ? `${run.responses.length + 1}번부터 이어서 →` : '테스트 시작 →'}</button></section>}
            feedback={<section style={card}><h3 className="ut-section-title">이번 학습</h3><ol className="ut-flow-list"><li className={stage === 'pre' ? 'is-current' : ''}>학습 전 테스트 <small>{session.pre.responses.length}/10</small></li><li className={stage === 'learning' ? 'is-current' : ''}>중복조합 문제 학습 <small>{session.completed.length}/5</small></li><li className={stage === 'post' ? 'is-current' : ''}>학습 후 테스트 <small>{session.post.responses.length}/10</small></li></ol><p className="plm-live-muted">테스트 중에는 해설을 보여주지 않아요. ‘모르겠습니다’도 기록돼요.</p></section>}
            reviewItems={stage === 'learning' ? SKILLS.filter(skill => diagnostic[`c-${skill}`] !== 'passed').map((skill, i) => ({ id: i, topicName: LABELS[skill], categoryName: '학습 전 테스트에서 확인할 개념' })) : []}
            onReviewSeeAll={() => setNotice('아래의 기초 확인 문제에서 다섯 개념을 모두 살펴볼 수 있어요.')}
            onReviewItemClick={item => { const skill = SKILLS.find(skill => LABELS[skill] === item.topicName); if (skill) beginLearning(FOUNDATION_ROOTS[skill]); }}
            progressPercent={session.completed.length / 5} progressLabel={`목표 문제 ${session.completed.length}/5 해결`} progressHeading="님의 이번 학습"
            todaySolvedCount={session.pre.responses.length + session.post.responses.length + session.history.length + (state?.history.length ?? 0)} streakDays={0}
            maps={<>
              <section style={card} className="plm-home-map"><div className="plm-section-row"><h3 className="ut-section-title">문제 지도</h3><button style={textButton} onClick={openMap}>크게 보기 →</button></div>
                <div className="ut-goal-tabs">{UT_GOALS.map((item, i) => <button key={item.id} className={goal.id === item.id ? 'is-current' : ''} onClick={() => { if (state && state.goalId !== item.id) { setNotice('학습 중인 지도를 보여주고 있어요. 문제를 마치면 다른 목표를 선택할 수 있어요.'); return; } setSelectedGoal(item.id); }}>
                  <span>{session.completed.includes(item.id) ? '✓' : i + 1}</span>{item.title}</button>)}</div>
                {map}<div className="plm-live-legend"><span><i style={{ background: colors.brand600 }} />현재</span><span><i style={{ background: colors.green500 }} />확인·해결</span><span><i style={{ background: '#ef4444' }} />학습 필요</span><span><i style={{ background: colors.gray300 }} />미확인</span></div>
                <div className="plm-section-row"><span className="plm-live-muted">사전 결과 → 필요한 개념·확인 문제 → BN 목표</span><button style={{ ...textButton, color: colors.brand600 }} disabled={stage !== 'learning' || session.completed.includes(goal.id)} onClick={() => beginLearning(goal.rootId)}>학습 시작 →</button></div></section>
              {foundationCards}
            </>} />}
      </> : view === 'test' && question && session ? <section className="plm-live-solver ut-test" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="plm-section-row"><button style={textButton} onClick={goHome}>← 잠시 나가기</button><span className="plm-live-muted">{stage === 'pre' ? '학습 전' : '학습 후'} · {run!.responses.length + 1} / 10</span></div>
        <progress className="ut-progress" value={run!.responses.length} max={10} aria-label="테스트 진행도" />
        <ProblemQuestionCard tagLabel={LABELS[question.skill]} problem={{ description: question.prompt, answerType: 'NUMBER' }} value="" onChange={() => {}} />
        <NumericAnswer value={answer} onChange={setAnswer} onSubmit={() => submit(answer)} />
        {answer && !isNumericAnswer(answer) && <p className="plm-live-muted">0 이상의 정수를 입력해 주세요.</p>}
        <div className="plm-live-actions"><button style={textButton} onClick={() => submit(null)}>모르겠습니다</button><button style={primary} disabled={!isNumericAnswer(answer)} onClick={() => submit(answer)}>다음 →</button></div>
      </section> : view === 'study' && state && node && learningQ ? <section className="plm-live-solver" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="plm-section-row" style={{ marginBottom: 24 }}><button style={textButton} onClick={goHome}>← 나가기</button><button style={textButton} onClick={openMap}>문제 지도 보기 →</button></div>
        {state.complete ? <><div className="plm-live-result"><span>✓</span><h2>{node.kind === 'BN' ? '목표 문제를 풀었어요' : '기초 확인을 마쳤어요'}</h2><p>{goal.title}</p></div><div className="ut-completion-map">{map}</div><button style={{ ...primary, width: '100%' }} onClick={finishGoal}>홈으로 →</button></>
          : <><div className="plm-live-path">{[...state.parents, state.currentId].map((id, index) => <span key={`${id}-${index}`} className={id === state.currentId ? 'is-current' : ''}>{index > 0 && '› '}{UT_NODES[id].label}</span>)}</div>
            {!!state.preparation?.length && <p className="plm-live-muted">목표: {goal.title} · 필요한 기초를 확인하고 목표 문제로 이어져요.</p>}
            {state.reading ? <ConceptLesson key={`${session?.id}:${state.currentId}:${state.attempts[state.currentId] ?? 0}`} nodeId={state.currentId} retry={(state.attempts[state.currentId] ?? 0) > 0}
              onContinue={() => update(value => value.learning ? { ...value, learning: { ...value.learning, reading: false, startedAt: Date.now() } } : value)} />
              : <><ProblemQuestionCard tagLabel={`${node.kind === 'BN' ? '목표 문제' : node.kind === 'AN' ? '확인 문제' : '개념 확인'} · ${node.label}${(state.attempts[state.currentId] ?? 0) > 0 ? ' · 숫자를 바꾼 문제' : ''}`}
                problem={{ description: learningQ.prompt, answerType: 'NUMBER' }} value="" onChange={() => {}} />
                <NumericAnswer value={answer} onChange={setAnswer} onSubmit={() => submitLearning(answer)} disabled={!!state.feedback} />
                {!state.feedback ? <div className="plm-live-actions"><button style={textButton} onClick={() => submitLearning(null)}>모르겠습니다</button><button style={primary} disabled={!isNumericAnswer(answer)} onClick={() => submitLearning(answer)}>확인 →</button></div>
                  : <div className={`plm-live-feedback ut-feedback ${state.feedback === 'correct' ? 'is-correct' : ''}`} role="status"><strong>{state.feedback === 'correct' ? '맞았어요' : '이 부분부터 확인해 볼까요?'}</strong>
                    {state.feedback === 'correct' ? <div className="plm-live-muted"><ProblemContent content={learningQ.explanation} /></div> : <>
                      {retryingHere && node.kind !== 'concept' && <div className="plm-live-muted"><ProblemContent content={learningQ.explanation} /></div>}
                      <p className="plm-live-muted">{retryingHere ? node.kind === 'concept' ? '개념을 다시 살펴보고 숫자가 바뀐 문제를 풀어요.' : '풀이를 확인하고 숫자가 바뀐 문제로 다시 풀어봐요.' : '필요한 하위 문제를 풀고, 숫자가 바뀐 이 문제로 다시 돌아와요.'}</p>
                    </>}
                    <button style={primary} onClick={nextLearning}>{state.feedback === 'correct' ? state.parents.length ? '상위 문제로 →' : state.preparation?.length ? '다음 학습 →' : '학습 마치기 →' : '이어서 학습 →'}</button></div>}
              </>}
          </>}
      </section> : view === 'map' ? <section style={card} className={`plm-live-full-map${passMap ? ' ut-pass-map' : ''}`}>
        {!passMap && <div className="plm-section-row"><button style={textButton} onClick={() => setView(mapReturn)}>← 돌아가기</button><h2 style={typography.headingXLBold}>{goal.title}</h2></div>}
        {map}
        {passMap && <div className="ut-pass-actions"><span role="status">✓ {node?.label}</span><button style={primary} onClick={nextLearning}>{afterPass?.complete ? '다음 목표 →' : afterPass && UT_NODES[afterPass.currentId].kind === 'concept' ? '다음 개념 →' : '다음 문제 →'}</button></div>}
      </section>
        : view === 'results' && session ? <section style={{ ...card, maxWidth: 1000, margin: '0 auto' }}><div className="plm-section-row"><h1 style={typography.headingXLBold}>학습 전후 결과</h1><button style={textButton} onClick={goHome}>홈으로 →</button></div>{comparison}<p className="plm-live-muted">숫자가 다른 동일 유형에서의 변화예요. 이 수치만으로 학습 효과 전체를 단정하지 않아요.</p></section> : <section style={card}><p>테스트를 마쳤어요.</p><button style={primary} onClick={goHome}>홈으로 →</button></section>}
      </fieldset>
    </main>
  </MainLayout></div>;
}

export function UT1AdminPreviewPage() {
  const location = useLocation(); const demo = new URLSearchParams(location.search).get('demo') === '1';
  const { store, error } = useLocalUT(`${UT_STORAGE_KEY}${demo ? ':demo' : ''}`, true); const [selected, setSelected] = useState<string | null>(null);
  const session = store.sessions.find(item => item.id === selected);
  const complete = store.sessions.filter(item => item.stage === 'done');
  const meanGain = complete.length ? complete.reduce((sum, item) => sum + (gain(item) ?? 0), 0) / complete.length : null;
  return <div className="plm-live-preview ut-preview ut-admin"><header className="ut-admin-header"><Link to={`/dev/ut1${demo ? '?demo=1' : ''}`}>← 학습 화면</Link><span>{demo ? '데모 통계 · 실제 UT와 별도' : '1차 UT · 로컬 관리자 미리보기'}</span></header>
    <main><h1>학습 전후 비교</h1><p className="plm-live-muted">로컬 참가자 {store.sessions.length}명 · 전후 완료 {complete.length}명 · 완료자 평균 변화 {signed(meanGain)}<br />이 브라우저의 기록만 표시합니다. 실제 UID·서버 통계가 아닙니다.</p>
      {error && <p role="alert" className="ut-error">{error}</p>}
      <div className="ut-table-scroll"><table><thead><tr><th>참가자</th><th>진행</th><th>학습 전</th><th>학습 후</th><th>정답률 변화</th><th>평균 시간 · 전 / 후</th><th>기록</th></tr></thead><tbody>
        {store.sessions.map(item => { const pre = runSummary(item.pre); const post = runSummary(item.post); return <tr key={item.id}><th>{item.participant}<small className="ut-table-sub">{new Date(item.createdAt).toLocaleString('ko-KR')} · {item.pre.form}→{item.post.form}</small></th>
          <td>{item.stage === 'done' ? '완료' : item.stage === 'pre' ? `사전 ${pre.answered}/10` : item.stage === 'post' ? `사후 ${post.answered}/10` : `학습 ${item.completed.length}/5`}</td>
          <td>{pre.accuracy === null ? '—' : `${pre.accuracy.toFixed(0)}% (${pre.correct}/10)`}</td><td>{post.accuracy === null ? '—' : `${post.accuracy.toFixed(0)}% (${post.correct}/10)`}</td><td>{signed(gain(item))}</td><td>{seconds(pre.average)} / {seconds(post.average)}</td>
          <td><button style={{ ...textButton, color: colors.brand600 }} onClick={() => setSelected(item.id)}>보기 →</button></td></tr>; })}
      </tbody></table>{!store.sessions.length && <p className="plm-live-muted">학습 화면에서 참가자를 만들면 기록이 표시돼요.</p>}</div>
      {session && <section style={card} className="ut-admin-detail"><h2>{session.participant} · 문항별 기록</h2><Comparison session={session} />
        <h3>학습 전 / 학습 후 답안</h3><div className="ut-table-scroll"><table><thead><tr><th>문항</th><th>숫자 · 전 / 후</th><th>입력 답안 · 전 / 후</th><th>정답 · 전 / 후</th><th>판정 · 전 / 후</th><th>시간 · 전 / 후</th></tr></thead><tbody>
          {session.pre.questions.map((question, i) => { const a = session.pre.responses[i]; const b = session.post.responses[i]; const post = session.post.questions[i];
            const answerText = (response: typeof a | undefined) => !response ? '미응답' : response.answer === null ? '모르겠습니다' : response.answer;
            const verdict = (response: typeof a | undefined) => !response ? '—' : response.correct ? '정답' : response.answer === null ? '모름' : '오답';
            return <tr key={question.id}><th>{i + 1}. {LABELS[question.skill]}<details><summary>문제 내용</summary><ProblemContent content={`학습 전: ${question.prompt}\n\n학습 후: ${post.prompt}`} /></details></th><td>{question.params.join(', ')} / {post.params.join(', ')}</td><td>{answerText(a)} / {answerText(b)}</td><td>{question.answer} / {post.answer}</td><td>{verdict(a)} / {verdict(b)}</td><td>{seconds(a?.seconds ?? null)} / {seconds(b?.seconds ?? null)}</td></tr>; })}
        </tbody></table></div>
        <h3>학습 중 경로</h3><p className="plm-live-muted">목표 문제 {session.completed.length}/5 · 하위 문제·개념 확인을 포함한 제출 {(session.history.length + (session.learning?.history.length ?? 0))}회</p>
        <div className="ut-table-scroll"><table><thead><tr><th>순서</th><th>문제 / 개념</th><th>변형</th><th>답안</th><th>판정</th><th>시간</th></tr></thead><tbody>{[...session.history, ...(session.learning?.history ?? [])].map((record, i) => <tr key={i}><td>{i + 1}</td><th>{UT_NODES[record.nodeId]?.label ?? record.nodeId}</th><td>{record.variant === 0 ? '첫 문제' : `변형 ${record.variant}`}</td><td>{record.answer ?? '모르겠습니다'}</td><td>{record.correct ? '정답' : record.answer === null ? '모름' : '오답'}</td><td>{seconds(record.seconds)}</td></tr>)}</tbody></table></div>
      </section>}
      <p className="plm-live-muted">시간은 문제 화면이 열린 동안 측정합니다. 숨긴 탭·홈·지도·개념 설명 시간은 제외하며, 새로고침 시 마지막 저장 시점(최대 2초 전)부터 이어집니다. 정답률은 ‘모르겠습니다’를 포함한 10문항 기준. A/B 순서는 참가자별로 교대합니다.</p>
    </main>
  </div>;
}
