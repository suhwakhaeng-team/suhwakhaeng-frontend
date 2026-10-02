import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import HomeDashboard from '../../components/home/HomeDashboard';
import CurriculumListSection from '../../components/home/CurriculumListSection';
import HomeKnowledgeGraphSection from '../../components/home/HomeKnowledgeGraphSection';
import FeedbackCard from '../../components/home/FeedbackCard';
import ProblemQuestionCard from '../../components/ProblemQuestionCard';
import ProblemContent from '../../components/ProblemContent';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { usePreviewSession } from './levelTestPreviewSession';
import { ANSWER_KEYS } from './levelTestPreviewState';
import { NODES as LEVEL_TEST_NODES } from './levelTestPreviewModel';
import ProblemLearningMap from './ProblemLearningMap';
import { LEARNING_GOALS, LEARNING_NODES, rankGoals, startingPath, startLearning, currentQuestion, submitLearning,
  continueLearning, finishReading, supportNode, conceptNodes, type Diagnostic, type LearningGoal, type LearningState } from './problemLearningModel';
import './LevelTestMapPreviewPage.css';
import './ProblemLearningPreviewPage.css';

// Local-only data adapter. No adaptive submission or account/diagnostic writes.
const EXAMPLE_DIAGNOSTIC: Diagnostic = { 'sum-rule': 'passed', 'product-rule': 'passed', factorial: 'failed', permutation: 'pruned', combination: 'pruned', 'math-probability': 'pruned', 'frequency-table': 'pruned' };
type View = 'home' | 'study' | 'map';
const card = { padding: spacing.xl, background: colors.white, borderRadius: radius.lg };
const textButton = { background: 'none', border: 'none', ...typography.bodyTextXLRegular, color: colors.gray500, cursor: 'pointer', padding: 0 };
const primaryButton = { padding: `${spacing.sm + 2}px ${spacing.xl}px`, background: colors.brand600, color: colors.white,
  border: 'none', borderRadius: radius.sm, ...typography.bodyTextXLSemiBold, fontSize: 16, cursor: 'pointer' };

export default function ProblemLearningPreviewPage() {
  const { user } = useAuth();
  const diagnosticSession = usePreviewSession();
  const [learningEvidence, setLearningEvidence] = useState<Diagnostic>({});
  const diagnostic: Diagnostic = { ...(diagnosticSession.isComplete ? diagnosticSession.statuses : EXAMPLE_DIAGNOSTIC), ...learningEvidence };
  const [completedGoals, setCompletedGoals] = useState<string[]>([]);
  const [archivedHistory, setArchivedHistory] = useState<LearningState['history']>([]);
  const [chosenGoal, setChosenGoal] = useState<string | null>(null);
  const [state, setState] = useState<LearningState | null>(null);
  const [view, setView] = useState<View>('home');
  const [mapReturn, setMapReturn] = useState<View>('home');
  const [notice, setNotice] = useState('');
  const pageRef = useRef<HTMLElement>(null);
  const ranked = rankGoals(diagnostic, completedGoals);
  const goal = LEARNING_GOALS.find(item => item.id === (state?.goalId ?? chosenGoal)) ?? ranked[0]?.goal ?? LEARNING_GOALS[0];
  const recommendation = rankGoals(diagnostic).find(item => item.goal.id === goal.id)!;
  const path = startingPath(goal, diagnostic);
  const node = LEARNING_NODES[state?.currentId ?? goal.rootId];
  const question = state ? currentQuestion(state) : LEARNING_NODES[goal.rootId].questions[0];
  const supportId = state ? supportNode(state, diagnostic) : undefined;
  const returning = state?.parents.at(-1);
  const history = [...archivedHistory, ...(state?.history ?? [])];
  const known = LEVEL_TEST_NODES.filter(item => diagnostic[item.id] === 'passed').length;
  const reviewItems = LEVEL_TEST_NODES.filter(item => diagnostic[item.id] === 'failed').map((item, index) => ({ id: index + 1, topicName: item.label, categoryName: '레벨테스트에서 확인할 개념' }));
  const reason = path.length > 1
    ? `${recommendation.known ? `필요한 기초 ${recommendation.known}개를 확인했어요. ` : ''}‘${LEARNING_NODES[path.at(-1)!].label}’부터 풀고 목표 문제로 돌아와요.`
    : '레벨테스트에서 확인한 기초를 이용해 풀어볼 문제예요.';

  useEffect(() => {
    pageRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [view, state?.currentId, state?.reading, state?.complete]);

  function begin(target: LearningGoal = goal, direct = false) {
    setState(startLearning(target, diagnostic, direct)); setView('study'); setNotice('');
  }
  function openMap() { setMapReturn(view); setView('map'); }
  function submit(answer: string | null) {
    if (state) setState(submitLearning(state, answer));
  }
  function nextGoal() {
    if (!state?.complete) return;
    const confirmed = Object.keys(state.results).filter(id => state.results[id] === 'passed' && LEARNING_NODES[id].kind === 'concept');
    setLearningEvidence(previous => ({ ...previous, ...Object.fromEntries(confirmed.map(id => [LEARNING_NODES[id].conceptId!, 'passed'])) }));
    setArchivedHistory(previous => [...previous, ...state.history]);
    setCompletedGoals(ids => [...new Set([...ids, goal.id])]);
    setChosenGoal(null); setState(null); setView('home');
  }
  function resume() { if (state) { setView('study'); setNotice(''); } else begin(); }
  function mainNavigate(target: string) {
    if (target === '/main/home') { setView('home'); setNotice(''); }
    else { setView('home'); setNotice('이번 미리보기는 홈 → 문제 학습 흐름만 연결했어요. 기존 계정 화면은 변경하지 않았어요.'); }
  }
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (view !== 'study' || !state || state.complete || state.reading || state.feedback || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (key === 'a' || key === 'd') { event.preventDefault(); submit(key === 'a' ? currentQuestion(state).answer : null); }
      const index = Number(key) - 1;
      if (question.choices && index >= 0 && index < 4) { event.preventDefault(); setState(current => current ? { ...current, selected: ANSWER_KEYS[index] } : current); }
      if (key === 'enter' && state.selected && !(event.target instanceof HTMLElement && event.target.closest('button,a'))) { event.preventDefault(); submit(state.selected); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const map = <ProblemLearningMap goal={goal} state={state} diagnostic={diagnostic} currentId={state?.currentId ?? path.at(-1)!} />;
  const legend = <div className="plm-live-legend"><span><i style={{ background: colors.brand600 }} />현재</span><span><i style={{ background: colors.green500 }} />확인·해결</span><span><i style={{ background: colors.red500 }} />학습 중</span><span><i style={{ background: colors.gray300 }} />미확인</span></div>;

  return <div className="plm-live-preview"><MainLayout activePath={view === 'home' ? '/main/home' : '/main/problem/start'} onNavigate={mainNavigate}>
    <main ref={pageRef} tabIndex={-1} data-screen={`learning-${view}`}>
      {view === 'home' ? <>
        <div className="plm-local-note">로컬 미리보기 · 검수본의 실제 BN {LEARNING_GOALS.length}개 · {diagnosticSession.isComplete ? '레벨테스트 결과 반영' : '예시 진단 사용'} · 계정에 저장하지 않아요. <Link to="/dev/level-test">레벨테스트 보기</Link><Link to="/dev/ut1">중복조합 1차 UT →</Link></div>
        {notice && <p className="plm-live-notice" role="status">{notice}</p>}
        <HomeDashboard nickname={user?.nickname || user?.name || '학생'} grade={user?.grade ?? 5}
          recommendation={ranked.length || state ? <CurriculumListSection
            items={[{ id: goal.id, topicName: goal.title, categoryPath: `${goal.domain} · BN #${goal.questionId}`, problemCount: 1, reasoning: reason }]}
            activeId={goal.id} onSolveClick={() => state?.complete ? setView('study') : resume()}
            actionLabel={state?.complete ? '학습 결과 보기' : state ? '이어서 풀기' : '문제 풀기'} showReasoning />
            : <section style={card}><h3 style={{ ...typography.headingLgBold, margin: 0 }}>오늘의 추천</h3><p>준비된 목표 문제 {LEARNING_GOALS.length}개를 모두 풀었어요.</p><button style={textButton} onClick={() => { setCompletedGoals([]); setLearningEvidence({}); setArchivedHistory([]); }}>다시 체험하기</button></section>}
          feedback={<FeedbackCard onClick={() => setNotice('피드백 전송은 기존 서비스 기능이에요. 이 미리보기에서는 전송하지 않아요.')} />}
          reviewItems={reviewItems} onReviewSeeAll={() => setNotice('복습할 개념은 레벨테스트에서 직접 틀린 개념이에요. 미진단 개념을 오답으로 처리하지 않아요.')}
          onReviewItemClick={item => {
            const target = ranked.find(entry => conceptNodes(entry.goal).some(concept => concept.label === item.topicName));
            if (target && !state) begin(target.goal);
            else if (state) resume();
            else setNotice('이 개념의 문제 경로는 아직 준비하지 않았어요.');
          }}
          progressPercent={known / LEVEL_TEST_NODES.length} progressLabel={`진단·학습에서 확인한 개념 ${known}개`} progressHeading="님의 개념 확인 현황"
          todaySolvedCount={history.length} streakDays={history.length ? 1 : 0}
          maps={<>
            <section style={card} className="plm-home-map">
              <div className="plm-section-row"><h3 style={{ ...typography.headingLgBold, margin: 0 }}>문제 지도</h3><button style={{ ...textButton, color: colors.brand500, ...typography.captionSemiBold }} onClick={openMap}>크게 보기 →</button></div>
              <div className="plm-section-row"><p className="plm-live-muted">오늘의 목표 문제와, 풀기 위해 필요한 문제·개념이에요.</p>
                {!state && !!ranked.length && <select aria-label="목표 문제 선택" value={goal.id} onChange={event => setChosenGoal(event.target.value)}>{ranked.map(entry => <option key={entry.goal.id} value={entry.goal.id}>#{entry.goal.questionId} {entry.goal.title}{entry.goal.id === ranked[0].goal.id ? ' · 추천' : ''}</option>)}</select>}
              </div>
              {map}{legend}
              <p className="plm-local-note">번호가 있는 BN·AN은 실제 문제은행 검수본(9/30)입니다. ‘보충’은 시안용 문제이며, 연결은 태그 일치가 아닌 풀이에 필요한 관계로 구성했어요.</p>
              <div className="plm-section-row"><span style={{ ...typography.bodyTextLgRegular, color: colors.gray600 }}>{goal.title}</span><button style={textButton} onClick={() => state ? resume() : begin(goal, true)}>{state ? '학습 이어가기 →' : '목표 문제부터 도전 →'}</button></div>
            </section>
            <HomeKnowledgeGraphSection preview onCurriculumClick={() => setNotice('아래 개념 지도는 기존 프론트의 예시 데이터예요. 새 학습 경로는 위 문제 지도에서 확인해요.')} />
          </>} />
      </> : view === 'map' ? <section style={card} className="plm-live-full-map">
        <div className="plm-section-row"><button style={textButton} onClick={() => setView(mapReturn)}>← {mapReturn === 'home' ? '홈' : '문제로 돌아가기'}</button><h2 style={{ ...typography.headingXLBold, margin: 0 }}>{goal.title}</h2></div>
        {map}{legend}
      </section> : state && <div className="plm-live-solver" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="plm-section-row" style={{ marginBottom: spacing.xl }}><button style={textButton} onClick={() => setView('home')}>← 나가기</button><button style={{ ...textButton, ...typography.captionSemiBold }} onClick={openMap}>문제 지도 보기 →</button></div>
        {state.complete ? <>
          <div className="plm-live-result"><span>○</span><h2>목표 문제를 풀었어요</h2><p>{goal.title}</p></div>
          <p className="plm-live-muted">{state.history.some(record => LEARNING_NODES[record.nodeId].kind !== 'BN') ? '하위 문제에서 확인한 내용을 사용해 목표 문제까지 직접 풀었어요.' : '목표 문제를 직접 풀어 해결했어요.'}</p>
          <div style={{ marginBottom: spacing.xl }}>{map}</div>
          <button style={{ ...primaryButton, width: '100%' }} onClick={nextGoal}>홈에서 다음 추천 보기 →</button>
        </> : <>
          <div className="plm-live-path" aria-label="현재 학습 경로">{[...state.parents, state.currentId].map((id, index) => <span key={`${id}-${index}`}><span className={id === state.currentId ? 'is-current' : ''}>{LEARNING_NODES[id].label}</span>{index < state.parents.length && <i>›</i>}</span>)}</div>
          {returning && <p className="plm-live-muted">이 부분을 확인한 다음 ‘{LEARNING_NODES[returning].label}’ 문제로 돌아가요.</p>}
          {state.reading ? <>
            <h2 style={typography.headingXLBold}>{node.label}</h2>
            <div style={{ padding: spacing.xl, background: colors.gray50, borderRadius: radius.md, ...typography.bodyTextXLRegular, lineHeight: 1.8 }}><ProblemContent content={node.note!} /></div>
            <button style={{ ...primaryButton, marginTop: spacing.xl }} onClick={() => setState(finishReading(state))}>확인 문제 풀기 →</button>
          </> : <>
            <ProblemQuestionCard tagLabel={`${node.source === 'bank' ? `실제 ${node.kind} #${node.questionId}` : node.kind === 'concept' ? '개념 확인 · 시안' : 'AN 보충 · 시안'} · ${node.label}`}
              problem={{ description: question.prompt, answerType: question.answerType ?? 'MULTIPLE_CHOICE', choiceA: question.choices?.[0], choiceB: question.choices?.[1], choiceC: question.choices?.[2], choiceD: question.choices?.[3] }}
              value={state.selected ?? ''} onChange={value => setState({ ...state, selected: value })} disabled={!!state.feedback} />
            {question.reference && <div className="plm-question-reference"><span>참고 표</span><ProblemContent content={question.reference} /></div>}
            {question.answerType === 'NUMBER' && <label className="plm-number-answer">답안<input aria-label="숫자 답안" inputMode="decimal" placeholder="숫자로 입력하세요" value={state.selected ?? ''} disabled={!!state.feedback}
              onChange={event => setState({ ...state, selected: event.target.value })}
              onKeyDown={event => { if (event.key === 'Enter' && state.selected?.trim() && !state.feedback) { event.preventDefault(); submit(state.selected); } }} /></label>}
            {!state.feedback ? <div className="plm-live-actions"><button style={textButton} onClick={() => submit(null)}>모르겠습니다</button><button style={{ ...primaryButton, background: state.selected?.trim() ? colors.brand600 : colors.gray300, cursor: state.selected?.trim() ? 'pointer' : 'not-allowed' }} disabled={!state.selected?.trim()} onClick={() => submit(state.selected)}>확인</button></div>
            : <div className="plm-live-feedback" role="status" style={{ background: state.feedback === 'correct' ? '#F0FDF4' : colors.brand50 }}>
              <h3 style={{ ...typography.headingMdBold, margin: 0, color: state.feedback === 'correct' ? '#15803D' : colors.brand700 }}>{state.feedback === 'correct' ? '정답입니다!' : state.feedback === 'unknown' ? '필요한 기초부터 확인해 볼게요' : '이 부분을 먼저 확인해 볼까요?'}</h3>
              <p className="plm-live-muted">{state.feedback === 'correct' ? returning ? `‘${LEARNING_NODES[returning].label}’ 문제로 돌아가요.` : '오늘의 목표 문제를 해결했어요.' : supportId ? `‘${LEARNING_NODES[supportId].label}’${LEARNING_NODES[supportId].kind === 'concept' ? ' 개념을' : ' 문제를'} 먼저 살펴봐요.` : '풀이를 살펴보고 다시 풀어보세요.'}</p>
              {(state.feedback === 'correct' || !supportId) && <details className="plm-solution"><summary>풀이 보기</summary><ProblemContent content={question.explanation} /></details>}
              <button style={{ ...primaryButton, marginTop: spacing.md }} onClick={() => setState(continueLearning(state, diagnostic))}>{state.feedback === 'correct' ? returning ? '상위 문제로 돌아가기 →' : '학습 결과 보기 →' : supportId ? LEARNING_NODES[supportId].kind === 'concept' ? '개념 살펴보기 →' : '하위 문제 풀기 →' : '다시 풀기 →'}</button>
            </div>}
            {!state.feedback && node.requires.length > 0 && <details className="plm-solution"><summary>이 문제에 필요한 기초</summary>{node.requires.map(id => <p key={id}>{LEARNING_NODES[id].label}</p>)}</details>}
            {!!node.bankTags?.length && <details className="plm-solution"><summary>문제은행 원본 태그</summary><p>{node.bankTags.join(' · ')}</p></details>}
          </>}
        </>}
      </div>}
    </main>
  </MainLayout></div>;
}
