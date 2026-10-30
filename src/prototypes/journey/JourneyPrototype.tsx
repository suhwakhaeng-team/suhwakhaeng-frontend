import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useViewport } from './layout';
import { UNITS, STORAGE_KEY, freshState, nextTopic, nextChild, childKey, learningContent, josa, type JourneyState, type Screen, type UnitId } from './model';
import { GeneratingScreen, IntroScreen, LoginScreen, OnboardingShell, ProfileScreen, TestScreen } from './screens/Onboarding';
import { AiContent, HomeContent, LibraryFrame, NotesContent, type ChatMessage } from './screens/Library';
import MapScreen from './screens/MapScreen';
import LessonScreen from './screens/LessonScreen';

const ONBOARDING: Screen[] = ['login', 'profile', 'intro', 'test', 'generating'];
const LIBRARY: Screen[] = ['home', 'notes', 'ai'];
const MAP: Screen[] = ['unit', 'detail'];

function loadState(): JourneyState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored?.version === 1 && UNITS.some(u => u.id === stored.unitId) && Array.isArray(stored.answers) && Array.isArray(stored.completed) && Array.isArray(stored.notes)) {
      return { ...freshState(), ...stored, screen: stored.screen === 'generating' ? 'home' : stored.screen };
    }
  } catch { /* Storage is optional for an isolated browser prototype. */ }
  return freshState();
}

function storageWorks() {
  try { localStorage.setItem(`${STORAGE_KEY}:probe`, '1'); localStorage.removeItem(`${STORAGE_KEY}:probe`); return true; } catch { return false; }
}

/** Picks the page-level motion; map ↔ detail on desktop is animated in place by MapScreen instead. */
function motionFor(from: Screen, to: Screen, mobile: boolean): string | null {
  if (MAP.includes(from) && MAP.includes(to)) return mobile ? (to === 'detail' ? 'zoom-in' : 'zoom-out') : null;
  if (LIBRARY.includes(from) && LIBRARY.includes(to)) return 'library';
  return 'forward';
}

export default function JourneyPrototype() {
  const [state, setState] = useState(loadState);
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [storageWarning] = useState(() => !storageWorks());
  const [generationStep, setGenerationStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyPending, setReplyPending] = useState(false);
  const { mobile } = useViewport();
  const mainRef = useRef<HTMLElement>(null);
  const toolsRef = useRef<HTMLDetailsElement>(null);
  const transitionRef = useRef<ViewTransition | null>(null);
  const replyTimer = useRef<number | undefined>(undefined);

  const unit = UNITS.find(item => item.id === state.unitId)!;
  const topicIndex = Math.min(state.topicIndex, unit.topics.length - 1);
  const topic = unit.topics[topicIndex];
  const childIndex = Math.min(state.childIndex, topic.children.length - 1);
  const child = topic.children[childIndex];
  const lesson = learningContent(unit.id, topicIndex, childIndex);

  function navigate(patch: Partial<JourneyState> & { screen: Screen }, from: Screen) {
    const commit = () => { setPreviousScreen(from); setState(current => ({ ...current, ...patch })); };
    const motion = motionFor(from, patch.screen, mobile);
    transitionRef.current?.skipTransition();
    if (!motion || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { commit(); return; }
    document.documentElement.setAttribute('data-journey-motion', motion);
    const transition = document.startViewTransition(() => flushSync(commit));
    transitionRef.current = transition;
    void transition.ready.catch(() => {});
    // A second navigation can skip the previous animation without discarding its state update.
    void transition.finished.catch(() => {}).finally(() => { if (transitionRef.current === transition) transitionRef.current = null; });
  }
  const update = (patch: Partial<JourneyState>) => {
    if (patch.screen && patch.screen !== state.screen) navigate({ ...patch, screen: patch.screen }, state.screen);
    else setState(current => ({ ...current, ...patch }));
  };
  const go = (screen: Screen) => { toolsRef.current?.removeAttribute('open'); update({ screen }); };

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storageWarning already explains this. */ }
  }, [state]);
  useEffect(() => {
    // Map ↔ detail keeps the camera where it is; every other screen starts at the top.
    if (MAP.includes(state.screen) && previousScreen && MAP.includes(previousScreen)) return;
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [state.screen, previousScreen]);
  useEffect(() => () => window.clearTimeout(replyTimer.current), []);

  // The generation screen is a short scripted sequence that hands off to the new curriculum.
  const finishGeneration = useEffectEvent(() => {
    const first = UNITS[0];
    navigate({ tested: true, screen: 'home', unitId: first.id, topicIndex: nextTopic(state, first), childIndex: 0 }, 'generating');
  });
  useEffect(() => {
    if (state.screen !== 'generating') return;
    const timers = [0, 1, 2, 3].map(i => window.setTimeout(() => setGenerationStep(i), i * 650));
    timers.push(window.setTimeout(() => finishGeneration(), 2600));
    return () => timers.forEach(clearTimeout);
  }, [state.screen]);

  function openUnit(id: UnitId, index?: number) {
    const target = UNITS.find(item => item.id === id)!;
    const ti = index ?? nextTopic(state, target);
    update({ unitId: id, topicIndex: ti, childIndex: nextChild(state, target, ti), screen: 'unit' });
  }
  const openDetail = (ti = topicIndex, ci = nextChild(state, unit, ti)) => update({ topicIndex: ti, childIndex: ci, screen: 'detail' });
  function completeLesson() {
    const completed = [...new Set([...state.completed, childKey(unit.id, topicIndex, childIndex)])];
    const next = topic.children.findIndex((_, i) => !completed.includes(childKey(unit.id, topicIndex, i)));
    if (next >= 0) { update({ completed, childIndex: next }); window.scrollTo(0, 0); return; }
    // The whole concept is done: return to the map with the train on the next station.
    const ti = nextTopic({ ...state, completed }, unit);
    update({ completed, topicIndex: ti, childIndex: nextChild({ ...state, completed }, unit, ti), screen: 'unit' });
  }
  function toggleNote() {
    const key = childKey(unit.id, topicIndex, childIndex);
    update({ notes: state.notes.includes(key) ? state.notes.filter(item => item !== key) : [...state.notes, key] });
  }
  function ask(text: string) {
    const reply = text.includes('다음')
      ? `지금은 ${josa(child, '을', '를')} 살펴보고 있어요. 개념을 확인한 뒤 문제를 풀고, 다음 세부 개념으로 이어가 보세요.`
      : text.includes('예시') ? `${lesson.question}\n${lesson.explanation}` : `${lesson.description}\n${lesson.formula}\n이 내용을 네 말로 어떻게 설명할 수 있을까요?`;
    setMessages(current => [...current, { text, own: true }]);
    setReplyPending(true);
    replyTimer.current = window.setTimeout(() => { setMessages(current => [...current, { text: reply, own: false }]); setReplyPending(false); }, 700);
  }
  function reset() {
    if (!window.confirm('이 브라우저의 프로토타입 체험 기록을 초기화할까요?')) return;
    window.clearTimeout(replyTimer.current);
    setState(freshState()); setMessages([]); setReplyPending(false);
  }
  function openCurriculumShortcut() {
    toolsRef.current?.removeAttribute('open');
    if (state.nickname) { go('home'); return; }
    update({ nickname: '김성빈', grade: '고등학교 2학년', answers: [0, null, null, null, null, null, null, null, null], tested: true, unitId: 'counting', topicIndex: 1, childIndex: 0, screen: 'home' });
  }

  let content;
  if (ONBOARDING.includes(state.screen)) {
    const back = previousScreen && !ONBOARDING.includes(previousScreen) ? previousScreen : 'home';
    content = <OnboardingShell onLogo={state.tested ? () => go('home') : undefined}>
      {state.screen === 'login' && <LoginScreen onStart={() => go('profile')} />}
      {state.screen === 'profile' && <ProfileScreen state={state}
        onSave={(nickname, grade) => update({ nickname, grade, screen: state.tested ? back : 'intro' })}
        onCancel={state.tested ? () => go(back) : undefined} />}
      {state.screen === 'intro' && <IntroScreen nickname={state.nickname} onStart={() => update({ screen: 'test', questionIndex: 0, answers: [] })} />}
      {state.screen === 'test' && <TestScreen state={state}
        onAnswer={i => { const answers = [...state.answers]; answers[state.questionIndex] = i; update({ answers }); }}
        onNext={answer => {
          const answers = [...state.answers]; answers[state.questionIndex] = answer;
          update({ answers, questionIndex: Math.min(8, state.questionIndex + 1), screen: state.questionIndex === 8 ? 'generating' : 'test' });
        }}
        onPrevious={() => update({ questionIndex: state.questionIndex - 1 })} />}
      {state.screen === 'generating' && <GeneratingScreen nickname={state.nickname} step={generationStep} />}
    </OnboardingShell>;
  } else if (LIBRARY.includes(state.screen)) {
    content = <LibraryFrame screen={state.screen} nickname={state.nickname} go={go}>
      {state.screen === 'home' && <HomeContent state={state} openUnit={openUnit} />}
      {state.screen === 'notes' && <NotesContent notes={state.notes} openUnit={() => openUnit(state.unitId)} openNote={key => {
        const [id, ti, ci] = key.split(':');
        update({ unitId: id as UnitId, topicIndex: Number(ti), childIndex: Number(ci), screen: 'lesson' });
      }} />}
      {state.screen === 'ai' && <AiContent nickname={state.nickname} topicName={topic.name} messages={messages} pending={replyPending} onAsk={ask} />}
    </LibraryFrame>;
  } else if (state.screen === 'lesson') {
    content = <LessonScreen key={childKey(unit.id, topicIndex, childIndex)} unit={unit} state={state} topicIndex={topicIndex} childIndex={childIndex} lesson={lesson}
      onClose={() => go('detail')} onToggleNote={toggleNote} onComplete={completeLesson} />;
  } else {
    content = <MapScreen mode={state.screen === 'detail' ? 'detail' : 'unit'} mobile={mobile} arrive={!previousScreen || !['unit', 'detail', 'lesson'].includes(previousScreen)}
      unit={unit} state={state} topicIndex={topicIndex} childIndex={childIndex} lesson={lesson} go={go}
      selectTopic={i => update({ topicIndex: i, childIndex: nextChild(state, unit, i) })} openDetail={openDetail} startLesson={() => go('lesson')} />;
  }

  return <main ref={mainRef} tabIndex={-1} className="j-prototype" data-screen={state.screen}>
    {content}
    {storageWarning && <p className="j-storage-warning" role="status">브라우저 저장 공간을 사용할 수 없어 새로고침하면 체험 기록이 사라질 수 있어요.</p>}
    <details className="j-prototype-tools" ref={toolsRef}>
      <summary>시안 메뉴</summary>
      <div>
        <strong>수확행 · 전체 흐름 프로토타입</strong>
        <small>체험 기록은 이 브라우저에만 저장돼요.</small>
        <button onClick={() => go('login')}>로그인부터 보기</button>
        <button onClick={openCurriculumShortcut}>커리큘럼 바로 보기</button>
        <button onClick={reset}>체험 기록 초기화</button>
      </div>
    </details>
  </main>;
}
