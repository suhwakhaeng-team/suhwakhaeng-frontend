import { UT5Timer } from './ut5Timer';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProblemQuestionCard from '../../components/ProblemQuestionCard';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { UT5_NODES } from './ut5Model';
import useUT5Server from './useUT5Server';
import { ut5Score, type UT5Session } from './ut5ServerApi';
import './LevelTestMapPreviewPage.css';
import './ProblemLearningPreviewPage.css';
import './UT1PreviewPage.css';
import './UT4Page.css';
import './UT5Timing.css';
import './UT5Results.css';

type Remote = ReturnType<typeof useUT5Server>;
type View = 'home' | 'test-intro' | 'test' | 'results';
const card = { padding: spacing.xl, background: colors.white, borderRadius: radius.lg };
const primary = { padding: '14px 24px', background: colors.brand600, color: colors.white, border: 'none', borderRadius: radius.sm,
  ...typography.bodyTextXLSemiBold, fontSize: 16, cursor: 'pointer' };
const textButton = { border: 'none', background: 'none', color: colors.gray500, fontSize: 14, cursor: 'pointer', padding: 0 };
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
  const main = useRef<HTMLElement>(null);
  const s = remote.reply?.session;
  useEffect(() => { main.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [view, s?.stage, s?.pre.responses.length]);
  const blocked = remote.loading || remote.busy || remote.hasPending || remote.blocked;
  const goHome = () => setView('home');
  async function enter() {
    if (entryBusy) return;
    setEntryBusy(true); setEntryError('');
    try {
      await remote.enter(password); setEntered(true);
    }
    catch (e) { setEntryError(e instanceof Error ? e.message : '입장하지 못했어요.'); }
    finally { setEntryBusy(false); }
  }
  async function createParticipant() {
    const next = await remote.create(nickname.trim(), password);
    if (next) { navigate('/ut5', { replace: true, state: null }); setRegistration(false); setPassword(''); setNickname(''); setView('test-intro'); }
  }
  const connectionNotice = <>
    {(remote.error || entryError) && <div className="ut-error ut-connection-notice" role="alert"><p>{remote.error || entryError}</p><div className="ut-connection-actions">{remote.hasPending ? <button className="ut-new-session-button" disabled={remote.busy} onClick={async () => {
      const next = await remote.retry(); if (!next) return;
      setView(next.session.stage === 'done' ? 'results' : 'test-intro');
    }}>다시 저장</button> : remote.error && <button className="ut-reconnect-button" onClick={() => window.location.reload()}>다시 연결</button>}</div></div>}
    {remote.conflict && <div className="ut-error"><p>다른 탭을 닫고 이어가세요. 미저장 답안은 이 기기에 별도 보관합니다.</p><button style={textButton} disabled={remote.busy} onClick={async () => { await remote.recoverConflict(); goHome(); }}>다른 탭 기록으로 이어가기</button></div>}
  </>;
  if (!s || registration) return <div className="ut-preview ut-entry"><main className="ut-registration" style={card}>
    <div className="ut-entry-brand">수확행</div>
    <h1>{entered ? '닉네임을 알려주세요' : '레벨테스트 참여하기'}</h1>
    <p>{entered ? '이 닉네임으로 레벨테스트 기록을 남겨요.' : '안내받은 입장 암호를 입력해 주세요.'}</p>
    {connectionNotice}
    {remote.loading ? <p role="status">기록을 불러오는 중…</p> : <>
        {entered && <p className="plm-live-muted">확률과 통계 5문항이에요. 닉네임, 답안, 문항별 풀이 시간이 서버에 저장돼요.</p>}
        <form onSubmit={e => { e.preventDefault(); if (entered) void createParticipant(); else void enter(); }}>
          <label>{entered ? '닉네임' : '입장 암호'}<input autoFocus key={String(entered)} type={entered ? 'text' : 'password'} autoComplete="off" aria-label={entered ? '닉네임' : '입장 암호'} maxLength={entered ? 40 : 100} value={entered ? nickname : password} onChange={e => entered ? setNickname(e.target.value) : setPassword(e.target.value)} placeholder={entered ? '사용할 닉네임' : undefined} /></label>
          <button style={primary} disabled={blocked || entryBusy || (entered ? !nickname.trim() : !password)}>{remote.busy || entryBusy ? '확인 중…' : entered ? '레벨테스트 시작 →' : '다음 →'}</button>
        </form>
        {entered && s && <div className="ut-entry-resume"><p>이전 테스트 기록</p><button style={textButton} disabled={blocked || entryBusy} onClick={() => { navigate('/ut5', { replace: true, state: null }); setRegistration(false); setPassword(''); goHome(); }}>{s.participant} · 이어하기 →</button></div>}
    </>}
  </main></div>;
  const complete = s.pre.responses.length === s.pre.total;
  return <div className="plm-live-preview ut-preview ut4-preview">
    <div style={{ minHeight: '100vh' }}>
      <header style={{ padding: '12px 24px', borderBottom: '1px solid #eee' }}><strong>수확행</strong></header>
      <main style={{ padding: 24 }} ref={main} tabIndex={-1} data-screen={`ut4-${view}`}>
        {connectionNotice}
        <fieldset disabled={blocked} className="ut4-content">
          {view === 'results' && complete ? <TestResults key={s.id} session={s} onBack={goHome} remote={remote} />
            : view === 'test-intro' && s.stage === 'pre' ? <TimingIntro busy={blocked} onBack={goHome} onStart={() => setView('test')} />
            : view === 'test' && s.stage === 'pre' && s.question ? <Assessment key={s.question.id} session={s} remote={remote} onAdvance={next => { if (next.stage === 'done') setView('results'); }} />
            : <section style={{ ...card, maxWidth: 720, margin: '0 auto' }}>
              <h1>확률과 통계 레벨테스트</h1>
              <p>{s.participant} · {s.pre.responses.length} / {s.pre.total}문항</p>
              <button style={primary} onClick={() => setView(complete ? 'results' : 'test-intro')}>
                {complete ? '결과 보기 →' : s.pre.responses.length ? `${s.pre.responses.length + 1}번부터 이어서 풀기 →` : '레벨테스트 시작 →'}
              </button>
              <p><button style={textButton} onClick={() => {
                if (!remote.startNew()) return;
                setRegistration(true); setEntered(false); setPassword(''); setNickname(''); setEntryError(''); goHome();
              }}>새 참가자로 시작</button></p>
            </section>}
        </fieldset>
      </main>
    </div>
  </div>;
}

function TimingIntro({busy,onBack,onStart}:{busy:boolean;onBack:()=>void;onStart:()=>void}) {
 return <section className="ut5-timing-intro">
   <p className="ut5-intro-meta">확률과 통계 · 5문항</p>
   <h1>레벨테스트 시작 안내</h1>
   <p className="ut5-intro-lead">테스트를 시작하면 <strong>문항별 풀이 시간</strong>을 기록해요. 시간 제한은 없지만 가능한 빠르고 정확하게 풀어 주세요.</p>
   <aside className="ut5-photo-reminder" aria-labelledby="ut5-photo-reminder-title">
     <h2 id="ut5-photo-reminder-title">시작 전에 종이와 펜을 준비해 주세요</h2>
     <p>문제를 풀면서 <strong>풀이 과정</strong>을 종이에 적어 주세요.</p>
     <p>테스트가 끝나면 <strong>풀이한 종이를 찍은 사진</strong>을 올려 주세요.</p>
   </aside>
   <div className="ut5-intro-actions"><button type="button" className="ut5-intro-back" disabled={busy} onClick={onBack}>돌아가기</button><button type="button" className="ut5-intro-start" disabled={busy} onClick={onStart}>테스트 시작 <span aria-hidden="true">→</span></button></div>
 </section>;
}

export function Assessment({ session: s, remote, onAdvance }: { session: UT5Session; remote: Remote; onAdvance: (s: UT5Session) => void }) {
  const [answer, setAnswer] = useState('');
  const clock = useQuestionTime(`${s.id}:pre:${s.question!.id}`);
  const send = async (unknown = false) => { const next = await remote.act({ type: 'answer', questionId: s.question!.id, answer: unknown ? null : answer, ...clock.finish() }); if (next) onAdvance(next.session); };
  return <section className="plm-live-solver ut-test" style={{ maxWidth: 720, margin: '0 auto' }}><div className="ut5-timing-banner" role="status"><strong>현재 문제의 풀이 시간을 측정하고 있어요.</strong></div><div className="plm-section-row" style={{justifyContent:"flex-end"}}><span className="plm-live-muted">문항 {s.pre.responses.length + 1} / {s.pre.total}</span></div>
    <progress className="ut-progress" value={s.pre.responses.length} max={s.pre.total} aria-label="테스트 진행도" />
    <p className="plm-live-muted">검사 중에는 정답과 힌트를 보여주지 않아요. 모르면 ‘모르겠습니다’를 눌러 주세요.</p>
    <ProblemQuestionCard tagLabel={`${s.question!.group === 'application' ? '응용' : '기초'} · ${UT5_NODES[s.question!.nodeId || '']?.label || '조건부확률'}`} problem={{ description: s.question!.prompt + '\n\n' + (s.question!.choices || []).map((choice, i) => `${'①②③④⑤'[i]} ${choice}`).join('\n'), answerType: 'NUMBER' }} value={answer} onChange={setAnswer} disabled={remote.busy || remote.hasPending || (!!clock.error || !clock.ready)} />
    {clock.error && <p role="alert">{clock.error}</p>}
    <div className="plm-live-actions"><button style={textButton} type="button" disabled={remote.busy || remote.hasPending || (!!clock.error || !clock.ready)} onClick={() => void send(true)}>모르겠습니다</button><button style={primary} disabled={remote.busy || remote.hasPending || (!!clock.error || !clock.ready) || !/^[1-5]$/.test(answer)} onClick={() => void send()}>다음 →</button></div>
  </section>;
}
function TestResults({ session, onBack, remote }: { session: UT5Session; onBack: () => void; remote: Remote }) {
  const score = ut5Score(session.pre);
  return <section style={{ ...card, maxWidth: 900, margin: '0 auto' }}>
    <div className="plm-section-row">
      <h1 style={typography.headingXLBold}>레벨테스트 결과</h1>
      <button style={textButton} onClick={onBack}>홈으로 →</button>
    </div>
    <div className="ut5-pre-summary">
      <div><span>정답 수</span><strong>{score.count} / {score.total}</strong></div>
      <div><span>평균 풀이 시간</span><strong>{time(score.average)}</strong></div>
      <div><span>모름</span><strong>{score.unknown}문항</strong></div>
    </div>
    <section className="ut5-question-times">
      <h2>문제별 풀이 시간</h2>
      <div className="ut4-comparison"><table>
        <thead><tr><th scope="col">문항</th><th scope="col">결과</th><th scope="col">풀이 시간</th></tr></thead>
        <tbody>{session.pre.responses.map((response, index) => <tr key={index}>
          <th scope="row">{index + 1}번</th>
          <td>{response.answer === null ? '모름' : response.correct ? '정답' : '오답'}</td>
          <td>{time(response.answer === null ? null : response.seconds)}</td>
        </tr>)}</tbody>
      </table></div>
      <p className="ut5-time-footnote">‘모름’으로 제출한 문제는 평균 풀이 시간 계산에서 제외해요.</p>
    </section>
    <SolutionPhotos load={remote.photos} upload={remote.uploadPhoto} />
  </section>;
}


const FULL_SOLUTION_SLOTS = [0, 6, 7, 8, 9];

function SolutionPhotos({ load, upload }: {
  load: () => Promise<number[]>;
  upload: (number: number, file: File) => Promise<void>;
}) {
  const [uploaded, setUploaded] = useState<number[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [photosReady, setPhotosReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    load().then(numbers => { if (!cancelled) { setUploaded(numbers); setPhotosReady(true); } })
      .catch(() => { if (!cancelled) setStatus('사진 제출 상태를 불러오지 못했어요. 새로고침해 주세요.'); });
    return () => { cancelled = true; };
  }, [load]);

  const savedFullCount = FULL_SOLUTION_SLOTS.filter(slot => uploaded.includes(slot)).length;

  async function submitFull(files: File[]) {
    if (!files.length || busy || !photosReady) return;
    const available = FULL_SOLUTION_SLOTS.filter(slot => !uploaded.includes(slot));
    if (files.length > available.length) {
      setStatus(available.length
        ? `전체 풀이 사진을 ${available.length}장 더 올릴 수 있어요.`
        : '전체 풀이 사진 5장이 이미 제출됐어요.');
      return;
    }
    if (files.some(file => file.size > 10 * 1024 * 1024)) {
      setStatus('사진은 한 장당 10MB 이하로 올려 주세요.');
      return;
    }
    setBusy(true);
    setStatus('');
    let saved = 0;
    const failed: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        const slot = available[index];
        try {
          await upload(slot, file);
          setUploaded(current => current.includes(slot) ? current : [...current, slot]);
          saved++;
        } catch {
          failed.push(file.name);
        }
      }
      setStatus(failed.length
        ? `${saved}장 저장했어요. 저장하지 못한 사진을 다시 올려 주세요: ${failed.join(', ')}`
        : `전체 풀이 사진 ${saved}장을 저장했어요.`);
    } finally {
      setBusy(false);
    }
  }

  return <section className="ut5-question-times" aria-labelledby="ut5-photos-heading">
    <h2 id="ut5-photos-heading">손풀이 사진 올리기</h2>
    <p>종이에 쓴 풀이를 사진으로 찍어 올려 주세요. JPG 또는 PNG, 한 장당 최대 10MB예요.</p>
    <section className="ut5-photo-group ut5-photo-group-batch" aria-labelledby="ut5-photo-full">
      <h3 id="ut5-photo-full">전체 풀이 사진 올리기</h3>
      <p>풀이한 종이를 찍은 사진을 최대 5장까지 한 번에 올릴 수 있어요.</p>
      <div className="ut5-photo-list">
        <label className="ut5-photo-drop" onDragOver={event => event.preventDefault()} onDrop={event => {
          event.preventDefault();
          void submitFull(Array.from(event.dataTransfer.files));
        }}>
          <strong>사진을 여기에 끌어다 놓거나 파일을 선택해 주세요</strong>
          <span>{busy ? '저장 중…' : `${savedFullCount} / 5장 저장됨`}</span>
          <input type="file" accept="image/jpeg,image/png" multiple disabled={busy || !photosReady || savedFullCount === 5} onChange={event => {
            void submitFull(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = '';
          }} />
        </label>
      </div>
    </section>
    <p role="status">{status}</p>
  </section>;
}
