import { lazy, Suspense, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { parseProgress, STEPS, STORAGE_KEY } from './frequencyCourse';
import { STORY_STORAGE_KEY } from './frequencyStory';
import './FrequencyVersionPicker.css';

const FrequencyLearningPage = lazy(() => import('./FrequencyLearningPage'));
const FrequencyStoryPage = lazy(() => import('./FrequencyStoryPage'));
const FrequencyAssessmentPage = lazy(() => import('./FrequencyAssessmentPage'));
const ConfidenceLearningPage = lazy(() => import('./ConfidenceLearningPage'));

type Phase = 'basic' | 'story' | 'assessment';

function storedCompletion() {
  try {
    return {
      basic: parseProgress(localStorage.getItem(STORAGE_KEY)).completed.length === STEPS.length,
      story: localStorage.getItem(STORY_STORAGE_KEY) === 'true',
    };
  } catch {
    return { basic: false, story: false };
  }
}

export default function FrequencyLearningRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const requestedVersion = params.get('version');
  const [completion, setCompletion] = useState(storedCompletion);
  const requestedPhase = params.get('phase');
  const fallbackPhase: Phase = !completion.basic ? 'basic' : !completion.story ? 'story' : 'assessment';
  const phase: Phase = requestedPhase === 'story' && completion.basic
    ? 'story'
    : requestedPhase === 'assessment' && completion.basic && completion.story
      ? 'assessment'
      : requestedPhase === 'basic'
        ? 'basic'
        : fallbackPhase;

  if (requestedVersion === '3') return <Suspense fallback={<p>학습 코스를 준비하고 있어요…</p>}><ConfidenceLearningPage /></Suspense>;
  if (requestedVersion === '1') return <Suspense fallback={<p>학습 코스를 준비하고 있어요…</p>}><FrequencyLearningPage /></Suspense>;
  if (requestedVersion === '2') return <Suspense fallback={<p>학습 코스를 준비하고 있어요…</p>}><FrequencyStoryPage /></Suspense>;

  function move(next: Phase) {
    setParams({ phase: next });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const phases: Array<{ id: Phase; label: string; unlocked: boolean; done: boolean }> = [
    { id: 'basic', label: '1. 기초 익히기', unlocked: true, done: completion.basic },
    { id: 'story', label: '2. 상황에 적용하기', unlocked: completion.basic, done: completion.story },
    { id: 'assessment', label: '3. REAL 문제', unlocked: completion.basic && completion.story, done: false },
  ];

  const embedded = location.pathname.startsWith('/main/');
  return <div className={embedded ? 'fl-flow-embedded' : undefined}>
    <div className="fl-flow-bar" aria-label="도수분포표 학습 흐름"><strong>도수분포표</strong><div>{phases.map(item => <button key={item.id} disabled={!item.unlocked} aria-current={phase === item.id ? 'step' : undefined} className={`${phase === item.id ? 'active' : ''} ${item.done ? 'done' : ''}`} onClick={() => move(item.id)}>{item.done ? '✓ ' : ''}{item.label}</button>)}</div></div>
    <Suspense fallback={<p className="fl-flow-loading">학습 코스를 준비하고 있어요…</p>}>
      {phase === 'basic' && <FrequencyLearningPage onComplete={() => { setCompletion(previous => ({ ...previous, basic: true })); move('story'); }} />}
      {phase === 'story' && <FrequencyStoryPage onComplete={() => { setCompletion(previous => ({ ...previous, story: true })); move('assessment'); }} />}
      {phase === 'assessment' && <FrequencyAssessmentPage onBack={() => move('story')} onPassed={() => navigate('/main/home')} />}
    </Suspense>
  </div>;
}
