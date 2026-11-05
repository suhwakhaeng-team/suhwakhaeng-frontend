import UT5NodeReview from './UT5NodeReview';
import { UT5_TARGET_CHOICES } from './ut5TargetChoices';
import { UT5_HINTS } from './ut5Hints';
import { UT5Timer } from './ut5Timer';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import HomeDashboard from '../../components/home/HomeDashboard';
import { UT2SurveyForm } from '../../components/UT2SurveyForm';
import ProblemQuestionCard from '../../components/ProblemQuestionCard';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import ProblemLearningMap from './ProblemLearningMap';
import UT5ConceptLesson from './UT5ConceptLesson';
import { UT5_LEARNING_SUPPORT } from './ut5LearningSupport';
import { UT5_GOALS, UT5_MAPS, UT5_NODES, parseProbabilityAnswer } from './ut5Model';
import useUT5Server from './useUT5Server';
import { ut5Score, type UT5Session, type UT5Response } from './ut5ServerApi';
import './LevelTestMapPreviewPage.css';
import './ProblemLearningPreviewPage.css';
import './UT1PreviewPage.css';
import './UT4Page.css';
import './UT5Timing.css';
import './UT5Results.css';
import './UT4ConceptLesson.css';

type Remote = ReturnType<typeof useUT5Server>;
type View = 'home' | 'test-intro' | 'test' | 'study' | 'map' | 'results' | 'pre-results' | 'survey' | 'review';
const card = { padding: spacing.xl, background: colors.white, borderRadius: radius.lg };
const primary = { padding: '14px 24px', background: colors.brand600, color: colors.white, border: 'none', borderRadius: radius.sm,
  ...typography.bodyTextXLSemiBold, fontSize: 16, cursor: 'pointer' };
const textButton = { border: 'none', background: 'none', color: colors.gray500, fontSize: 14, cursor: 'pointer', padding: 0 };
const CONCEPT_IDS = Object.values(UT5_NODES).filter(n => n.kind === 'concept').map(n => n.id);
const percent = (n: number | null) => n === null ? '미완료' : `${n.toFixed(0)}%`;
const time = (n: number | null) => n === null ? '—' : `${n.toFixed(1)}초`;
function useQuestionTime(key: string, enabled = true) {
  const timer = useRef<UT5Timer | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [ready,setReady] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let cleanup = () => {};
    let release = () => {};
    const start = () => {
    if (cancelled) return;
    const fail = () => setError('시간 기록을 저장할 수 없어요. 저장 공간을 확인한 뒤 새로고침해 주세요.');
    try { timer.current = new UT5Timer(localStorage, `suhwakhaeng:ut5:time:${key}`); } catch { fail(); return; }
    const visibility = () => { try { if (document.hidden) timer.current!.pause(); else timer.current!.resume(); } catch { fail(); } };
    const pause = () => { try { timer.current!.pause(); } catch { fail(); } };
    visibility(); setReady(true);
    const interval = window.setInterval(() => { try { timer.current!.tick(); setSeconds(timer.current!.metrics().seconds); } catch { fail(); } }, 250);
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', pause);
    cleanup = () => { clearInterval(interval); pause(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pause); };
    };
    // Hold a participant-wide lock so two tabs cannot count the same question in parallel.
    const controller = new AbortController();
    const lockTimeout = window.setTimeout(() => controller.abort(), 500);
    if (navigator.locks) void navigator.locks.request(`ut5-timing:${key.split(':')[0]}`, { signal: controller.signal }, async () => {
      clearTimeout(lockTimeout);
      if (cancelled) return;
      start();
      await new Promise<void>(resolve => { release = resolve; });
    }).catch(() => { if (!cancelled) setError('다른 탭에서 검사가 열려 있어요. 그 탭을 닫은 뒤 새로고침해 주세요.'); });
    else setError('시간 측정을 위해 최신 Chrome 또는 Edge에서 열어 주세요.');
    return () => { cancelled = true; clearTimeout(lockTimeout); controller.abort(); cleanup(); release(); };
  }, [key, enabled]);
  return { seconds, error, ready, finish: () => { if (!timer.current || error) throw new Error('시간 측정기를 확인해 주세요.'); return timer.current.finish(); } };
}

export default function UT5Page() {
  const remote = useUT5Server();
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
  const [reviewNode,setReviewNode] = useState<string|null>(null);
  const [mapReturn, setMapReturn] = useState<View>('home');
  const [passedNode, setPassedNode] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(UT5_MAPS[0].id);
  const main = useRef<HTMLElement>(null);
  const s = remote.reply?.session;
  useEffect(() => { main.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [view, s?.stage, s?.pre.responses.length, s?.post.responses.length, s?.learningNode]);
  const blocked = remote.loading || remote.busy || remote.hasPending || remote.blocked;
  function goHome() { setView('home'); setPassedNode(null); setNotice(''); }
  function openMap() { setMapReturn(view); setPassedNode(null); setView('map'); }
  function alignGoal(id: string) {
    if (!UT5_MAPS.find(g => g.id === selectedGoal)!.positions[id]) setSelectedGoal(UT5_MAPS.find(g => g.positions[id])!.id);
  }
  async function enter() {
    if (entryBusy) return;
    setEntryBusy(true); setEntryError('');
    try {
      await remote.enter(password); setEntered(true);
    }
    catch (e) { setEntryError(e instanceof Error ? e.message : '입장하지 못했어요.'); }
    finally { setEntryBusy(false); }
  }
  async function open(id: string) {
    if (blocked || !s) return;
    if (s.stage === 'done') {alignGoal(id);setReviewNode(id);setMapReturn('home');setView('review');return;}
    if (s.stage !== 'learning') return;
    if (s.feedback?.nodeId === id) { alignGoal(id); setPassedNode(null); setView('study'); setNotice(''); return; }
    const next = await remote.act({ type: 'open', nodeId: id });
    if (next) {
      alignGoal(id); setPassedNode(null); setView('study'); setNotice('');
    }
  }
  async function createParticipant() {
    const next = await remote.create(nickname.trim(), password);
    if (next) { navigate('/ut5', { replace: true, state: null }); setRegistration(false); setPassword(''); setNickname(''); setNotice(''); setView('test-intro'); }
  }
  function afterAssessment(next: UT5Session) {
    if (next.stage === 'learning') { setView('pre-results'); setNotice(''); }
    else if (next.stage === 'done') setView('results');
  }
  function afterPass(id: string) { alignGoal(id); setPassedNode(id); setMapReturn('home'); setView('map'); }
  async function startPost() {
    const next = await remote.act({ type: 'post' });
    if (next) { setNotice(''); setView('test-intro'); }
  }
  const connectionNotice = <>
    {(remote.error || entryError) && <div className="ut-error ut-connection-notice" role="alert"><p>{remote.error || entryError}</p><div className="ut-connection-actions">{remote.hasPending ? <button className="ut-new-session-button" disabled={remote.busy} onClick={async () => {
      const next = await remote.retry(); if (!next) return;
      if (next.session.stage === 'pre' || next.session.stage === 'post') setView('test-intro');
      else if (next.session.stage === 'done') setView('results');
      else if (s?.stage === 'pre' && next.session.stage === 'learning') setView('pre-results');
      else if (next.session.feedback) { alignGoal(next.session.learningNode!); setView('study'); }
      else if (view === 'study' && s?.learningNode && next.session.history.length > s.history.length && next.session.history.at(-1)?.correct) afterPass(s.learningNode);
      else if (view === 'study') setView('study');
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
        {entered && <p className="plm-live-muted">확률과 통계 학습 · 진단 5문항을 먼저 확인해요. 닉네임, 답안, 풀이 시간과 학습 기록이 서버에 저장돼요.</p>}
        <form onSubmit={e => { e.preventDefault(); if (entered) void createParticipant(); else void enter(); }}>
          <label>{entered ? '닉네임' : '입장 암호'}<input autoFocus key={String(entered)} type={entered ? 'text' : 'password'} autoComplete="off" aria-label={entered ? '닉네임' : '입장 암호'} maxLength={entered ? 40 : 100} value={entered ? nickname : password} onChange={e => entered ? setNickname(e.target.value) : setPassword(e.target.value)} placeholder={entered ? '사용할 닉네임' : undefined} /></label>
          <button style={primary} disabled={blocked || entryBusy || (entered ? !nickname.trim() : !password)}>{remote.busy || entryBusy ? '확인 중…' : entered ? '레벨테스트 시작 →' : '다음 →'}</button>
        </form>
        {entered && s && <div className="ut-entry-resume"><p>이전 학습 이어하기</p><button style={textButton} disabled={blocked || entryBusy} onClick={() => { navigate('/ut5', { replace: true, state: null }); setRegistration(false); setPassword(''); goHome(); }}>{s.participant} · 이어하기 →</button></div>}
    </>}
  </main></div>;
  const phase = s.stage === 'pre' || s.stage === 'post';
  const map = UT5_MAPS.find(g => g.id === selectedGoal)!;
  const goal = { ...map, rootId: map.targetIds.find(id => !s.completed.includes(id)) || map.rootId };
  return <div className="plm-live-preview ut-preview ut4-preview"><MainLayout navigationDisabled={view === 'test'} showTagCatalog={false} activePath="/main/home" onNavigate={path => {
    goHome();
    if (path === '/main/ai-concept') setNotice('홈 아래의 기초 확인 문제에서 개념 학습을 시작할 수 있어요.');
    if (path === '/main/mypage') setNotice('참가자를 바꾸려면 홈 아래의 ‘새 참가자로 시작’을 눌러 주세요.');
  }}><main ref={main} tabIndex={-1} data-screen={`ut4-${view}`}>
    {connectionNotice}
    <fieldset disabled={blocked} className="ut4-content">
      {view === 'home' ? <UT5Dashboard session={s} selectedGoal={selectedGoal} onSelectGoal={setSelectedGoal} notice={notice} blocked={blocked} onOpen={id => void open(id)} onMap={openMap}
        onTest={() => { if (s.stage === 'learning') void startPost(); else setView('test-intro'); }} onResults={() => setView('results')} onPreResults={() => setView('pre-results')}
        onStartNew={() => {
          if (!remote.startNew()) return;
          setRegistration(true); setEntered(false); setPassword(''); setNickname(''); setEntryError(''); goHome();
        }} />
        : view === 'pre-results' && s.pre.responses.length === s.pre.total ? <PreResults session={s} onContinue={goHome}/>
        : view === 'test-intro' && phase ? <TimingIntro phase={s.stage as 'pre'|'post'} busy={blocked} onBack={goHome} onStart={() => setView('test')}/>
        : view === 'test' && phase && s.question ? <Assessment key={`${s.id}:${s.stage}:${s[s.stage as 'pre' | 'post'].responses.length}`} session={s} remote={remote} onAdvance={afterAssessment} />
          : view === 'review' && s.stage === 'done' && reviewNode ? <UT5NodeReview key={reviewNode} nodeId={reviewNode} onBack={() => setView('map')} onOpen={id => void open(id)}/>
          : view === 'study' && s.stage === 'learning' && s.learningNode ? <Study key={`${s.learningNode}:${s.attempts[s.learningNode] || 0}:${!!s.feedback}`} session={s} remote={remote} onHome={goHome} onMap={openMap} onPass={afterPass} />
            : view === 'map' ? <section style={card} className={`plm-live-full-map${passedNode ? ' ut-pass-map' : ''}`}>
              <div className="plm-section-row"><button style={textButton} onClick={() => { setPassedNode(null); setView(mapReturn); }}>← 돌아가기</button><h2 style={typography.headingXLBold}>{goal.title}</h2></div>
              <UT5Map session={s} goalId={selectedGoal} currentId={passedNode ? '' : s.learningNode || s.recommended || ''} onOpen={s.stage === 'learning' || s.stage === 'done' ? id => void open(id) : undefined} />
              {passedNode && <div className="ut-pass-actions"><span role="status">✓ {UT5_NODES[passedNode].label}</span>{s.recommended ? <button style={primary} onClick={() => void open(s.recommended!)}>다음 {UT5_NODES[s.recommended].kind === 'concept' ? '개념' : '문제'} →</button> : <button style={primary} onClick={goHome}>홈으로 →</button>}</div>}
            </section> : view === 'survey' && s.stage === 'done' ? <UT2SurveyForm key={s.id} nickname={s.participant} submitted={s.surveySubmitted} rewardEntered={s.rewardEntered} onBack={() => setView('results')} onSubmit={remote.submitSurvey} />
              : view === 'results' && s.stage === 'done' ? <section style={{ ...card, maxWidth: 1000, margin: '0 auto' }}><div className="plm-section-row"><h1 style={typography.headingXLBold}>학습 전후 결과</h1><button style={textButton} onClick={goHome}>홈으로 →</button></div><SurveyInvitation session={s} onSurvey={() => setView('survey')} /><Comparison session={s} /><QuestionTimes session={s} /><p className="plm-live-muted">학습 전후 같은 상황에서 숫자를 바꾼 5문항의 결과예요. 이 수치만으로 서비스의 인과 효과를 단정하지 않아요.</p></section>
              : <section style={card}><p>현재 학습 단계로 돌아가 주세요.</p><button style={primary} onClick={goHome}>홈으로 →</button></section>}
    </fieldset>
  </main></MainLayout></div>;
}

export function UT5Map({ session: s, goalId, currentId, onOpen }: { session: UT5Session; goalId: string; currentId: string; onOpen?: (id: string) => void }) {
  const goal = UT5_MAPS.find(g => g.id === goalId)!;
  return <ProblemLearningMap goal={goal} nodes={UT5_NODES} state={{ results: Object.fromEntries(Object.entries(s.results).filter(([id]) => s.history.some(r => r.nodeId === id))), complete: goal.targetIds.every(id => s.completed.includes(id)) }}
    diagnostic={s.stage === 'pre' ? {} : Object.fromEntries(CONCEPT_IDS.filter(id => s.pre.responses.some(r => r.nodeId === id)).map(id => [id, s.weak.includes(id) ? 'failed' : 'passed']))} currentId={currentId}
    columnGap={260} horizontalPadding={54} onSelectNode={onOpen} kindLabels={{ BN: '기출형 · 목표', AN: 'AN · 확인', concept: '개념' }} />;
}

export function SurveyInvitation({ session, onSurvey }: { session: UT5Session; onSurvey: () => void }) {
  if (session.stage !== 'done') return null;
  return <section className="ut4-survey-invitation" aria-label="피드백 설문">
    <h2 style={typography.headingXLBold}>{session.surveySubmitted ? '피드백을 남겨 주셔서 감사해요' : '최종 레벨테스트까지 모두 마쳤어요!'}</h2>
    <p>{session.surveySubmitted ? session.rewardEntered ? '빽다방 상품권 추첨에 응모되었어요. 당첨 시 남겨 주신 연락처로 안내해 드려요.' : '설문 제출이 완료되었어요. 연락처를 남기지 않아 추첨에는 응모되지 않았어요.' : '마지막으로 사용 경험을 들려주세요. 피드백 설문을 제출하고 연락처를 남긴 분 중 추첨을 통해 빽다방 상품권을 드려요.'}</p>
    <button type="button" style={primary} onClick={onSurvey}>{session.surveySubmitted ? '설문 제출 확인 →' : '피드백 설문 작성하기 →'}</button>
  </section>;
}

export function UT5Dashboard({ session: s, selectedGoal, onSelectGoal, notice, blocked, onOpen, onMap, onTest, onResults, onPreResults, onStartNew }: {
  session: UT5Session; selectedGoal: string; onSelectGoal: (id: string) => void; notice: string; blocked: boolean; onOpen: (id: string) => void;
  onMap: () => void; onTest: () => void; onResults: () => void; onPreResults: () => void; onStartNew: () => void;
}) {
  const map = UT5_MAPS.find(g => g.id === selectedGoal)!;
  const goal = { ...map, rootId: map.targetIds.find(id => !s.completed.includes(id)) || map.rootId };
  const nextId = s.feedback?.nodeId || s.recommended;
  const recommended = nextId && UT5_NODES[nextId];
  const learning = s.stage === 'learning';
  const readyPost = learning && s.completed.length === UT5_GOALS.length && !s.recommended;
  const run = s.stage === 'post' ? s.post : s.pre;
  const activeStep = s.stage === 'pre' ? 1 : learning && !readyPost ? 2 : 3;
  const learningAction = learning && recommended;
  const goalAction = learningAction && recommended.id === goal.rootId;
  const title = learningAction ? s.feedback ? '멈춘 곳부터 학습을 이어가세요' : goalAction ? '다음은 목표 문제를 풀 차례예요' : '목표 문제에 필요한 기초를 확인해요'
    : s.stage === 'done' ? s.surveySubmitted ? '모든 참여를 마쳤어요' : '테스트가 끝났어요. 피드백을 남겨 주세요'
      : readyPost ? '학습을 마쳤어요. 마지막 테스트를 시작해요' : s.stage === 'pre' ? '먼저 학습 전 레벨테스트를 풀어 주세요' : '학습 후 레벨테스트를 마저 풀어 주세요';
  const description = learningAction ? goalAction ? '먼저 목표 문제를 풀어 보세요. 막히면 필요한 개념부터 안내해 드려요.' : recommended.kind === 'concept' ? '개념을 읽고 확인 문제에 답하면 다음 학습으로 이어져요.' : '이 확인 문제를 풀면 목표 문제에 다시 도전할 수 있어요.'
    : s.stage === 'done' ? s.surveySubmitted ? '결과와 제출한 설문을 확인할 수 있어요.' : '결과를 확인한 뒤 마지막 피드백 설문에 참여해 주세요.'
      : readyPost ? '같은 상황에서 숫자를 바꾼 5문항으로 다시 확인해요.' : '확률과 통계 5문항. 답은 선택지 번호로 적어 주세요.';
  const actionLabel = learningAction ? s.feedback ? '학습 이어가기 →' : goalAction ? '목표 문제 풀기 →' : recommended.kind === 'concept' ? '개념 학습 시작 →' : '확인 문제 풀기 →'
    : s.stage === 'done' ? s.surveySubmitted ? '결과 보기 →' : '결과 확인하고 피드백 남기기 →'
      : readyPost ? '학습 후 테스트 시작 →' : run.responses.length ? `${run.responses.length + 1}번부터 이어서 풀기 →` : s.stage === 'post' ? '학습 후 테스트 시작 →' : '학습 전 테스트 시작 →';
  return <HomeDashboard nickname={s.participant} notice={<>
      {s.pre.responses.length === s.pre.total && <button type="button" style={{...textButton,marginBottom:16}} disabled={blocked} onClick={onPreResults}>학습 전 테스트 결과 보기 →</button>}
      {notice && <p className="plm-live-notice ut-home-notice" role="status">{notice}</p>}
      <section className="ut4-next-step" aria-labelledby="ut4-next-heading">
        <div className="ut4-next-copy"><span className="ut4-step-label">{s.stage === 'done' ? '마무리' : `${activeStep} / 3 단계`} · 지금 할 일</span>
          <h1 id="ut4-next-heading">{title}</h1>
          {learningAction && <p className="ut4-next-topic">{recommended.label}</p>}
          <p className="ut4-next-description">{description}</p>
        </div>
        <button className="ut4-next-button" type="button" disabled={blocked} onClick={learningAction ? () => onOpen(recommended.id) : s.stage === 'done' ? onResults : onTest}>{actionLabel}</button>
      </section>
    </>}
    recommendation={null}
    feedback={<section style={card}><h3 className="ut-section-title">이번 학습 순서</h3><ol className="ut-flow-list" aria-label="학습 진행 단계"><li className={activeStep === 1 && s.stage !== 'done' ? 'is-current' : ''} aria-current={activeStep === 1 && s.stage !== 'done' ? 'step' : undefined}>학습 전 테스트 <small>{s.pre.responses.length}/{s.pre.total} {s.pre.responses.length === s.pre.total ? '완료' : '문항'}</small></li><li className={activeStep === 2 ? 'is-current' : ''} aria-current={activeStep === 2 ? 'step' : undefined}>확률과 통계 문제 학습 <small>{s.completed.length}/5 {s.completed.length === UT5_GOALS.length ? '완료' : '목표'}</small></li><li className={activeStep === 3 && s.stage !== 'done' ? 'is-current' : ''} aria-current={activeStep === 3 && s.stage !== 'done' ? 'step' : undefined}>학습 후 테스트 <small>{s.post.responses.length}/{s.post.total} {s.stage === 'done' ? '완료' : '문항'}</small></li></ol><p className="plm-live-muted">학습 후 테스트를 마치면 마지막 피드백 설문이 열려요.</p></section>}
    reviewSection={<details className="ut4-optional-review"><summary>필요할 때 개념 복습하기 <span>선택</span></summary><p>바로 시작하려면 위의 파란 버튼을 눌러 주세요. 아래 개념은 필요할 때 따로 확인할 수 있어요.</p><div>{CONCEPT_IDS.map(id => <button key={id} type="button" disabled={blocked || !(learning || s.stage === 'done')} onClick={() => onOpen(id)}>{UT5_NODES[id].label}<span aria-hidden="true">→</span></button>)}</div></details>}
    reviewItems={learning ? s.weak.filter(id => s.results[id] !== 'passed').map((id, index) => ({ id: index, topicName: UT5_NODES[id].label, categoryName: '학습 전 테스트에서 확인할 개념' })) : []}
    onReviewSeeAll={() => document.getElementById('ut4-foundations')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
    onReviewItemClick={item => { const id = CONCEPT_IDS.find(id => UT5_NODES[id].label === item.topicName); if (id && !blocked) onOpen(id); }}
    progressPercent={s.completed.length} progressLabel={`목표 문제 ${s.completed.length}/5 해결`} progressHeading="님의 이번 학습"
    todaySolvedCount={s.pre.responses.length + s.post.responses.length + s.history.length} streakDays={0}
    footer={<footer className="ut-participants"><button className="ut-new-participant" disabled={blocked} onClick={onStartNew}>새 참가자로 시작 <span aria-hidden="true">→</span></button></footer>}
    maps={<>
      <section style={card} className="plm-home-map"><div className="plm-section-row"><h3 className="ut-section-title">문제 지도</h3><button style={textButton} onClick={onMap}>크게 보기 →</button></div>
        <div className="ut-goal-tabs" role="tablist" aria-label="기출 문제 선택">{UT5_MAPS.map((item, i) => <button key={item.id} role="tab" aria-selected={goal.id === item.id} className={goal.id === item.id ? 'is-current' : ''} onClick={() => onSelectGoal(item.id)}><span>{item.targetIds.every(id => s.completed.includes(id)) ? '✓' : i + 1}</span>{item.title}</button>)}</div>
        <UT5Map session={s} goalId={selectedGoal} currentId={learning ? s.learningNode || s.recommended || '' : ''} onOpen={(learning || s.stage === 'done') && !blocked ? onOpen : undefined} />
        <div className="plm-live-legend"><span><i style={{ background: colors.brand600 }} />현재</span><span><i style={{ background: colors.green500 }} />확인·해결</span><span><i style={{ background: colors.red500 }} />학습 필요</span><span><i style={{ background: colors.gray300 }} />미확인</span></div>
        <div className="plm-section-row"><span className="plm-live-muted">목표 문제 → 막힌 부분 학습 → 목표 문제 재도전</span><button style={{ ...textButton, color: colors.brand600 }} disabled={blocked || !learning || s.completed.includes(goal.rootId)} onClick={() => onOpen(goal.rootId)}>학습 시작 →</button></div>
      </section>
      <section className="ut-foundations" id="ut4-foundations" aria-labelledby="ut4-foundation-heading"><h3 className="ut-section-title" id="ut4-foundation-heading">기초 확인 문제</h3><p className="plm-live-muted">필요한 개념을 골라 짧은 문제로 확인해 보세요.</p><div className="ut-foundation-list">{CONCEPT_IDS.map((id, index) => {
        const confirmed = s.stage !== 'pre' && s.results[id] === 'passed';
        const responses = s.pre.responses.slice(index, index + 1);
        const diagnosed = responses.length === 1 && responses.every(r => typeof r.correct === 'boolean');
        return <button key={id} className={confirmed ? 'is-confirmed' : ''} disabled={blocked || !(learning || s.stage === 'done')} onClick={() => onOpen(id)}><span className="ut-foundation-top"><span className="ut-foundation-name">{UT5_NODES[id].label}</span><span className="ut-foundation-arrow" aria-hidden="true">→</span></span>
          <span className="ut-foundation-status">{confirmed ? '기초 확인 완료' : s.stage === 'pre' ? '테스트 후 열려요' : learning ? '기초 확인 필요' : '학습 종료'}</span><small>{diagnosed ? `사전 테스트 ${responses.filter(r => r.correct).length}/5 정답` : '사전 테스트 진행 중'}</small></button>;
      })}</div></section>
    </>} />;
}

function TimingIntro({phase,busy,onBack,onStart}:{phase:'pre'|'post';busy:boolean;onBack:()=>void;onStart:()=>void}) {
 return <section className="ut5-timing-intro">
   <div className="ut5-intro-meta"><span>{phase==='pre'?'학습 전':'학습 후'} 레벨테스트</span><span>총 5문항</span></div>
   <div className="ut5-intro-clock" aria-hidden="true"><svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
   <h1>문제별 풀이 시간을 기록해요</h1>
   <p className="ut5-intro-lead">시작 버튼을 누르면 문제가 열리고 시간 측정이 시작돼요.</p>
   <div className="ut5-intro-details"><div><strong>문제마다 따로 기록해요</strong><p>문제가 열린 순간부터 답을 제출할 때까지 측정해요.</p></div>{phase==='post'&&<div><strong>개념 설명과 연습 문제를 다시 볼 수 없어요</strong><p>테스트를 시작하면 개념 설명과 연습 문제를 다시 볼 수 없어요.</p></div>}</div>
   <p className="ut5-intro-reassurance">시간 제한은 없어요. 평소처럼 풀어 주세요.</p>
   <div className="ut5-intro-actions"><button type="button" className="ut5-intro-back" disabled={busy} onClick={onBack}>돌아가기</button><button type="button" className="ut5-intro-start" disabled={busy} onClick={onStart}>테스트 시작 <span aria-hidden="true">→</span></button></div>
 </section>;
}

export function Assessment({ session: s, remote, onAdvance }: { session: UT5Session; remote: Remote; onAdvance: (s: UT5Session) => void }) {
  const [answer, setAnswer] = useState('');
  const phase = s.stage as 'pre' | 'post';
  const clock = useQuestionTime(`${s.id}:${phase}:${s.question!.id}`);
  const send = async (unknown = false) => { const next = await remote.act({ type: 'answer', questionId: s.question!.id, answer: unknown ? null : answer, ...clock.finish() }); if (next) onAdvance(next.session); };
  return <section className="plm-live-solver ut-test" style={{ maxWidth: 720, margin: '0 auto' }}><div className="ut5-timing-banner" role="status"><strong>현재 문제의 풀이 시간을 측정하고 있어요.</strong>{phase==='post'&&<span>테스트 중에는 개념 설명과 연습 문제를 다시 볼 수 없어요.</span>}</div><div className="plm-section-row" style={{justifyContent:"flex-end"}}><span className="plm-live-muted">{phase === 'pre' ? '학습 전' : '학습 후'} · {s[phase].responses.length + 1} / {s[phase].total}</span></div>
    <progress className="ut-progress" value={s[phase].responses.length} max={s[phase].total} aria-label="테스트 진행도" />
    <p className="plm-live-muted">검사 중에는 정답과 힌트를 보여주지 않아요. 모르면 ‘모르겠습니다’를 눌러 주세요.</p>
    <ProblemQuestionCard tagLabel={`${s.question!.group === 'application' ? '응용' : '기초'} · ${UT5_NODES[s.question!.nodeId || '']?.label || '조건부확률'}`} problem={{ description: s.question!.prompt + '\n\n' + (s.question!.choices || []).map((choice, i) => `${'①②③④⑤'[i]} ${choice}`).join('\n'), answerType: 'NUMBER' }} value={answer} onChange={setAnswer} disabled={remote.busy || remote.hasPending || (!!clock.error || !clock.ready)} />
    {clock.error && <p role="alert">{clock.error}</p>}
    <div className="plm-live-actions"><button style={textButton} type="button" disabled={remote.busy || remote.hasPending || (!!clock.error || !clock.ready)} onClick={() => void send(true)}>모르겠습니다</button><button style={primary} disabled={remote.busy || remote.hasPending || (!!clock.error || !clock.ready) || !/^[1-5]$/.test(answer)} onClick={() => void send()}>다음 →</button></div>
  </section>;
}
export function Study({ session: s, remote, onMap, onHome, onPass }: { session: UT5Session; remote: Remote; onMap: () => void; onHome: () => void; onPass: (id: string) => void }) {
  const id = s.learningNode!; const node = UT5_NODES[id];
  const choices = UT5_TARGET_CHOICES[id];
  const [reading, setReading] = useState(node.kind === 'concept' && !s.feedback);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const lessonHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (reading || reviewId) lessonHeading.current?.focus(); }, [reading, reviewId]);
  const [answer, setAnswer] = useState('');
  const clock = useQuestionTime(`${s.id}:learning:${id}:${s.attempts[id] || 0}`);
  const lessonId = reviewId || id;
  const reviewConcept = async (nodeId: string) => {
    const next = await remote.act({ type: 'review', nodeId });
    if (next) setReviewId(nodeId);
  };
  const canSkip = !!s.learnedConcepts?.includes(lessonId);
  const returnToProblem = () => { setReading(false); setReviewId(null); window.scrollTo(0, 0); };
  const finishLesson = async () => {
    if (canSkip) { returnToProblem(); return; }
    const next = await remote.act({ type: 'lesson', nodeId: lessonId });
    if (next) returnToProblem();
  };
  const submit = async (unknown = false) => {
    const next = await remote.act({ type: 'answer', nodeId: id, variant: s.attempts[id] || 0, answer: unknown ? null : choices ? choices[Number(answer)-1]?.value : answer, ...clock.finish() });
    if (next && !next.session.feedback) onPass(id);
  };
  return <section className="plm-live-solver" style={{ maxWidth: 760, margin: '0 auto' }}><div className="plm-section-row" style={{ marginBottom: 24 }}><button style={textButton} onClick={onHome}>← 나가기</button><button style={textButton} onClick={onMap}>문제 지도 보기 →</button></div>
    <div className="plm-live-path"><span>확률과 통계</span><span className="is-current">› {node.label}</span></div>
    {reading || reviewId ? <>
      {reviewId && <button className="ut4-return-to-problem" style={textButton} onClick={returnToProblem}>← 풀던 문제로 돌아가기</button>}
      <h2 ref={lessonHeading} tabIndex={-1} style={typography.headingXLBold}>{UT5_NODES[lessonId].label}</h2>
      {reviewId && <p className="plm-live-muted">개념을 직접 확인하는 중이에요. 풀던 답안은 그대로 유지돼요.</p>}
      <UT5ConceptLesson goalId={s.activeGoal || undefined} key={`${lessonId}:${s.reviewCounts[lessonId] || 0}`} nodeId={lessonId} count={s.reviewCounts[lessonId] || 0} onReviewAgain={() => void reviewConcept(lessonId)} disabled={remote.busy || remote.hasPending} onComplete={() => void finishLesson()} onSkip={canSkip ? returnToProblem : undefined} confirmLabel={reviewId ? '풀던 문제로 돌아가기 →' : '확인 문제 풀기 →'} />
    </> : <>
      <ProblemQuestionCard tagLabel={`${node.kind === 'BN' ? '목표 문제' : node.kind === 'AN' ? '확인 문제' : '개념 확인'} · ${node.label}${(s.attempts[id] || 0) > 0 && !s.feedback ? ' · 숫자를 바꾼 문제' : ''}`} problem={{ description: s.feedback?.prompt || (s.question!.prompt.replace('값을 분수 또는 소수로 구하세요.', '') + (choices ? '\n\n'+choices.map((c,i)=>`${'①②③④⑤'[i]} ${c.label}`).join('\n') : '')), answerType: 'NUMBER' }} value={answer} onChange={setAnswer} disabled={remote.busy || remote.hasPending || !!s.feedback || (!!clock.error || !clock.ready)} />
      {clock.error && <p role="alert">{clock.error}</p>}
      {s.feedback ? <div className="plm-live-feedback ut-feedback" role="status"><strong>{s.feedback.unknown ? '기초부터 확인해 볼까요?' : '답을 다시 확인해 볼게요'}</strong>
        <LearningHelp nodeId={id} expanded disabled={remote.busy || remote.hasPending} onReview={nodeId => void reviewConcept(nodeId)} />
        {s.feedback.nextNode !== id && <p className="plm-live-muted">‘{UT5_NODES[s.feedback.nextNode]?.label}’부터 확인한 뒤 이 문제로 돌아와요.</p>}<button style={primary} disabled={remote.busy || remote.hasPending} onClick={() => void remote.act({ type: 'continue' })}>{s.feedback.nextNode === id ? '숫자를 바꿔 다시 풀기 →' : '필요한 하위 학습으로 이어가기 →'}</button></div>
        : <><LearningHelp nodeId={id} expanded={false} disabled={remote.busy || remote.hasPending} onReview={nodeId => void reviewConcept(nodeId)} />
          {choices ? <div className="plm-live-actions"><button type="button" style={textButton} disabled={remote.busy || remote.hasPending || (!!clock.error || !clock.ready)} onClick={() => void submit(true)}>모르겠습니다</button><button style={primary} disabled={remote.busy || remote.hasPending || (!!clock.error || !clock.ready) || !/^[1-5]$/.test(answer)} onClick={() => void submit()}>다음 →</button></div> : <AnswerForm answer={answer} setAnswer={setAnswer} disabled={remote.busy || remote.hasPending || (!!clock.error || !clock.ready)} onSubmit={() => void submit()} onUnknown={() => void submit(true)} />}</>}
    </>}
  </section>;
}
function LearningHelp({ nodeId, expanded, disabled, onReview }: { nodeId: string; expanded: boolean; disabled: boolean; onReview: (id: string) => void }) {
  const support = UT5_LEARNING_SUPPORT[nodeId];
  return <section className={`ut4-learning-help${expanded ? ' is-expanded' : ''}`} aria-label="이 문제에 필요한 개념">
    <h3>{expanded ? '이 개념부터 다시 확인해요' : '개념이 헷갈리나요?'}</h3>
    {expanded && <p className="plm-live-muted">{UT5_HINTS[nodeId]}</p>}
    <div className="ut4-concept-links">{support.concepts.map(id => <button key={id} type="button" disabled={disabled} onClick={() => onReview(id)}>개념 다시 확인하기 · {UT5_NODES[id].label} <span aria-hidden="true">→</span></button>)}</div>
  </section>;
}
function AnswerForm({ answer, setAnswer, disabled, onSubmit, onUnknown, choice = false }: { choice?: boolean; answer: string; setAnswer: (v: string) => void; disabled: boolean; onSubmit: () => void; onUnknown: () => void }) {
  return <form onSubmit={e => { e.preventDefault(); if (!disabled && parseProbabilityAnswer(answer) !== null) onSubmit(); }}><label className="plm-number-answer">답안<input type="text" aria-label="답안" inputMode="text" autoComplete="off" maxLength={100} placeholder={choice ? "선택지 번호 (1~5)" : "분수 또는 소수 (예: 1/2)"} value={answer} onChange={e => setAnswer(e.target.value)} disabled={disabled} /></label>
    <div className="plm-live-actions"><button style={textButton} type="button" disabled={disabled} onClick={onUnknown}>모르겠습니다</button><button style={primary} disabled={disabled || parseProbabilityAnswer(answer) === null}>다음 →</button></div></form>;
}
function Comparison({ session: s }: { session: UT5Session }) {
  return <div className="ut4-comparison"><table><thead><tr><th>구분</th><th>학습 전</th><th>학습 후</th><th>변화</th></tr></thead><tbody>{[[undefined, '전체']].map(([, label]) => {
    const pre = ut5Score(s.pre), post = ut5Score(s.post);
    const gain = pre.accuracy !== null && post.accuracy !== null ? post.accuracy - pre.accuracy : null;
    return <tr key={label}><th>{label}</th><td>{percent(pre.accuracy)}</td><td>{percent(post.accuracy)}</td><td>{gain === null ? '—' : `${gain > 0 ? '+' : ''}${gain.toFixed(0)}%p`}</td></tr>;
  })}<tr><th>평균 풀이 시간</th><td>{time(ut5Score(s.pre).average)}</td><td>{time(ut5Score(s.post).average)}</td><td>—</td></tr><tr><th>모름</th><td>{ut5Score(s.pre).unknown}</td><td>{ut5Score(s.post).unknown}</td><td>—</td></tr></tbody></table></div>;
}

function QuestionTimes({session:s,preOnly=false}:{session:UT5Session;preOnly?:boolean}) {
 const duration=(seconds:number)=>{const ticks=Math.round(seconds*10),minutes=Math.floor(ticks/600),rest=(ticks%600)/10;return minutes ? `${minutes}분 ${rest.toFixed(1)}초` : `${rest.toFixed(1)}초`;};
 const cell=(r:UT5Response|undefined)=>!r?<span className="ut5-time-empty">—</span>:<div className="ut5-time-cell"><strong>{r.answer===null?'—':duration(r.seconds)}</strong><span className={`ut5-time-verdict ${r.answer===null?'is-unknown':r.correct?'is-correct':'is-wrong'}`}>{r.answer===null?'모름':r.correct?'정답':'오답'}</span></div>;
 return <section className="ut5-question-times" aria-labelledby="ut5-question-times-title"><h2 id="ut5-question-times-title">문제별 풀이 시간</h2><p>{preOnly?'각 문제를 푼 시간과 정오답을 확인해요.':'같은 유형의 문제를 학습 전후에 얼마나 오래 풀었는지 확인해요.'}</p><div className="ut4-comparison"><table><thead><tr><th scope="col">문항</th><th scope="col">학습 전</th>{!preOnly&&<th scope="col">학습 후</th>}</tr></thead><tbody>{Array.from({length:5},(_,i)=><tr key={i}><th scope="row">{i+1}번</th><td>{cell(s.pre.responses[i])}</td>{!preOnly&&<td>{cell(s.post.responses[i])}</td>}</tr>)}</tbody></table></div><p className="ut5-time-footnote">‘모름’으로 제출한 문제는 평균 풀이 시간 계산에서 제외해요.</p></section>;
}

function PreResults({session:s,onContinue}:{session:UT5Session;onContinue:()=>void}) {
 const score=ut5Score(s.pre);
 return <section style={{...card,maxWidth:900,margin:'0 auto'}}><div className="plm-section-row"><h1 style={typography.headingXLBold}>학습 전 테스트 결과</h1><button type="button" style={textButton} onClick={onContinue}>학습 홈으로 →</button></div><p className="plm-live-muted">먼저 현재 결과를 확인하고, 필요한 개념을 학습해 보세요.</p><div className="ut5-pre-summary"><div><span>정답 수</span><strong>{score.count} / {score.total}</strong></div><div><span>평균 풀이 시간</span><strong>{time(score.average)}</strong></div><div><span>모름</span><strong>{score.unknown}문항</strong></div></div><QuestionTimes session={s} preOnly/><div style={{display:'flex',justifyContent:'flex-end',marginTop:24}}><button type="button" style={primary} onClick={onContinue}>학습하러 가기 →</button></div></section>;
}
