import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProblemContent from '../../components/ProblemContent';
import LevelTestUnitMap from './LevelTestUnitMap';
import { LEVEL_TEST_QUESTIONS } from './levelTestQuestionBank';
import {
  DOMAINS, NODES, CONCEPT_TEST_ORDER, NODE_BY_ID, type TransitionState,
} from './levelTestPreviewModel';
import { updatePreviewSession, usePreviewSession } from './levelTestPreviewSession';
import { ANSWER_KEYS, continueAfterUnitReview, emptyPreviewSession, submitUnitAnswer, unitReviewMapStatuses, type PreviewAnswer, type ReviewPhase } from './levelTestPreviewState';
import { LEARNING_NODES, rankGoals, startingPath } from './problemLearningModel';
import './LevelTestMapPreviewPage.css';


export default function LevelTestMapPreviewPage() {
  const session = usePreviewSession();
  const { statuses, currentId, selectedAnswer, isComplete, history, unitReview } = session;
  const [showResultMap, setShowResultMap] = useState(false);
  const [activeMapDomain, setActiveMapDomain] = useState<string>(DOMAINS[0].name);
  // Session progress drives the screen, not the URL: answer → unit review → answer.
  const view = unitReview || (isComplete && showResultMap) ? 'map' : 'test';
  const reviewKey = unitReview ? `${unitReview.domain}:${history.length}:${session.questionStartedAt}` : '';
  const [animation, setAnimation] = useState<{ key: string; phase: ReviewPhase }>({ key: '', phase: 'waiting' });
  const phase = animation.key === reviewKey ? animation.phase : 'waiting';
  const animationComplete = !!unitReview && phase === 'done';
  const transition: TransitionState | null = unitReview && phase === 'pass'
    ? { kind: 'pass', nodeIds: unitReview.passedIds, rootIds: [] }
    : unitReview && phase === 'prune'
    ? { kind: 'prune', nodeIds: unitReview.prunedIds, rootIds: unitReview.failedIds } : null;
  const mapStatuses = unitReviewMapStatuses(session, phase);
  const pageRef = useRef<HTMLElement | null>(null);

  const currentQuestion = LEVEL_TEST_QUESTIONS[currentId];
  const prunedCount = Object.values(statuses).filter(status => status === 'pruned').length;
  const passedCount = Object.values(statuses).filter(status => status === 'passed').length;
  const failedCount = Object.values(statuses).filter(status => status === 'failed').length;
  const answeredCount = passedCount + failedCount;

  useEffect(() => {
    // Each in-page screen starts at its heading, including keyboard focus.
    window.scrollTo(0, 0);
    pageRef.current?.focus({ preventScroll: true });
  }, [view, currentId, isComplete]);


  useEffect(() => {
    if (view !== 'map' || !unitReview) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const start = reducedMotion ? 0 : 220;
    const passDuration = unitReview.passedIds.length ? 900 + Math.max(0, unitReview.passedIds.length - 1) * 110 : 0;
    const pruneDuration = unitReview.failedIds.length || unitReview.prunedIds.length ? 1800 : 0;
    const schedule = (delay: number, nextPhase: ReviewPhase) => timers.push(setTimeout(() => setAnimation({ key: reviewKey, phase: nextPhase }), delay));
    if (reducedMotion) schedule(0, 'done');
    else {
      if (passDuration) schedule(start, 'pass');
      if (pruneDuration) schedule(start + passDuration, 'prune');
      schedule(start + passDuration + pruneDuration, 'done');
    }
    return () => timers.forEach(clearTimeout);
  }, [view, unitReview, reviewKey]);

  function resolveAnswer(input: PreviewAnswer) {
    updatePreviewSession(state => state.currentId === currentId ? submitUnitAnswer(state, input) : state);
    pageRef.current?.focus({ preventScroll: true });
  }

  function submitAnswer() {
    if (!selectedAnswer || unitReview) return;
    resolveAnswer({ type: 'answer', answer: selectedAnswer });
  }

  function continueTest() {
    if (!animationComplete) return;
    updatePreviewSession(state => state.currentId === currentId ? continueAfterUnitReview(state) : state);
    pageRef.current?.focus({ preventScroll: true });
  }

  function reset() {
    setShowResultMap(false);
    updatePreviewSession(emptyPreviewSession());
    pageRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }


  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && !!target.closest('input, textarea, select, [contenteditable="true"]');
      if (isTyping || event.repeat || event.ctrlKey || event.altKey || event.metaKey || isComplete) return;
      const key = event.key.toLowerCase();
      const numberIndex = Number(key) - 1;
      // Keep Enter/Space activation of focused links and buttons accessible.
      if (key === 'enter' && target instanceof HTMLElement && target.closest('a, button')) return;
      if (unitReview) {
        if (key === 'enter' && animationComplete) { event.preventDefault(); continueTest(); }
        return;
      }
      if (view === 'test' && numberIndex >= 0 && numberIndex < 4) {
        event.preventDefault();
        updatePreviewSession({ selectedAnswer: ANSWER_KEYS[numberIndex] });
      } else if (key === 'enter') {
        event.preventDefault();
        if (view === 'test') submitAnswer();
      } else if (key === 'a') {
        event.preventDefault();
        resolveAnswer({ type: 'demo', isCorrect: true });
      } else if (key === 'd') {
        event.preventDefault();
        resolveAnswer({ type: 'demo', isCorrect: false });
      }
    }
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  });

  const recommendedGoal = rankGoals(statuses)[0].goal;
  const learningPath = startingPath(recommendedGoal, statuses);
  const unknownCount = history.filter(record => record.skipped).length;

  if (unitReview) return (
    <main ref={pageRef} tabIndex={-1} data-screen="unit-review" data-review-phase={phase} className="ltm-page ltm-page--unit-review">
      <section className="ltm-unit-stage" aria-labelledby="ltm-unit-title">
        <h1 id="ltm-unit-title">{unitReview.domain}</h1>
        <LevelTestUnitMap domain={unitReview.domain} statuses={mapStatuses} transition={transition} />
        <p className="ltm-sr-only" role="status">{phase === 'waiting' ? '단원 결과 준비 중' : phase === 'pass' ? '통과한 개념 표시 중' : phase === 'prune' ? '후속 가지 생략 표시 중' : '단원 결과 확인 완료'}</p>
        <div className="ltm-unit-stage-next">
          {animationComplete && <button type="button" className="ltm-primary-action" onClick={continueTest}>{unitReview.nextId ? '다음 단원으로 →' : '최종 결과 보기 →'}</button>}
        </div>
      </section>
    </main>
  );

  return (
    <main ref={pageRef} tabIndex={-1} data-screen={unitReview ? 'unit-review' : isComplete ? showResultMap ? 'result-map' : 'result' : 'questions'} data-review-phase={unitReview ? phase : 'none'} className={`ltm-page ltm-page--${view}`}>
      <section key={`${view}-${isComplete ? 'complete' : 'ongoing'}`} className={`ltm-workspace is-${view}`}>
        {view === 'test' && !unitReview && <div className="ltm-test-content">
        <aside className="ltm-question-panel">
          {isComplete ? (
            <div className="ltm-complete">
              <h1>레벨테스트 결과</h1>
              <p>이번에 푼 문제를 기준으로 정리했어요.</p>
              <div className="ltm-result-grid">
                <div><strong>{passedCount}</strong><span>맞힌 개념</span></div>
                <div><strong>{failedCount}</strong><span>복습할 개념</span></div>
                <div><strong>{prunedCount}</strong><span>아직 풀지 않은 개념</span></div>
              </div>
              <div className="ltm-recommendation">
                <span>추천 목표 문제</span>
                <strong>{recommendedGoal.title}</strong>
                <p>{learningPath.length > 1 ? `‘${LEARNING_NODES[learningPath.at(-1)!].label}’부터 확인하고 목표 문제에 도전하세요.` : '확인한 기초를 사용해 목표 문제에 도전하세요.'}</p>
                <Link className="ltm-primary-action" to="/dev/problem-learning">연결된 문제로 학습하기 →</Link>
              </div>
              <button type="button" className="ltm-primary-action" onClick={() => { setActiveMapDomain(DOMAINS[0].name); setShowResultMap(true); }}>개념 지도 보기 →</button>
              <button type="button" className="ltm-retry-action" onClick={reset}>테스트 다시 하기</button>
            </div>
          ) : (
            <>
              <h1 className="ltm-question-number">{answeredCount + 1}번</h1>
              <div className="ltm-question-copy">
                <div className="ltm-question-title"><ProblemContent content={currentQuestion.prompt} /></div>
              </div>

              <div className="ltm-choice-list" role="radiogroup" aria-label="답안 선택">
                {currentQuestion.choices.map((choice, index) => {
                  const key = ANSWER_KEYS[index];
                  const isSelected = selectedAnswer === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isSelected || (!selectedAnswer && index === 0) ? 0 : -1}
                      className={`ltm-choice${isSelected ? ' is-selected' : ''}`}
                      onClick={() => updatePreviewSession({ selectedAnswer: key })}
                      onKeyDown={event => {
                        if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
                        event.preventDefault();
                        const offset = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
                        const nextIndex = (index + offset + ANSWER_KEYS.length) % ANSWER_KEYS.length;
                        updatePreviewSession({ selectedAnswer: ANSWER_KEYS[nextIndex] });
                        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[nextIndex]?.focus();
                      }}
                    >
                      <span>{key}</span>
                      <div><ProblemContent content={choice} /></div>
                    </button>
                  );
                })}
              </div>

              <div className="ltm-answer-actions">
                <button type="button" className="ltm-unknown" onClick={() => resolveAnswer({ type: 'unknown' })}>모르겠습니다</button>
                <button type="button" className="ltm-submit" onClick={submitAnswer} disabled={!selectedAnswer}>다음</button>
              </div>
            </>
          )}
        </aside>
        {isComplete && <section className="ltm-result-details" aria-label="진단 결과 상세">
          <div className="ltm-result-section-head"><h2>단원별 결과</h2><span>총 {answeredCount}문항 · ‘모르겠습니다’ {unknownCount}문항</span></div>
          <div className="ltm-domain-results">
            {DOMAINS.map(domain => {
              const domainNodes = NODES.filter(node => node.domain === domain.name);
              const passed = domainNodes.filter(node => statuses[node.id] === 'passed').length;
              const failed = domainNodes.filter(node => statuses[node.id] === 'failed').length;
              const untested = domainNodes.length - passed - failed;
              return <div key={domain.name}>
                <strong>{domain.name}</strong>
                <div className="ltm-domain-result-bar" aria-label={`정답 ${passed}, 복습 필요 ${failed}, 미진단 ${untested}`}>
                  <i className="is-passed" style={{ width: `${passed / domainNodes.length * 100}%` }} />
                  <i className="is-failed" style={{ width: `${failed / domainNodes.length * 100}%` }} />
                  <i className="is-pruned" style={{ width: `${untested / domainNodes.length * 100}%` }} />
                </div>
                <span>정답 <b>{passed}</b> · 복습 필요 <b>{failed}</b> · 미진단 <b>{untested}</b></span>
              </div>;
            })}
          </div>
          <p className="ltm-result-caution">{prunedCount > 0 && <>풀지 않은 개념은 오답이 아니에요. 앞선 개념에서 막히면 연결된 문제는 건너뛰도록 했어요.<br /></>}개념마다 한 문제씩만 풀었으니, 결과는 복습할 내용을 정할 때 참고해 주세요.</p>
          {failedCount > 0 && <div className="ltm-starting-points">
            <h3>복습할 개념</h3>
            <div>{CONCEPT_TEST_ORDER.filter(id => statuses[id] === 'failed').map(id => <span key={id}>{NODE_BY_ID.get(id)?.label}</span>)}</div>
          </div>}
          {history.length > 0 && <div className="ltm-answer-review">
            <div className="ltm-result-section-head"><h2>푼 문제 다시 보기</h2><span>문제를 누르면 답과 해설을 볼 수 있어요.</span></div>
            {history.map((record, index) => {
              const question = LEVEL_TEST_QUESTIONS[record.conceptId];
              return <details key={record.conceptId}>
                <summary><span>{String(index + 1).padStart(2, '0')}</span><strong>{NODE_BY_ID.get(record.conceptId)?.label}</strong>
                  <b className={record.isCorrect ? 'is-correct' : 'is-wrong'}>{record.demo ? '시연 · ' : ''}{record.skipped ? '모르겠습니다' : record.isCorrect ? '정답' : '오답'}</b>
                </summary>
                <div className="ltm-review-body">
                  <ProblemContent content={question.prompt} />
                  <div className="ltm-review-answer">내 답: {record.demo ? '시연 처리' : record.skipped ? '모르겠습니다' : record.selectedAnswer} · 정답: {question.answer}</div>
                  <ProblemContent content={question.choices[ANSWER_KEYS.indexOf(question.answer)]} />
                  <div className="ltm-explanation"><ProblemContent content={question.explanation} /></div>
                </div>
              </details>;
            })}
          </div>}
        </section>}
        </div>}

        {view === 'map' && <section className="ltm-map-card" aria-labelledby="ltm-result-map-title">
          <h1 id="ltm-result-map-title" className="ltm-sr-only">개념 지도</h1>
          <header className="ltm-result-map-header">
            <button type="button" className="ltm-map-back" onClick={() => setShowResultMap(false)}>← 결과 보기</button>
            <nav className="ltm-domain-nav" aria-label="단원 선택">
              {DOMAINS.map(domain => <button type="button" key={domain.name}
                onClick={() => setActiveMapDomain(domain.name)} aria-pressed={activeMapDomain === domain.name}
                className={activeMapDomain === domain.name ? 'is-active' : ''}>{domain.name}</button>)}
            </nav>
          </header>
          <LevelTestUnitMap key={activeMapDomain} domain={activeMapDomain} statuses={statuses} transition={null} variant="result" />
          <div className="ltm-result-map-legend ltm-legend" aria-label="노드 상태 범례">
            <span><i className="is-passed" />맞힌 개념</span>
            <span><i className="is-failed" />복습할 개념</span>
            <span title="앞선 개념의 결과에 따라 이번 테스트에서 풀지 않은 개념"><i className="is-pruned" />안 푼 개념</span>
          </div>
        </section>}
      </section>
    </main>
  );
}
