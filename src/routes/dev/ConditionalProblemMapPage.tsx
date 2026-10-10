import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MathText from '../../components/MathText';
import ProblemLearningMap from './ProblemLearningMap';
import ConditionalConceptLesson from './ConditionalConceptLesson';
import { CONDITIONAL_GOALS, CONDITIONAL_NODES, breakdownQuestion, correctProbabilityAnswer, parseProbabilityAnswer, unresolvedSupport } from './conditionalProblemBreakdown';
import type { LearningState } from './problemLearningModel';
import './LevelTestMapPreviewPage.css';
import './ProblemLearningPreviewPage.css';
import './ConditionalProblemMapPage.css';

export default function ConditionalProblemMapPage() {
  const [goalId, setGoalId] = useState(CONDITIONAL_GOALS[0].id);
  const goal = CONDITIONAL_GOALS.find(item => item.id === goalId)!;
  const [panelId, setPanelId] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState(goal.rootId);
  const [parents, setParents] = useState<string[]>([]);
  const [results, setResults] = useState<LearningState['results']>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'wrong' | 'unknown' | null>(null);
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState('');
  const screenRef = useRef<HTMLDivElement>(null);
  const node = panelId ? CONDITIONAL_NODES[panelId] : null;
  const question = node ? breakdownQuestion(node.id, attempts[node.id] ?? 0) : null;
  const support = node ? unresolvedSupport(node.id, results) : undefined;
  useEffect(() => { screenRef.current?.focus(); }, [panelId, reading, goalId]);

  const openNode = (id: string, chain: string[] = []) => {
    if (!goal.positions[id]) return;
    setPanelId(id); setCurrentId(id); setParents(chain); setReading(CONDITIONAL_NODES[id].kind === 'concept');
    setAnswer(''); setFeedback(null); setMessage('');
  };
  const submit = (unknown = false) => {
    if (!node || !question || reading || feedback || (!unknown && parseProbabilityAnswer(answer) === null)) return;
    const correct = !unknown && correctProbabilityAnswer(question.answer, answer);
    setResults(previous => ({ ...previous, [node.id]: correct ? 'passed' : 'failed' }));
    if (!correct) { setFeedback(unknown ? 'unknown' : 'wrong'); return; }
    const parent = parents.at(-1);
    setCurrentId(parent ?? goal.rootId);
    if (parent) {
      setParents(previous => previous.slice(0, -1));
      setAttempts(previous => ({ ...previous, [parent]: (previous[parent] ?? 0) + 1 }));
    }
    setPanelId(null); setAnswer('');
    setMessage(node.kind === 'BN' ? '목표 문제를 풀었어요.' : `${node.label} 확인 완료.${parent ? ` 이제 ‘${CONDITIONAL_NODES[parent].label}’로 돌아가요.` : ''}`);
  };
  const continueAfterWrong = () => {
    if (!node || !feedback) return;
    if (support) openNode(support, [...parents, node.id]);
    else {
      setAttempts(previous => ({ ...previous, [node.id]: (previous[node.id] ?? 0) + 1 }));
      setAnswer(''); setFeedback(null); setReading(node.kind === 'concept');
    }
  };
  const chooseGoal = (id: string) => {
    const next = CONDITIONAL_GOALS.find(item => item.id === id)!;
    setGoalId(id); setCurrentId(next.rootId); setPanelId(null); setParents([]); setMessage(''); setAnswer(''); setFeedback(null);
  };

  return <div className="cpm-page">
    <nav className="cpm-nav"><strong>수확행</strong><Link to="/dev/tag-map">개념 지도</Link></nav>
    <main ref={screenRef} tabIndex={-1}>
      <header className="cpm-header"><h1>문제 지도</h1><span>조건부확률</span></header>
      {!panelId ? <>
        <div className="cpm-tabs" role="tablist" aria-label="기출 문제 선택">{CONDITIONAL_GOALS.map((item, index) => <button key={item.id} role="tab" aria-selected={goalId === item.id} onClick={() => chooseGoal(item.id)}>
          <b>{results[item.rootId] === 'passed' ? '✓' : `0${index + 1}`}</b>{item.title}
        </button>)}</div>
        <section className="cpm-target" aria-label="목표 기출문제">
          <div><span>목표 문제</span><p><MathText text={breakdownQuestion(goal.rootId).prompt} /></p></div>
          <button className="cpm-primary" onClick={() => openNode(goal.rootId)}>목표 문제 풀기 →</button>
        </section>
        <section className="cpm-map" aria-label={`${goal.title} 문제 지도`}>
          <ProblemLearningMap goal={goal} nodes={CONDITIONAL_NODES} state={{ results, complete: results[goal.rootId] === 'passed' }} diagnostic={{}} currentId={currentId} columnGap={220} horizontalPadding={30}
            onSelectNode={id => openNode(id, id === currentId ? parents : [])} kindLabels={{ BN: 'BN · 기출', AN: 'AN · 미니 문제', concept: '개념' }} />
        </section>
        <footer className="cpm-map-footer"><span role="status">{message || '노드를 누르면 해당 문제와 개념을 볼 수 있어요.'}</span>
          {parents.length === 0 && currentId !== goal.rootId && <button onClick={() => openNode(goal.rootId)}>목표 문제로 돌아가기 →</button>}
        </footer>
      </> : node && question && <section className="cpm-study">
        <header><button className="cpm-text-button" onClick={() => setPanelId(null)}>← 지도로 돌아가기</button><span>{node.kind === 'BN' ? '목표 문제' : node.kind === 'AN' ? '미니 문제' : '개념'}</span></header>
        <div className="cpm-path">{parents.map(id => <span key={id}>{CONDITIONAL_NODES[id].label}<i>›</i></span>)}</div>
        <h2>{node.label}</h2>
        {reading ? <ConditionalConceptLesson key={`${node.id}:${attempts[node.id] ?? 0}`} nodeId={node.id} onConfirm={() => setReading(false)} /> : <>
          <p className="cpm-prompt"><MathText text={question.prompt} /></p>
          {node.kind === 'concept' && <button type="button" className="cpm-text-button cpm-review-concept" onClick={() => { setReading(true); setFeedback(null); setAnswer(''); }}>개념 다시 보기</button>}
          <form onSubmit={event => { event.preventDefault(); submit(); }}>
            <label>답안<input aria-label="답안" type="text" inputMode="text" autoComplete="off" placeholder="분수 또는 소수 (예: 1/2)" value={answer} disabled={!!feedback} onChange={event => setAnswer(event.target.value)} /></label>
            {!feedback && <div className="cpm-actions"><button type="button" className="cpm-text-button" onClick={() => submit(true)}>모르겠습니다</button><button className="cpm-primary" disabled={parseProbabilityAnswer(answer) === null}>확인</button></div>}
          </form>
          {feedback && <div className="cpm-feedback" role="status">
            <strong>{feedback === 'unknown' ? '필요한 부분부터 확인해 볼까요?' : '이 부분을 다시 확인해 볼까요?'}</strong>
            {support ? <><p>‘{CONDITIONAL_NODES[support].label}’부터 확인하고 이 문제로 돌아와요.</p><button className="cpm-primary" onClick={continueAfterWrong}>{CONDITIONAL_NODES[support].kind === 'concept' ? '개념 살펴보기' : '하위 문제 풀기'} →</button></>
              : <><p><MathText text={question.explanation} /></p><button className="cpm-primary" onClick={continueAfterWrong}>숫자를 바꿔 다시 풀기 →</button></>}
          </div>}
          {!feedback && <details className="cpm-requires"><summary>이 문제에 필요한 기초</summary>{node.requires.length ? node.requires.map(id => <button key={id} onClick={() => openNode(id, [...parents, node.id])}>{CONDITIONAL_NODES[id].label} →</button>) : <p>이 확인 문제는 기초 출발점이에요.</p>}</details>}
        </>}
      </section>}
    </main>
  </div>;
}
