import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import HomeDashboard from '../../components/home/HomeDashboard';
import CurriculumListSection from '../../components/home/CurriculumListSection';
import ProblemQuestionCard from '../../components/ProblemQuestionCard';
import ProblemContent from '../../components/ProblemContent';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import ProblemLearningMap from './ProblemLearningMap';
import ConditionalConceptLesson from './ConditionalConceptLesson';
import { CONDITIONAL_GOALS, CONDITIONAL_NODES, parseProbabilityAnswer } from './conditionalProblemBreakdown';
import useUT2Server from './useUT2Server';
import { ut2Score, type UT2Session } from './ut2ServerApi';
import { ut1Api } from './ut1ServerApi';
import './LevelTestMapPreviewPage.css';
import './ProblemLearningPreviewPage.css';
import './UT1PreviewPage.css';
import './UT2Page.css';

type Remote = ReturnType<typeof useUT2Server>;
type View = 'home' | 'test' | 'study' | 'map' | 'results';
const card = { padding: spacing.xl, background: colors.white, borderRadius: radius.lg };
const primary = { padding: '14px 24px', background: colors.brand600, color: colors.white, border: 'none', borderRadius: radius.sm,
  ...typography.bodyTextXLSemiBold, fontSize: 16, cursor: 'pointer' };
const textButton = { border: 'none', background: 'none', color: colors.gray500, fontSize: 14, cursor: 'pointer', padding: 0 };
const CONCEPT_IDS = Object.values(CONDITIONAL_NODES).filter(n => n.kind === 'concept').map(n => n.id);
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
  const navigate = useNavigate();
  const entryPassword = typeof location.state?.entryPassword === 'string' ? location.state.entryPassword : '';
  const [password, setPassword] = useState(entryPassword);
  const [nickname, setNickname] = useState('');
  const [entered, setEntered] = useState(!!entryPassword);
  const [registration, setRegistration] = useState(!!entryPassword);
  const [entryBusy, setEntryBusy] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [view, setView] = useState<View>('home');
  const [mapReturn, setMapReturn] = useState<View>('home');
  const [passedNode, setPassedNode] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(CONDITIONAL_GOALS[0].id);
  const main = useRef<HTMLElement>(null);
  const s = remote.reply?.session;
  useEffect(() => { main.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [view, s?.stage, s?.pre.responses.length, s?.post.responses.length, s?.learningNode]);
  const blocked = remote.loading || remote.busy || remote.hasPending || remote.blocked;
  function goHome() { setView('home'); setPassedNode(null); setNotice(''); }
  function openMap() { setMapReturn(view); setPassedNode(null); setView('map'); }
  function alignGoal(id: string) {
    if (!CONDITIONAL_GOALS.find(g => g.id === selectedGoal)!.positions[id]) setSelectedGoal(CONDITIONAL_GOALS.find(g => g.positions[id])!.id);
  }
  async function enter() {
    if (entryBusy) return;
    setEntryBusy(true); setEntryError('');
    try {
      if (password !== 'abcd') {
        await ut1Api(import.meta.env.PROD ? '/api/v1' : import.meta.env.VITE_UT1_API_BASE_URL || '/api/v1').enter(password);
        navigate('/ut1', { state: { entryPassword: password }, replace: true });
        return;
      }
      await remote.enter(password); setEntered(true);
    }
    catch (e) { setEntryError(e instanceof Error ? e.message : '입장하지 못했어요.'); }
    finally { setEntryBusy(false); }
  }
  async function open(id: string) {
    if (blocked || s?.stage !== 'learning') return;
    const next = await remote.act({ type: 'open', nodeId: id });
    if (next) {
      alignGoal(id); setPassedNode(null); setView('study'); setNotice('');
    }
  }
  async function createParticipant() {
    const next = await remote.create(nickname.trim(), password);
    if (next) { setRegistration(false); setPassword(''); setNickname(''); setNotice(''); setView('test'); }
  }
  function afterAssessment(next: UT2Session) {
    if (next.stage === 'learning') { setView('home'); setNotice('사전 테스트가 끝났어요. 결과에 맞춰 필요한 기초부터 학습해요.'); }
    else if (next.stage === 'done') setView('results');
  }
  function afterPass(id: string) { alignGoal(id); setPassedNode(id); setMapReturn('home'); setView('map'); }
  async function startPost() {
    const next = await remote.act({ type: 'post' });
    if (next) { setNotice(''); setView('test'); }
  }
  const connectionNotice = <>
    {(remote.error || entryError) && <div className="ut-error ut-connection-notice" role="alert"><p>{remote.error || entryError}</p><div className="ut-connection-actions">{remote.hasPending ? <button className="ut-new-session-button" disabled={remote.busy} onClick={async () => {
      const next = await remote.retry(); if (!next) return;
      if (next.session.stage === 'pre' || next.session.stage === 'post') setView('test');
      else if (next.session.stage === 'done') setView('results');
      else if (next.session.feedback) { alignGoal(next.session.learningNode!); setView('study'); }
      else if (view === 'study' && s?.learningNode) afterPass(s.learningNode);
      else setView('home');
    }}>다시 저장</button> : remote.error && <button className="ut-reconnect-button" onClick={() => window.location.reload()}>다시 연결</button>}</div></div>}
    {remote.conflict && <div className="ut-error"><p>다른 탭을 닫고 이어가세요. 미저장 답안은 이 기기에 별도 보관합니다.</p><button style={textButton} disabled={remote.busy} onClick={async () => { await remote.recoverConflict(); goHome(); }}>다른 탭 기록으로 이어가기</button></div>}
  </>;
  if (!s || registration) return <div className="ut-preview ut-entry"><main className="ut-registration" style={card}>
    <div className="ut-entry-brand">수확행</div>
    <h1>{entered ? '닉네임을 알려주세요' : '학습 체험하기'}</h1>
    <p>{entered ? '이 닉네임으로 학습 전후 기록을 남겨요.' : '안내받은 입장 암호를 입력해 주세요.'}</p>
    {connectionNotice}
    {remote.loading ? <p role="status">기록을 불러오는 중…</p> : <>
        {entered && <p className="plm-live-muted">조건부확률 학습 · 개념 10문항과 기출형 3문항을 먼저 확인해요. 닉네임, 답안, 풀이 시간과 학습 기록이 서버에 저장돼요.</p>}
        <form onSubmit={e => { e.preventDefault(); if (entered) void createParticipant(); else void enter(); }}>
          <label>{entered ? '닉네임' : '입장 암호'}<input autoFocus key={String(entered)} type={entered ? 'text' : 'password'} autoComplete="off" aria-label={entered ? '닉네임' : '입장 암호'} maxLength={entered ? 40 : 100} value={entered ? nickname : password} onChange={e => entered ? setNickname(e.target.value) : setPassword(e.target.value)} placeholder={entered ? '사용할 닉네임' : undefined} /></label>
          <button style={primary} disabled={blocked || entryBusy || (entered ? !nickname.trim() : !password)}>{remote.busy || entryBusy ? '확인 중…' : entered ? '레벨테스트 시작 →' : '다음 →'}</button>
        </form>
        {entered && s && <div className="ut-entry-resume"><p>이전 학습 이어하기</p><button style={textButton} disabled={blocked || entryBusy} onClick={() => { setRegistration(false); setPassword(''); goHome(); }}>{s.participant} · 이어하기 →</button></div>}
    </>}
  </main></div>;
  const phase = s.stage === 'pre' || s.stage === 'post';
  const goal = CONDITIONAL_GOALS.find(g => g.id === selectedGoal)!;
  return <div className="plm-live-preview ut-preview ut2-preview"><MainLayout showTagCatalog={false} activePath="/main/home" onNavigate={path => {
    goHome();
    if (path === '/main/ai-concept') setNotice('홈 아래의 기초 확인 문제에서 개념 학습을 시작할 수 있어요.');
    if (path === '/main/mypage') setNotice('참가자를 바꾸려면 홈 아래의 ‘새 참가자로 시작’을 눌러 주세요.');
  }}><main ref={main} tabIndex={-1} data-screen={`ut2-${view}`}>
    {connectionNotice}
    <fieldset disabled={blocked} className="ut2-content">
      {view === 'home' ? <UT2Dashboard session={s} selectedGoal={selectedGoal} onSelectGoal={setSelectedGoal} notice={notice} blocked={blocked} onOpen={id => void open(id)} onMap={openMap}
        onTest={() => { if (s.stage === 'learning') void startPost(); else setView('test'); }} onResults={() => setView('results')}
        onStartNew={() => {
          if (!remote.startNew()) return;
          setRegistration(true); setEntered(false); setPassword(''); setNickname(''); setEntryError(''); goHome();
        }} />
        : view === 'test' && phase && s.question ? <Assessment key={`${s.id}:${s.stage}:${s[s.stage as 'pre' | 'post'].responses.length}`} session={s} remote={remote} onHome={goHome} onAdvance={afterAssessment} />
          : view === 'study' && s.stage === 'learning' && s.learningNode ? <Study key={`${s.learningNode}:${s.attempts[s.learningNode] || 0}:${!!s.feedback}`} session={s} remote={remote} onHome={goHome} onMap={openMap} onPass={afterPass} />
            : view === 'map' ? <section style={card} className={`plm-live-full-map${passedNode ? ' ut-pass-map' : ''}`}>
              <div className="plm-section-row"><button style={textButton} onClick={() => { setPassedNode(null); setView(mapReturn); }}>← 돌아가기</button><h2 style={typography.headingXLBold}>{goal.title}</h2></div>
              <UT2Map session={s} goalId={selectedGoal} currentId={passedNode ? '' : s.learningNode || s.recommended || ''} onOpen={s.stage === 'learning' ? id => void open(id) : undefined} />
              {passedNode && <div className="ut-pass-actions"><span role="status">✓ {CONDITIONAL_NODES[passedNode].label}</span>{s.recommended ? <button style={primary} onClick={() => void open(s.recommended!)}>다음 {CONDITIONAL_NODES[s.recommended].kind === 'concept' ? '개념' : '문제'} →</button> : <button style={primary} onClick={goHome}>홈으로 →</button>}</div>}
            </section> : view === 'results' && s.stage === 'done' ? <section style={{ ...card, maxWidth: 1000, margin: '0 auto' }}><div className="plm-section-row"><h1 style={typography.headingXLBold}>학습 전후 결과</h1><button style={textButton} onClick={goHome}>홈으로 →</button></div><Comparison session={s} /><p className="plm-live-muted">숫자가 다른 동일 유형에서의 변화예요. 이 수치만으로 서비스의 인과 효과를 단정하지 않아요.</p></section>
              : <section style={card}><p>현재 학습 단계로 돌아가 주세요.</p><button style={primary} onClick={goHome}>홈으로 →</button></section>}
    </fieldset>
  </main></MainLayout></div>;
}

export function UT2Map({ session: s, goalId, currentId, onOpen }: { session: UT2Session; goalId: string; currentId: string; onOpen?: (id: string) => void }) {
  const goal = CONDITIONAL_GOALS.find(g => g.id === goalId)!;
  return <ProblemLearningMap goal={goal} nodes={CONDITIONAL_NODES} state={{ results: Object.fromEntries(Object.entries(s.results).filter(([id]) => s.history.some(r => r.nodeId === id))), complete: s.completed.includes(goal.rootId) }}
    diagnostic={s.stage === 'pre' ? {} : Object.fromEntries(CONCEPT_IDS.map(id => [id, s.weak.includes(id) ? 'failed' : 'passed']))} currentId={currentId}
    columnGap={260} horizontalPadding={54} onSelectNode={onOpen} kindLabels={{ BN: '기출 · 목표', AN: 'AN · 확인', concept: '개념' }} />;
}

export function UT2Dashboard({ session: s, selectedGoal, onSelectGoal, notice, blocked, onOpen, onMap, onTest, onResults, onStartNew }: {
  session: UT2Session; selectedGoal: string; onSelectGoal: (id: string) => void; notice: string; blocked: boolean; onOpen: (id: string) => void;
  onMap: () => void; onTest: () => void; onResults: () => void; onStartNew: () => void;
}) {
  const goal = CONDITIONAL_GOALS.find(g => g.id === selectedGoal)!;
  const recommended = s.recommended && CONDITIONAL_NODES[s.recommended];
  const learning = s.stage === 'learning';
  const readyPost = learning && s.completed.length === 3 && !s.recommended;
  const run = s.stage === 'post' ? s.post : s.pre;
  return <HomeDashboard nickname={s.participant} notice={notice && <p className="plm-live-notice ut-home-notice" role="status">{notice}</p>}
    recommendation={learning && recommended ? <CurriculumListSection items={[{ id: recommended.id, topicName: recommended.label,
      categoryPath: recommended.kind === 'concept' ? '목표 문제를 위한 기초 학습' : '조건부확률 · 목표 기출문제', problemCount: 1,
      reasoning: recommended.kind === 'concept' ? '사전 테스트에서 확인하지 못한 기초부터 학습해요. 확인 문제를 풀면 다음 개념으로 이어져요.' : '필요한 기초를 목표 문제에 적용해 보세요. 막히면 하위 문제부터 확인해요.' }]}
      activeId={recommended.id} showReasoning actionLabel={s.feedback ? '학습 이어가기' : recommended.kind === 'concept' ? '기초부터 학습' : '문제 풀기'} onSolveClick={() => onOpen(recommended.id)} />
      : <section style={card}><h3 className="ut-section-title">{s.stage === 'done' ? '학습 결과' : s.stage === 'pre' ? '학습 전 레벨테스트' : '학습 후 레벨테스트'}</h3>
        <p className="plm-live-muted">{s.stage === 'done' ? '학습 전후 정답률과 풀이 시간을 비교해 보세요.' : readyPost ? '기초 확인과 기출 3문제 학습을 마쳤어요. 숫자를 바꾼 문제로 다시 확인해요.' : '개념 10문항 · 기출형 3문항. 답은 분수 또는 소수로 적어 주세요.'}</p>
        <button style={primary} disabled={blocked} onClick={s.stage === 'done' ? onResults : onTest}>{s.stage === 'done' ? '결과 보기 →' : readyPost ? '학습 후 테스트 시작 →' : run.responses.length ? `${run.responses.length + 1}번부터 이어서 →` : '테스트 시작 →'}</button>
      </section>}
    feedback={<section style={card}><h3 className="ut-section-title">이번 학습</h3><ol className="ut-flow-list" aria-label="학습 진행 단계"><li className={s.stage === 'pre' ? 'is-current' : ''}>학습 전 테스트 <small>{s.pre.responses.length}/13</small></li><li className={learning ? 'is-current' : ''}>조건부확률 문제 학습 <small>{s.completed.length}/3</small></li><li className={s.stage === 'post' ? 'is-current' : ''}>학습 후 테스트 <small>{s.post.responses.length}/13</small></li></ol><p className="plm-live-muted">테스트 중에는 해설을 보여주지 않아요. ‘모르겠습니다’도 기록돼요.</p></section>}
    reviewItems={learning ? s.weak.filter(id => s.results[id] !== 'passed').map((id, index) => ({ id: index, topicName: CONDITIONAL_NODES[id].label, categoryName: '학습 전 테스트에서 확인할 개념' })) : []}
    onReviewSeeAll={() => document.getElementById('ut2-foundations')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
    onReviewItemClick={item => { const id = CONCEPT_IDS.find(id => CONDITIONAL_NODES[id].label === item.topicName); if (id && !blocked) onOpen(id); }}
    progressPercent={s.completed.length / 3} progressLabel={`목표 문제 ${s.completed.length}/3 해결`} progressHeading="님의 이번 학습"
    todaySolvedCount={s.pre.responses.length + s.post.responses.length + s.history.length} streakDays={0}
    footer={<footer className="ut-participants"><button className="ut-new-participant" disabled={blocked} onClick={onStartNew}>새 참가자로 시작 <span aria-hidden="true">→</span></button></footer>}
    maps={<>
      <section style={card} className="plm-home-map"><div className="plm-section-row"><h3 className="ut-section-title">문제 지도</h3><button style={textButton} onClick={onMap}>크게 보기 →</button></div>
        <div className="ut-goal-tabs" role="tablist" aria-label="기출 문제 선택">{CONDITIONAL_GOALS.map((item, i) => <button key={item.id} role="tab" aria-selected={goal.id === item.id} className={goal.id === item.id ? 'is-current' : ''} onClick={() => onSelectGoal(item.id)}><span>{s.completed.includes(item.rootId) ? '✓' : i + 1}</span>{item.title}</button>)}</div>
        <UT2Map session={s} goalId={selectedGoal} currentId={learning ? s.learningNode || s.recommended || '' : ''} onOpen={learning && !blocked ? onOpen : undefined} />
        <div className="plm-live-legend"><span><i style={{ background: colors.brand600 }} />현재</span><span><i style={{ background: colors.green500 }} />확인·해결</span><span><i style={{ background: colors.red500 }} />학습 필요</span><span><i style={{ background: colors.gray300 }} />미확인</span></div>
        <div className="plm-section-row"><span className="plm-live-muted">사전 결과 → 필요한 개념·확인 문제 → 기출 목표</span><button style={{ ...textButton, color: colors.brand600 }} disabled={blocked || !learning || s.completed.includes(goal.rootId)} onClick={() => onOpen(goal.rootId)}>학습 시작 →</button></div>
      </section>
      <section className="ut-foundations" id="ut2-foundations" aria-labelledby="ut2-foundation-heading"><h3 className="ut-section-title" id="ut2-foundation-heading">기초 확인 문제</h3><p className="plm-live-muted">필요한 개념을 골라 짧은 문제로 확인해 보세요.</p><div className="ut-foundation-list">{CONCEPT_IDS.map((id, index) => {
        const confirmed = s.stage !== 'pre' && s.results[id] === 'passed';
        const responses = s.pre.responses.slice(index * 2, index * 2 + 2);
        const diagnosed = responses.length === 2 && responses.every(r => typeof r.correct === 'boolean');
        return <button key={id} className={confirmed ? 'is-confirmed' : ''} disabled={blocked || !learning} onClick={() => onOpen(id)}><span className="ut-foundation-top"><span className="ut-foundation-name">{CONDITIONAL_NODES[id].label}</span><span className="ut-foundation-arrow" aria-hidden="true">→</span></span>
          <span className="ut-foundation-status">{confirmed ? '기초 확인 완료' : s.stage === 'pre' ? '테스트 후 열려요' : learning ? '기초 확인 필요' : '학습 종료'}</span><small>{diagnosed ? `사전 테스트 ${responses.filter(r => r.correct).length}/2 정답` : '사전 테스트 진행 중'}</small></button>;
      })}</div></section>
    </>} />;
}

export function Assessment({ session: s, remote, onHome, onAdvance }: { session: UT2Session; remote: Remote; onHome: () => void; onAdvance: (s: UT2Session) => void }) {
  const [answer, setAnswer] = useState('');
  const phase = s.stage as 'pre' | 'post';
  const clock = useQuestionTime(`${s.id}:${phase}:${s.question!.id}`);
  const send = async (unknown = false) => { const next = await remote.act({ type: 'answer', questionId: s.question!.id, answer: unknown ? null : answer, seconds: clock.seconds() }); if (next) onAdvance(next.session); };
  return <section className="plm-live-solver ut-test" style={{ maxWidth: 720, margin: '0 auto' }}><div className="plm-section-row"><button style={textButton} onClick={onHome}>← 잠시 나가기</button><span className="plm-live-muted">{phase === 'pre' ? '학습 전' : '학습 후'} · {s[phase].responses.length + 1} / {s[phase].total}</span></div>
    <progress className="ut-progress" value={s[phase].responses.length} max={s[phase].total} aria-label="테스트 진행도" />
    <p className="plm-live-muted">검사 중에는 정답과 힌트를 보여주지 않아요. 모르면 ‘모르겠습니다’를 눌러 주세요.</p>
    <ProblemQuestionCard tagLabel={`${s.question!.group === 'application' ? '응용' : '기초'} · ${CONDITIONAL_NODES[s.question!.nodeId || '']?.label || '조건부확률'}`} problem={{ description: s.question!.prompt, answerType: 'NUMBER' }} value="" onChange={() => {}} />
    {clock.error && <p role="alert">{clock.error}</p>}
    <AnswerForm answer={answer} setAnswer={setAnswer} disabled={remote.busy || remote.hasPending || !!clock.error} onSubmit={() => send()} onUnknown={() => send(true)} />
  </section>;
}
export function Study({ session: s, remote, onMap, onHome, onPass }: { session: UT2Session; remote: Remote; onMap: () => void; onHome: () => void; onPass: (id: string) => void }) {
  const id = s.learningNode!; const node = CONDITIONAL_NODES[id];
  const [reading, setReading] = useState(node.kind === 'concept' && !s.feedback);
  const [answer, setAnswer] = useState('');
  const clock = useQuestionTime(`${s.id}:learning:${id}:${s.attempts[id] || 0}`);
  const submit = async (unknown = false) => {
    const next = await remote.act({ type: 'answer', nodeId: id, variant: s.attempts[id] || 0, answer: unknown ? null : answer, seconds: clock.seconds() });
    if (next && !next.session.feedback) onPass(id);
  };
  return <section className="plm-live-solver" style={{ maxWidth: 760, margin: '0 auto' }}><div className="plm-section-row" style={{ marginBottom: 24 }}><button style={textButton} onClick={onHome}>← 나가기</button><button style={textButton} onClick={onMap}>문제 지도 보기 →</button></div>
    <div className="plm-live-path"><span>조건부확률</span><span className="is-current">› {node.label}</span></div>
    {reading ? <><h2 style={typography.headingXLBold}>{node.label}</h2><ConditionalConceptLesson nodeId={id} onConfirm={() => setReading(false)} /></> : <>
      <ProblemQuestionCard tagLabel={`${node.kind === 'BN' ? '목표 문제' : node.kind === 'AN' ? '확인 문제' : '개념 확인'} · ${node.label}${(s.attempts[id] || 0) > 0 && !s.feedback ? ' · 숫자를 바꾼 문제' : ''}`} problem={{ description: s.feedback?.prompt || s.question!.prompt, answerType: 'NUMBER' }} value="" onChange={() => {}} />
      {clock.error && <p role="alert">{clock.error}</p>}
      {s.feedback ? <div className="plm-live-feedback ut-feedback" role="status"><strong>{s.feedback.unknown ? '기초부터 확인해 볼까요?' : '필요한 부분을 다시 확인해요'}</strong>{s.feedback.explanation ? <div className="plm-live-muted"><ProblemContent content={s.feedback.explanation} /></div> : <p className="plm-live-muted">‘{CONDITIONAL_NODES[s.feedback.nextNode]?.label}’부터 확인한 뒤 이 문제로 돌아와요.</p>}<button style={primary} disabled={remote.busy || remote.hasPending} onClick={() => void remote.act({ type: 'continue' })}>{s.feedback.nextNode === id ? '숫자를 바꿔 다시 풀기 →' : '필요한 하위 학습으로 이어가기 →'}</button></div>
        : <><AnswerForm answer={answer} setAnswer={setAnswer} disabled={remote.busy || remote.hasPending || !!clock.error} onSubmit={() => void submit()} onUnknown={() => void submit(true)} />
          {node.kind === 'concept' && <button style={textButton} className="ut2-review-concept" onClick={() => setReading(true)}>개념 설명 다시 보기</button>}</>}
    </>}
  </section>;
}
function AnswerForm({ answer, setAnswer, disabled, onSubmit, onUnknown }: { answer: string; setAnswer: (v: string) => void; disabled: boolean; onSubmit: () => void; onUnknown: () => void }) {
  return <form onSubmit={e => { e.preventDefault(); if (!disabled && parseProbabilityAnswer(answer) !== null) onSubmit(); }}><label className="plm-number-answer">답안<input type="text" aria-label="답안" inputMode="text" autoComplete="off" maxLength={100} placeholder="분수 또는 소수 (예: 1/2)" value={answer} onChange={e => setAnswer(e.target.value)} disabled={disabled} /></label>
    <div className="plm-live-actions"><button style={textButton} type="button" disabled={disabled} onClick={onUnknown}>모르겠습니다</button><button style={primary} disabled={disabled || parseProbabilityAnswer(answer) === null}>다음 →</button></div></form>;
}
function Comparison({ session: s }: { session: UT2Session }) {
  return <div className="ut2-comparison"><table><thead><tr><th>구분</th><th>학습 전</th><th>학습 후</th><th>변화</th></tr></thead><tbody>{[[undefined, '전체'], ['foundation', '개념'], ['application', '기출형']].map(([group, label]) => {
    const pre = ut2Score(s.pre, group as 'foundation' | 'application' | undefined), post = ut2Score(s.post, group as 'foundation' | 'application' | undefined);
    const gain = pre.accuracy !== null && post.accuracy !== null ? post.accuracy - pre.accuracy : null;
    return <tr key={label}><th>{label}</th><td>{percent(pre.accuracy)}</td><td>{percent(post.accuracy)}</td><td>{gain === null ? '—' : `${gain > 0 ? '+' : ''}${gain.toFixed(0)}%p`}</td></tr>;
  })}<tr><th>평균 풀이 시간</th><td>{time(ut2Score(s.pre).average)}</td><td>{time(ut2Score(s.post).average)}</td><td>—</td></tr><tr><th>모름</th><td>{ut2Score(s.pre).unknown}</td><td>{ut2Score(s.post).unknown}</td><td>—</td></tr></tbody></table></div>;
}
