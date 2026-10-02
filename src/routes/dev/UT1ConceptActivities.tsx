import { useState } from 'react';
import {
  addOutfit, chainAnswer, chainLevels, chainProblem, checkProductExpression, classifyProduct, missingOutfits, outfitKey,
  PRODUCT_EXTRA_SHIRT, PRODUCT_PANTS, PRODUCT_SHIRTS, PRODUCT_STAGES, readWhole,
  arrangementCount, barsToBins, binsToSymbols, countingPractice, distributionCount,
  fallingFactors, groupedChoices, orderedChoices, remainingAfterMinimum, selectionKey,
  type ChainProblem, type CountingSkill, type Item, type ProductMistake,
} from './ut1ConceptActivityModel';
import ProblemContent from '../../components/ProblemContent';
import './UT1ConceptActivities.css';

// 개념 학습 활동. 활동을 끝내면 onComplete로 확인 문제를 열 뿐, 노드 통과·테스트 점수에는 관여하지 않는다.
type ActivityProps = { nodeId: string; summary?: string; retry?: boolean; onComplete: () => void };

export default function GuidedConceptActivity({ nodeId, summary, retry = false, onComplete }: ActivityProps) {
  if (nodeId === 'c-product') return <ProductRuleActivity summary={summary} retry={retry} onComplete={onComplete} />;
  if (nodeId === 'c-factorial' || nodeId === 'c-permutation') return <ArrangementActivity skill={nodeId === 'c-factorial' ? 'factorial' : 'permutation'} retry={retry} onComplete={onComplete} />;
  if (nodeId === 'c-combination') return <CombinationActivity retry={retry} onComplete={onComplete} />;
  if (nodeId === 'c-repetition' || nodeId === 'c-minimum') return <DistributionActivity minimum={nodeId === 'c-minimum'} retry={retry} onComplete={onComplete} />;
  return null;
}

function Stages({ current, done }: { current: number; done: boolean }) {
  return <ol className="uca-steps" aria-label="학습 단계">
    {PRODUCT_STAGES.map((label, i) => <li key={label} className={done || i < current ? 'is-done' : i === current ? 'is-current' : ''} aria-current={i === current && !done ? 'step' : undefined}>
      <span>{done || i < current ? '✓' : i + 1}</span>{label}
    </li>)}
  </ol>;
}

function Swatch({ item }: { item: Item }) {
  return <i className="uca-swatch" style={{ background: item.color }} aria-hidden="true" />;
}

function ItemChip({ item, pressed, onClick }: { item: Item; pressed?: boolean; onClick?: () => void }) {
  if (!onClick) return <span className="uca-chip"><Swatch item={item} />{item.label}</span>;
  return <button type="button" className="uca-chip" aria-pressed={!!pressed} onClick={onClick}><Swatch item={item} />{item.label}</button>;
}

function NumberField({ value, onChange, onSubmit, label, placeholder = '숫자', disabled = false }: {
  value: string; onChange: (value: string) => void; onSubmit?: () => void; label: string; placeholder?: string; disabled?: boolean;
}) {
  return <input className="uca-number" inputMode="numeric" autoComplete="off" aria-label={label} placeholder={placeholder} value={value} disabled={disabled}
    onChange={event => onChange(event.target.value)}
    onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && onSubmit) { event.preventDefault(); onSubmit(); } }} />;
}

type RowMode = 'hidden' | 'ghost' | 'new';
function OutfitGrid({ shirts, made, missing = [], flash = null, rowCounts = false, extra = 'hidden' }: {
  shirts: Item[]; made: string[]; missing?: string[]; flash?: string | null; rowCounts?: boolean; extra?: RowMode;
}) {
  const rows = extra === 'hidden' ? shirts : [...shirts, PRODUCT_EXTRA_SHIRT];
  return <div className="uca-grid-wrap"><table className="uca-grid">
    <caption>티셔츠는 줄, 바지는 칸</caption>
    <thead><tr><td />{PRODUCT_PANTS.map(item => <th key={item.id} scope="col"><Swatch item={item} />{item.label}</th>)}{rowCounts && <td />}</tr></thead>
    <tbody>{rows.map(shirt => {
      const isExtra = shirt.id === PRODUCT_EXTRA_SHIRT.id;
      return <tr key={shirt.id} className={isExtra ? `is-extra is-${extra}` : ''}>
        <th scope="row"><Swatch item={shirt} />{shirt.label}</th>
        {PRODUCT_PANTS.map(item => {
          const key = outfitKey(shirt.id, item.id);
          const filled = made.includes(key) || (isExtra && extra === 'new');
          const state = filled ? 'is-made' : missing.includes(key) ? 'is-missing' : '';
          return <td key={key} className={`${state}${flash === key ? ' is-flash' : ''}`}>
            {filled ? <span className="uca-outfit" aria-label={`${shirt.label}와 ${item.label}`}><Swatch item={shirt} /><Swatch item={item} /></span>
              : missing.includes(key) || (isExtra && extra === 'ghost') ? <span aria-label="아직 만들지 않음">?</span> : null}
          </td>;
        })}
        {rowCounts && <td className="uca-row-count">{isExtra && extra === 'new' ? `+${PRODUCT_PANTS.length}가지` : `${PRODUCT_PANTS.length}가지`}</td>}
      </tr>;
    })}</tbody>
  </table></div>;
}

function ChainTree({ problem }: { problem: ChainProblem }) {
  const levels = chainLevels(problem);
  return <div className="uca-tree" role="img" aria-label={`${problem.steps.map(step => `${step.label} ${step.count}${step.unit}`).join(', ')}를 차례로 고르는 가지 그림. 끝 가지는 모두 ${chainAnswer(problem)}개`}>
    {levels.map((level, i) => <div key={problem.steps[i].label} className="uca-tree-row">
      <span className="uca-tree-label">{problem.steps[i].label}<small>{i === 0 ? `${level.perGroup}가지` : `${level.groups}묶음 × ${level.perGroup}`}</small></span>
      <span className="uca-tree-groups">{Array.from({ length: level.groups }, (_, g) => <span key={g} className="uca-tree-group">
        {Array.from({ length: level.perGroup }, (__, d) => <i key={d} className={i === levels.length - 1 ? 'is-leaf' : ''} />)}
      </span>)}</span>
      <b>{level.total}</b>
    </div>)}
    <p>{problem.steps.map(step => step.count).join(' × ')} = {chainAnswer(problem)}</p>
  </div>;
}

function ProductRuleActivity({ summary, retry, onComplete }: { summary?: string; retry: boolean; onComplete: () => void }) {
  const rows = PRODUCT_SHIRTS.length; const columns = PRODUCT_PANTS.length; const total = rows * columns;
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  // 1. 예상하기
  const [guessInput, setGuessInput] = useState('');
  const [guess, setGuess] = useState<number | null | undefined>(undefined);
  // 2. 직접 만들기
  const [shirt, setShirt] = useState<string | null>(null);
  const [pants, setPants] = useState<string | null>(null);
  const [made, setMade] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [built, setBuilt] = useState(false);
  const [expression, setExpression] = useState(['', '', '']);
  const [expressionOk, setExpressionOk] = useState(false);
  // 3. 규칙 찾기
  const [extendInput, setExtendInput] = useState('');
  const [extendResult, setExtendResult] = useState<ProductMistake | null>(null);
  // 4. 혼자 풀기
  const [variant, setVariant] = useState(0);
  const [chainInput, setChainInput] = useState('');
  const [missed, setMissed] = useState<{ problem: ChainProblem; mistake: ProductMistake } | null>(null);
  const chain = chainProblem(variant);

  function goTo(next: number) { setStage(next); setMessage(''); }

  function pick(kind: 'shirt' | 'pants', id: string) {
    const nextShirt = kind === 'shirt' ? id : shirt; const nextPants = kind === 'pants' ? id : pants;
    setMissing([]);
    if (!nextShirt || !nextPants) {
      if (kind === 'shirt') setShirt(id); else setPants(id);
      setFlash(null);
      setMessage(kind === 'shirt' ? '이제 바지를 골라요.' : '이제 티셔츠를 골라요.');
      return;
    }
    const result = addOutfit(made, nextShirt, nextPants);
    const shirtLabel = PRODUCT_SHIRTS.find(item => item.id === nextShirt)!.label; const pantsLabel = PRODUCT_PANTS.find(item => item.id === nextPants)!.label;
    setFlash(outfitKey(nextShirt, nextPants));
    setMade(result.made); setShirt(null); setPants(null);
    setMessage(result.duplicate ? `${shirtLabel}와 ${pantsLabel}는 이미 만들었어요. 다른 조합을 찾아보세요.` : `${shirtLabel}와 ${pantsLabel}를 만들었어요.`);
  }

  function finishBuilding() {
    const left = missingOutfits(made, PRODUCT_SHIRTS, PRODUCT_PANTS);
    setFlash(null);
    if (left.length) { setMissing(left); setMessage(`아직 만들지 않은 옷차림이 ${left.length}가지 있어요. 표의 물음표 칸을 채워 보세요.`); return; }
    setBuilt(true); setMessage('');
  }

  function checkExpression() {
    const [a, b, c] = expression.map(readWhole);
    if (checkProductExpression(a, b, c, rows, columns)) {
      setExpressionOk(true);
      setMessage(`맞아요. 티셔츠 한 벌마다 바지가 ${columns}가지씩이라 ${rows} × ${columns} = ${total}이에요.`);
      return;
    }
    const sameFactors = (a === rows && b === columns) || (a === columns && b === rows);
    setMessage(sameFactors ? `${rows} × ${columns}를 다시 계산해 보세요. 표의 칸 수와 같아야 해요.`
      : `표에는 티셔츠 ${rows}줄이 있고, 줄마다 바지 ${columns}칸이 있어요. 줄 수와 한 줄의 칸 수를 곱해요.`);
  }

  function checkExtension() {
    const value = readWhole(extendInput);
    if (value === null) { setMessage('숫자로 입력해 주세요.'); return; }
    const result = classifyProduct(value, [rows + 1, columns], total);
    setExtendResult(result);
    if (result === 'correct') { setMessage(`맞아요. 한 줄이 늘어서 ${total} + ${columns} = ${(rows + 1) * columns}, 곧 ${rows + 1} × ${columns}예요.`); return; }
    setMessage(result === 'added-one' ? `옷차림이 1가지만 늘지 않아요. 노란 티로도 바지 ${columns}가지를 입을 수 있어서 한 줄(${columns}가지)이 늘어요. 다시 세어 보세요.`
      : result === 'added' ? `티셔츠 수와 바지 수를 더했어요. 표에는 ${rows + 1}줄이 있고 줄마다 ${columns}칸이에요. 다시 세어 보세요.`
      : '새로 생긴 줄까지 포함해 표의 칸을 모두 세어 보세요.');
    setExtendInput('');
  }

  function checkChain() {
    if (done) return;
    const value = readWhole(chainInput);
    if (value === null) { setMessage('숫자로 입력해 주세요.'); return; }
    const result = classifyProduct(value, chain.steps.map(step => step.count));
    if (result === 'correct') {
      setMissed(null); setDone(true);
      setMessage(`맞아요. ${chain.steps.map(step => step.count).join(' × ')} = ${chainAnswer(chain)}가지예요.`);
      onComplete();
      return;
    }
    const [first, second, third] = chain.steps;
    setMissed({ problem: chain, mistake: result });
    setMessage(result === 'added' ? `세 수를 더했어요. ${first.label} 하나마다 ${second.label} ${second.count}가지, 그 각각마다 ${third.label} ${third.count}가지가 이어져요.`
      : result === 'partial' ? '두 단계만 곱했어요. 세 번 고르니까 세 단계의 가짓수를 모두 곱해요.'
      : '아래 그림에서 끝까지 이어지는 가지를 세어 보세요.');
    setVariant(value => value + 1); setChainInput('');
  }

  const status = message && <p className="uca-message" role="status">{message}</p>;

  return <section className="uca" aria-label="곱의 법칙 학습">
    <Stages current={stage} done={done} />

    {stage === 0 && <div className="uca-stage">
      {retry && <p className="uca-message is-wrong">확인 문제를 다시 풀기 전에, 직접 만들어 보며 한 번 더 세어 봐요.</p>}
      <p className="uca-lead">티셔츠 {rows}벌과 바지 {columns}벌이 있어요. 티셔츠 하나와 바지 하나를 골라 입어요.</p>
      <div className="uca-shelf"><div>{PRODUCT_SHIRTS.map(item => <ItemChip key={item.id} item={item} />)}</div><div>{PRODUCT_PANTS.map(item => <ItemChip key={item.id} item={item} />)}</div></div>
      <p className="uca-question">입을 수 있는 옷차림은 모두 몇 가지일까요?</p>
      <div className="uca-answer-row"><NumberField label="예상한 옷차림 수" placeholder="예상한 수" value={guessInput} onChange={setGuessInput} onSubmit={() => { const value = readWhole(guessInput); if (value !== null) { setGuess(value); goTo(1); } }} />
        <button type="button" className="uca-primary" disabled={readWhole(guessInput) === null} onClick={() => { setGuess(readWhole(guessInput)); goTo(1); }}>예상했어요</button></div>
      <button type="button" className="uca-text" onClick={() => { setGuess(null); goTo(1); }}>잘 모르겠어요</button>
    </div>}

    {stage === 1 && <div className="uca-stage">
      {!built ? <>
        <p className="uca-lead">티셔츠 하나와 바지 하나를 차례로 눌러 옷차림을 만들어 보세요.</p>
        <div className="uca-pickers">
          <div role="group" aria-label="티셔츠 고르기"><span>티셔츠</span>{PRODUCT_SHIRTS.map(item => <ItemChip key={item.id} item={item} pressed={shirt === item.id} onClick={() => pick('shirt', item.id)} />)}</div>
          <div role="group" aria-label="바지 고르기"><span>바지</span>{PRODUCT_PANTS.map(item => <ItemChip key={item.id} item={item} pressed={pants === item.id} onClick={() => pick('pants', item.id)} />)}</div>
        </div>
        <OutfitGrid shirts={PRODUCT_SHIRTS} made={made} missing={missing} flash={flash} />
        {status}
        <div className="uca-footer"><span>만든 옷차림 {made.length}가지</span><button type="button" className="uca-primary" disabled={!made.length} onClick={finishBuilding}>다 만들었어요</button></div>
      </> : <>
        <p className="uca-lead">옷차림 {total}가지를 모두 만들었어요.</p>
        <OutfitGrid shirts={PRODUCT_SHIRTS} made={made} rowCounts />
        {guess !== undefined && guess !== total && <p className="uca-compare">{guess === null ? '처음에는 예상하지 않았어요.' : `처음에 ${guess}가지라고 예상했어요.`}
          {guess === rows + columns ? ` 티셔츠 수와 바지 수를 더하면 옷의 개수를 센 거예요. 옷차림은 티셔츠 한 벌마다 바지 ${columns}가지씩 만들어져요.` : ` 표의 한 줄마다 ${columns}가지씩, ${rows}줄이에요.`}</p>}
        {guess === total && <p className="uca-compare">예상한 {total}가지가 맞았어요. 표의 한 줄마다 {columns}가지씩, {rows}줄이에요.</p>}
        <p className="uca-question">표를 식으로 나타내 보세요.</p>
        <div className="uca-expression">
          <NumberField label="첫 번째 수" placeholder="?" value={expression[0]} disabled={expressionOk} onChange={value => setExpression(prev => [value, prev[1], prev[2]])} />
          <span>×</span>
          <NumberField label="두 번째 수" placeholder="?" value={expression[1]} disabled={expressionOk} onChange={value => setExpression(prev => [prev[0], value, prev[2]])} />
          <span>=</span>
          <NumberField label="옷차림 수" placeholder="?" value={expression[2]} disabled={expressionOk} onChange={value => setExpression(prev => [prev[0], prev[1], value])} onSubmit={checkExpression} />
          {!expressionOk && <button type="button" className="uca-primary" disabled={expression.some(value => readWhole(value) === null)} onClick={checkExpression}>확인</button>}
        </div>
        {status}
        {expressionOk && <div className="uca-footer"><span /><button type="button" className="uca-primary" onClick={() => goTo(2)}>다음</button></div>}
      </>}
    </div>}

    {stage === 2 && <div className="uca-stage">
      <p className="uca-lead">노란 티를 한 벌 더 샀어요. 이제 티셔츠는 {rows + 1}벌, 바지는 {columns}벌이에요.</p>
      <OutfitGrid shirts={PRODUCT_SHIRTS} made={made} rowCounts={extendResult !== null} extra={extendResult ? 'new' : 'ghost'} />
      <p className="uca-question">옷차림은 모두 몇 가지가 될까요?</p>
      {extendResult !== 'correct' && <div className="uca-answer-row"><NumberField label="새 옷차림 수" value={extendInput} onChange={setExtendInput} onSubmit={checkExtension} />
        <button type="button" className="uca-primary" disabled={readWhole(extendInput) === null} onClick={checkExtension}>확인</button></div>}
      {status}
      {extendResult === 'correct' && <div className="uca-footer"><span /><button type="button" className="uca-primary" onClick={() => goTo(3)}>다음</button></div>}
    </div>}

    {stage === 3 && <div className="uca-stage">
      {!done && <p className="uca-lead">이번에는 표 없이 풀어요.</p>}
      {missed && <div className="uca-missed">
        <p className="uca-message is-wrong" role="status">{message}</p>
        <ChainTree problem={missed.problem} />
      </div>}
      {done ? <>
        {status}
        <ChainTree problem={chain} />
        {summary && <div className="uca-summary"><span>정리</span><p>{summary}</p></div>}
      </> : <>
        {missed && <span className="uca-tag">숫자를 바꾼 문제</span>}
        <p className="uca-question">{chain.steps.map(step => `${step.label} ${step.count}${step.unit}`).join(', ')}가 있어요. 하나씩 골라 쓰고, 입고, 신는 방법은 모두 몇 가지일까요?</p>
        <div className="uca-answer-row"><NumberField label="방법의 수" value={chainInput} onChange={setChainInput} onSubmit={checkChain} />
          <button type="button" className="uca-primary" disabled={readWhole(chainInput) === null} onClick={checkChain}>확인</button></div>
        {!missed && status}
      </>}
    </div>}
  </section>;
}

type LessonProps = { retry: boolean; onComplete: () => void };
const PEOPLE = ['A', 'B', 'C', 'D'];

function Guess({ prompt, children, onGuess }: { prompt: string; children?: React.ReactNode; onGuess: (guess: number | null) => void }) {
  const [value, setValue] = useState('');
  return <div className="uca-stage"><p className="uca-lead">{prompt}</p>{children}
    <p className="uca-question">몇 가지가 나올지 먼저 예상해 보세요.</p>
    <div className="uca-answer-row"><NumberField label="예상한 경우의 수" value={value} onChange={setValue} onSubmit={() => { const guess = readWhole(value); if (guess !== null) onGuess(guess); }} />
      <button className="uca-primary" type="button" disabled={readWhole(value) === null} onClick={() => onGuess(readWhole(value))}>직접 확인하기</button></div>
    <button className="uca-text" type="button" onClick={() => onGuess(null)}>아직 모르겠어요</button>
  </div>;
}

function Equation({ factors, result, onCorrect }: { factors: number[]; result: number; onCorrect: () => void }) {
  const [values, setValues] = useState<string[]>(Array(factors.length + 1).fill(''));
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  function check() {
    if (done) return;
    if (values.every((value, i) => readWhole(value) === [...factors, result][i])) {
      setDone(true); setMessage('맞아요. 자리마다 남아 있는 선택지의 수를 곱했어요.'); onCorrect();
    } else setMessage('첫 자리부터 남아 있는 선택지를 다시 세어 보세요. 쓴 사람은 다음 자리에서 다시 고를 수 없어요.');
  }
  return <><div className="uca-expression">{values.map((value, i) => <span className="uca-factor-input" key={i}>
    {i > 0 && <span>{i === factors.length ? '=' : '×'}</span>}
    <NumberField label={i === factors.length ? '전체 경우의 수' : `${i + 1}번째 자리의 선택지 수`} value={value} disabled={done}
      onChange={next => setValues(previous => previous.map((old, index) => index === i ? next : old))} onSubmit={check} />
  </span>)}</div>
    {!done && <button className="uca-primary" type="button" disabled={values.some(value => readWhole(value) === null)} onClick={check}>식 확인</button>}
    {message && <p className="uca-message" role="status">{message}</p>}</>;
}

/** 활동 안의 연습은 UT 기록과 분리한다. 틀린 문항 해설과 새 문항을 명확히 구분한다. */
function IndependentPractice({ skill, retry, onComplete }: LessonProps & { skill: CountingSkill }) {
  const [variant, setVariant] = useState(retry ? 1 : 0);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState<{ prompt: string; answer: string; explanation: string } | null>(null);
  const problem = countingPractice(skill, variant);
  function check() {
    if (done || readWhole(input) === null) return;
    if (readWhole(input) === problem.answer) { setDone(true); onComplete(); }
    else { setMissed({ prompt: problem.prompt, answer: input, explanation: problem.explanation }); setVariant(value => value + 1); setInput(''); }
  }
  return <div className="uca-stage">
    <p className="uca-lead">이제 도움 없이 풀어보세요.</p>
    {missed && <div className="uca-missed"><p className="uca-message is-wrong" role="status">이전 문제에서 {missed.answer}이라고 답했어요.<br />{missed.prompt}<br />{missed.explanation}</p>
      {!done && <span className="uca-tag">같은 원리 · 다른 숫자</span>}</div>}
    <p className="uca-question">{problem.prompt}</p>
    {done ? <p className="uca-message" role="status">맞았어요. {problem.explanation}</p> : <div className="uca-answer-row">
      <NumberField label="혼자 풀기 답안" value={input} onChange={setInput} onSubmit={check} />
      <button type="button" className="uca-primary" disabled={readWhole(input) === null} onClick={check}>확인</button></div>}
  </div>;
}

function ArrangementActivity({ skill, retry, onComplete }: LessonProps & { skill: 'factorial' | 'permutation' }) {
  const all = skill === 'factorial'; const size = all ? 3 : 2;
  const people = PEOPLE.slice(0, 3); const possibilities = orderedChoices(people, size);
  const [stage, setStage] = useState(0); const [guess, setGuess] = useState<number | null>(null);
  const [order, setOrder] = useState<string[]>([]); const [made, setMade] = useState<string[]>([]);
  const [message, setMessage] = useState(''); const [ruleOk, setRuleOk] = useState(false); const [done, setDone] = useState(false);
  function save() {
    const key = order.join('');
    if (order.length !== size) return;
    if (made.includes(key)) setMessage(`${key}는 이미 만들었어요. 첫 자리를 바꾸어 다른 경우를 찾아보세요.`);
    else { setMade(previous => [...previous, key]); setMessage(`${key}를 추가했어요. ${all ? '한 사람의 위치만 바뀌어도 다른 줄이에요.' : 'AB와 BA는 역할이 바뀌어서 다른 경우예요.'}`); }
    setOrder([]);
  }
  return <section className="uca" aria-label={`${all ? '팩토리얼' : '순열'} 학습`}><Stages current={stage} done={done} />
    {stage === 0 && <Guess prompt={all ? '서로 다른 세 사람 A, B, C를 모두 한 줄로 세워요.' : '세 사람 A, B, C 중 두 사람을 회장과 부회장으로 뽑아요. 한 사람이 두 역할을 맡을 수는 없어요.'}
      onGuess={value => { setGuess(value); setStage(1); }}><div className="uca-people">{people.map(person => <span className="uca-person" key={person}>{person}</span>)}</div></Guess>}
    {stage === 1 && <div className="uca-stage"><p className="uca-lead">사람을 차례로 눌러 {all ? '빈자리에 세워' : '역할을 정해'} 보세요. 같은 사람은 한 번만 골라요.</p>
      <div className="uca-seats">{Array.from({ length: size }, (_, i) => <div key={i} className={order[i] ? 'is-filled' : ''}>
        <small>{all ? `${i + 1}번째 자리` : i === 0 ? '회장' : '부회장'}</small><strong>{order[i] ?? '?'}</strong><span>선택지 {people.length - i}명</span></div>)}</div>
      <div className="uca-people">{people.map(person => <button key={person} className="uca-person" type="button" disabled={order.includes(person) || order.length === size} onClick={() => setOrder(previous => [...previous, person])}>{person}</button>)}</div>
      <div className="uca-answer-row"><button className="uca-primary" type="button" disabled={order.length !== size} onClick={save}>이 경우 추가</button>
        <button className="uca-text" type="button" disabled={!order.length} onClick={() => setOrder(previous => previous.slice(0, -1))}>한 자리 되돌리기</button></div>
      <div className="uca-orders" aria-label="만든 경우">{made.map(key => <span key={key}>{key.split('').join(' → ')}</span>)}</div>
      {message && <p className="uca-message" role="status">{message}</p>}
      {made.length < possibilities.length && <button className="uca-text" type="button" onClick={() => {
        const missing = possibilities.find(choice => !made.includes(choice.join('')))!;
        setMessage(`${missing[0]}로 시작해서 ${all ? '세 자리' : '두 역할'}를 채우는 경우 중 아직 만들지 않은 것이 있어요.`);
      }}>빠진 경우 힌트</button>}
      <div className="uca-footer"><span>{made.length} / {possibilities.length}가지</span><button className="uca-primary" type="button" disabled={made.length !== possibilities.length} onClick={() => { setStage(2); setMessage(''); }}>규칙 확인하기</button></div>
    </div>}
    {stage === 2 && <div className="uca-stage"><p className="uca-lead">직접 만든 경우는 {possibilities.length}가지예요.{guess !== null && ` 처음에는 ${guess}가지라고 예상했어요.`}</p>
      <p className="uca-question">이번에는 사람이 4명이에요. {all ? '네 자리를 모두 채우는' : '두 역할을 정하는'} 식을 완성해 보세요.</p>
      <div className="uca-seats">{fallingFactors(4, all ? 4 : 2).map((_, i) => <div key={i}><small>{i + 1}번째 선택</small><strong>{i === 0 ? '4명' : `${i}명 사용`}</strong><span>{all || i === 0 ? '사용한 사람 제외' : '두 역할을 정하면 멈춤'}</span></div>)}</div>
      <Equation factors={fallingFactors(4, all ? 4 : 2)} result={arrangementCount(4, all ? 4 : 2)} onCorrect={() => setRuleOk(true)} />
      {ruleOk && <><div className="uca-summary"><span>{all ? '모두 배열하면 팩토리얼' : '일부를 순서 있게 뽑으면 순열'}</span>
        <ProblemContent content={all ? '$n!=n\\times(n-1)\\times\\cdots\\times1$. 전부 배열할 때 1까지 곱해요. 아무것도 놓지 않는 방법도 한 가지라 $0!=1$이에요.' : '$_nP_r=n\\times(n-1)\\times\\cdots\\times(n-r+1)$. 필요한 $r$자리만 채우고 멈춰요. 회장 A·부회장 B와 회장 B·부회장 A는 달라요.'} /></div>
        <div className="uca-footer"><span /><button className="uca-primary" type="button" onClick={() => setStage(3)}>혼자 풀어보기</button></div></>}
    </div>}
    {stage === 3 && <IndependentPractice skill={skill} retry={retry} onComplete={() => { setDone(true); onComplete(); }} />}
  </section>;
}

function CombinationActivity({ retry, onComplete }: LessonProps) {
  const groups = groupedChoices(PEOPLE, 2); const orders = orderedChoices(PEOPLE, 2);
  const [stage, setStage] = useState(0); const [selected, setSelected] = useState<string[]>([]);
  const [made, setMade] = useState<string[]>([]); const [grouped, setGrouped] = useState<string[]>([]);
  const [pair, setPair] = useState<string[]>([]); const [message, setMessage] = useState('');
  const [divisor, setDivisor] = useState(''); const [total, setTotal] = useState(''); const [ruleOk, setRuleOk] = useState(false); const [done, setDone] = useState(false);
  function save() {
    if (selected.length !== 2) return;
    const key = selectionKey(selected);
    if (made.includes(key)) setMessage(`${selected.join('')}와 ${[...selected].reverse().join('')}는 구성원이 같아요. 새 경우로 세지 않아요.`);
    else { setMade(previous => [...previous, key]); setMessage(`${key} 두 사람을 골랐어요. 먼저 누른 사람에게 따로 역할을 주지는 않아요.`); }
    setSelected([]);
  }
  function group(order: string) {
    if (pair.includes(order)) { setPair([]); return; }
    if (pair.length === 0) { setPair([order]); setMessage('구성원이 같은 다른 배열을 찾아 눌러요.'); return; }
    if (selectionKey([...pair[0]]) === selectionKey([...order])) {
      setGrouped(previous => [...previous, selectionKey([...order])]); setMessage(`${pair[0]}와 ${order}를 한 팀으로 묶었어요.`); setPair([]);
    } else { setMessage(`${pair[0]}와 ${order}는 구성원이 달라요. 같은 두 사람이 있는 배열을 찾아보세요.`); }
  }
  return <section className="uca" aria-label="조합 학습"><Stages current={stage} done={done} />
    {stage === 0 && <Guess prompt="네 사람 A, B, C, D 중 대표 두 명을 뽑아요. 대표끼리는 역할을 구별하지 않아요." onGuess={() => setStage(1)}>
      <p className="uca-compare">회장·부회장을 정할 때와 무엇이 달라질까요?</p></Guess>}
    {stage === 1 && <div className="uca-stage"><p className="uca-lead">대표 두 명을 눌러 가능한 팀을 만들어 보세요.</p>
      <div className="uca-people">{PEOPLE.map(person => <button className="uca-person" type="button" key={person} aria-pressed={selected.includes(person)} disabled={selected.length === 2 && !selected.includes(person)}
        onClick={() => setSelected(previous => previous.includes(person) ? previous.filter(value => value !== person) : [...previous, person])}>{person}</button>)}</div>
      <p className="uca-question">선택한 대표: {selected.join(' · ') || '아직 없음'}</p>
      <button className="uca-primary" type="button" disabled={selected.length !== 2} onClick={save}>이 팀 추가</button>
      <div className="uca-orders" aria-label="서로 다른 팀">{made.map(key => <span key={key}>{key.split('').join(' + ')}</span>)}</div>
      {message && <p className="uca-message" role="status">{message}</p>}
      {made.length < Object.keys(groups).length && <button className="uca-text" type="button" onClick={() => setMessage(`${Object.keys(groups).find(key => !made.includes(key))![0]}가 포함된 팀 중 아직 만들지 않은 팀이 있어요.`)}>빠진 팀 힌트</button>}
      <div className="uca-footer"><span>{made.length} / {Object.keys(groups).length}팀</span><button className="uca-primary" type="button" disabled={made.length !== Object.keys(groups).length} onClick={() => { setStage(2); setMessage(''); }}>중복된 배열 묶기</button></div>
    </div>}
    {stage === 2 && <div className="uca-stage"><p className="uca-lead">순서를 구별하면 {orders.length}가지가 나와요. 구성원이 같은 두 배열을 차례로 눌러 하나로 묶어보세요.</p>
      <div className="uca-order-buttons">{orders.map(choice => { const order = choice.join(''); const locked = grouped.includes(selectionKey(choice));
        return <button key={order} className={locked ? 'is-grouped' : ''} type="button" aria-pressed={pair.includes(order)} disabled={locked} onClick={() => group(order)}>{order}{locked && ' ✓'}</button>;
      })}</div>
      <div className="uca-orders">{grouped.map(key => <span key={key}>{groups[key].map(order => order.join('')).join(' = ')} → {key.split('').join(' + ')}</span>)}</div>
      {message && <p className="uca-message" role="status">{message}</p>}
      {grouped.length === Object.keys(groups).length && <><p className="uca-question">같은 팀을 몇 번씩 셌나요? 식을 완성해 보세요.</p>
        <div className="uca-expression"><span>12 ÷</span><NumberField label="같은 팀을 센 횟수" value={divisor} disabled={ruleOk} onChange={setDivisor} /><span>=</span>
          <NumberField label="서로 다른 팀의 수" value={total} disabled={ruleOk} onChange={setTotal} onSubmit={() => { if (readWhole(divisor) === 2 && readWhole(total) === 6) setRuleOk(true); else setMessage('AB와 BA 두 배열이 한 팀이에요. 12개 배열을 두 개씩 묶었어요.'); }} />
          {!ruleOk && <button className="uca-primary" type="button" disabled={readWhole(divisor) === null || readWhole(total) === null} onClick={() => { if (readWhole(divisor) === 2 && readWhole(total) === 6) setRuleOk(true); else setMessage('AB와 BA 두 배열이 한 팀이에요. 12개 배열을 두 개씩 묶었어요.'); }}>식 확인</button>}</div></>}
      {ruleOk && <><div className="uca-summary"><span>두 명일 때만 2로 나눠요</span><p>세 명을 뽑으면 ABC, ACB, BAC, BCA, CAB, CBA가 모두 같은 팀이에요. 이때는 3! = 6으로 나눠요.</p>
        <ProblemContent content={'$_nC_r=\\dfrac{{}_nP_r}{r!}=\\dfrac{n!}{r!(n-r)!}$. 같은 구성원을 나열한 순서 수만큼 나눠요.'} /></div>
        <div className="uca-footer"><span /><button className="uca-primary" type="button" onClick={() => setStage(3)}>혼자 풀어보기</button></div></>}
    </div>}
    {stage === 3 && <IndependentPractice skill="combination" retry={retry} onComplete={() => { setDone(true); onComplete(); }} />}
  </section>;
}

function Bins({ bins, fixed = [0, 0, 0], onAdd, onRemove, disabled = false }: { bins: number[]; fixed?: number[]; onAdd?: (i: number) => void; onRemove?: (i: number) => void; disabled?: boolean }) {
  return <div className="uca-bins">{bins.map((count, i) => <div key={i} className="uca-bin">
    <strong>상자 {'ABCD'[i]}</strong><div className="uca-balls" aria-label={`고정 ${fixed[i] ?? 0}개, 자유 배분 ${count}개`}>
      {Array.from({ length: fixed[i] ?? 0 }, (_, j) => <i className="is-fixed" key={`fixed-${j}`} />)}
      {Array.from({ length: count }, (_, j) => <i key={j} />)}{count + (fixed[i] ?? 0) === 0 && <span>0개</span>}</div>
    <small>{count + (fixed[i] ?? 0)}개{(fixed[i] ?? 0) > 0 && ` · 먼저 넣은 ${fixed[i]}개`}</small>
    {onAdd && <div className="uca-bin-actions"><button type="button" aria-label={`상자 ${'ABCD'[i]}에 공 넣기`} disabled={disabled} onClick={() => onAdd(i)}>+ 넣기</button>
      <button type="button" aria-label={`상자 ${'ABCD'[i]}에서 공 빼기`} disabled={count === 0} onClick={() => onRemove?.(i)}>− 빼기</button></div>}
  </div>)}</div>;
}

function Symbols({ bins }: { bins: number[] }) {
  return <div className="uca-symbols" role="img" aria-label={`별과 칸막이: ${bins.map((count, i) => `상자 ${'ABCD'[i]} ${count}개`).join(', ')}`}>
    {binsToSymbols(bins).map((symbol, i) => <span key={i} className={symbol === 'bar' ? 'is-bar' : ''}>{symbol === 'bar' ? '│' : '●'}</span>)}
  </div>;
}

function DistributionActivity({ minimum, retry, onComplete }: LessonProps & { minimum: boolean }) {
  const total = minimum ? 8 : 3; const minima = minimum ? [1, 3, 0] : [0, 0, 0]; const free = remainingAfterMinimum(total, minima);
  const [stage, setStage] = useState(0); const [bins, setBins] = useState([0, 0, 0]);
  const [examples, setExamples] = useState<number[][]>([]); const [message, setMessage] = useState('');
  const [leftInput, setLeftInput] = useState(''); const [minimumOk, setMinimumOk] = useState(false);
  const [positions, setPositions] = useState<number[]>([]); const [patterns, setPatterns] = useState<string[]>([]);
  const [rule, setRule] = useState(['', '', '']); const [ruleOk, setRuleOk] = useState(false); const [done, setDone] = useState(false);
  const placed = bins.reduce((sum, count) => sum + count, 0); const slots = free + 2;
  const decoded = barsToBins(free, 3, positions);
  const hasEmpty = examples.some(example => example.includes(0));
  const built = examples.length >= 2 && hasEmpty;
  function saveDistribution() {
    if (placed !== free) return;
    if (examples.some(example => example.join(',') === bins.join(','))) { setMessage('공을 넣은 순서가 달라도 각 상자의 개수가 같으면 같은 배분이에요. 다른 배분을 만들어보세요.'); return; }
    setExamples(previous => [...previous, [...bins]]); setBins([0, 0, 0]);
    setMessage(minimum ? '먼저 넣은 공은 그대로 두고, 남은 공의 배분만 바꾸었어요.' : '이 배분을 저장했어요. 같은 공끼리는 넣는 순서를 구별하지 않아요.');
  }
  function savePattern() {
    if (!decoded) return;
    const key = [...positions].sort((a, b) => a - b).join(',');
    if (patterns.includes(key)) { setMessage('이미 만든 칸막이 위치예요. 다른 두 자리를 골라보세요.'); return; }
    setPatterns(previous => [...previous, key]); setPositions([]);
    setMessage(minimum ? `칸막이 위치 하나가 남은 공의 배분 (${decoded.join(', ')}) 하나를 정해요. 먼저 넣은 회색 공은 그대로예요.`
      : `칸막이 위치 하나가 배분 (${decoded.join(', ')}) 하나를 정해요. 빈 상자도 0개로 남겨 두어요.`);
  }
  function checkRule() {
    if (rule.every((value, i) => readWhole(value) === [slots, 2, distributionCount(free, 3)][i])) { setRuleOk(true); setMessage('맞아요. 칸막이 두 자리를 고르면 나머지 자리는 공으로 정해져요.'); }
    else setMessage(`공 ${free}개와 칸막이 2개를 합친 자리 수를 확인해요. 서로 같은 칸막이의 위치 두 개를 순서 없이 고르는 조합이에요.`);
  }
  return <section className="uca" aria-label={`${minimum ? '최솟값 먼저 채우기' : '중복조합'} 학습`}><Stages current={stage} done={done} />
    {stage === 0 && <Guess prompt={minimum ? '같은 공 8개를 A, B, C에 나눠요. A에는 적어도 1개, B에는 적어도 3개가 필요하고 C는 비어 있어도 돼요.' : '같은 공 3개를 서로 다른 상자 A, B, C에 나눠요. 한 상자에 여러 개 넣어도 되고, 빈 상자가 있어도 돼요.'}
      onGuess={() => setStage(1)}><Bins bins={[0, 0, 0]} /><p className="uca-compare">공에는 번호가 없어요. 같은 상자에 있는 공끼리는 구별하지 않아요.</p></Guess>}
    {stage === 1 && <div className="uca-stage">
      {minimum && <><p className="uca-lead">필요한 공을 먼저 넣었어요. 회색 공은 고정하고, 나머지 공만 자유롭게 나눠요.</p>
        {!minimumOk && <><Bins bins={[0, 0, 0]} fixed={minima} /><p className="uca-question">8개 중 자유롭게 나눌 공은 몇 개 남았나요?</p></>}
        {!minimumOk ? <div className="uca-answer-row"><NumberField label="남은 공의 수" value={leftInput} onChange={setLeftInput} onSubmit={() => { if (readWhole(leftInput) === free) { setMinimumOk(true); setMessage('8 − (1 + 3 + 0) = 4개가 남았어요.'); } else setMessage('A에 1개, B에 3개를 먼저 넣었어요. 이 네 개만 빼면 돼요.'); }} />
          <button className="uca-primary" type="button" disabled={readWhole(leftInput) === null} onClick={() => { if (readWhole(leftInput) === free) { setMinimumOk(true); setMessage('8 − (1 + 3 + 0) = 4개가 남았어요.'); } else setMessage('상자 수를 빼는 것이 아니라, 먼저 넣은 공 1 + 3 + 0개를 빼요.'); }}>확인</button></div> : <p className="uca-message">남은 공 {free}개는 각 상자에 0개 이상 넣을 수 있어요.</p>}</>}
      {(!minimum || minimumOk) && <><p className="uca-lead">상자의 넣기·빼기 버튼으로 공 {free}개를 나눠보세요. 서로 다른 배분 두 개를 만들고, {minimum ? '남은 공이 0개인' : '비어 있는'} 상자도 만들어보세요.</p>
        <Bins bins={bins} fixed={minima} disabled={placed === free} onAdd={i => { if (placed < free) setBins(previous => previous.map((count, index) => index === i ? count + 1 : count)); }} onRemove={i => setBins(previous => previous.map((count, index) => index === i ? Math.max(0, count - 1) : count))} />
        <p className="uca-question">남은 공 {free - placed}개</p>{minimum && <p className="uca-lead">칸막이에는 새로 넣는 파란 공만 표시해요. 회색 공은 이미 넣었으니 다시 세지 않아요.</p>}<Symbols bins={bins} />
        <button className="uca-primary" type="button" disabled={placed !== free} onClick={saveDistribution}>이 배분 저장</button>
        <div className="uca-orders">{examples.map(example => <span key={example.join(',')}>({example.map((count, i) => count + minima[i]).join(', ')}){minimum && ` → 남은 공 (${example.join(', ')})`}</span>)}</div>
        {!hasEmpty && examples.length > 0 && <p className="uca-lead">다음에는 남은 공을 한 상자에 0개 넣어 보세요.</p>}
        <div className="uca-footer"><span>{examples.length}가지 배분 확인</span><button className="uca-primary" type="button" disabled={!built} onClick={() => { setStage(2); setMessage(''); }}>칸막이로 바꾸기</button></div></>}
      {message && <p className="uca-message" role="status">{message}</p>}
    </div>}
    {stage === 2 && <div className="uca-stage"><p className="uca-lead">{minimum ? '남은 공' : '공'} {free}개와 칸막이 2개를 한 줄로 놓아요. 칸막이 두 자리를 고르면 나머지 자리는 공이 돼요. 각 구역의 공 개수가 A, B, C에 {minimum ? '추가로 넣을' : '들어갈'} 개수예요.</p>
      <div className="uca-symbol-buttons" role="group" aria-label="칸막이 위치 선택">{Array.from({ length: slots }, (_, i) => <button key={i} className={positions.includes(i) ? 'is-bar' : ''} type="button" aria-label={`${i + 1}번째 자리 칸막이`} aria-pressed={positions.includes(i)}
        onClick={() => {
          if (positions.length === 2 && !positions.includes(i)) { setMessage('칸막이는 두 개예요. 선택한 칸막이를 다시 눌러 해제하고 다른 자리를 골라요.'); return; }
          setPositions(previous => previous.includes(i) ? previous.filter(p => p !== i) : [...previous, i]);
        }}><small>{i + 1}</small>{positions.includes(i) ? '│' : decoded ? '●' : '?'}</button>)}</div>
      {decoded ? <><Bins bins={decoded} fixed={minima} /><button className="uca-primary" type="button" onClick={savePattern}>이 위치 확인</button></> : <p className="uca-lead">칸막이 {2 - positions.length}개를 더 골라요.</p>}
      <div className="uca-orders">{patterns.map(key => { const counts = barsToBins(free, 3, key.split(',').map(Number))!; return <span key={key}>칸막이 {key.split(',').map(p => Number(p) + 1).join('·')}번 → {minimum ? '남은 공 ' : ''}({counts.join(', ')})</span>; })}</div>
      <p className="uca-compare">칸막이가 맨 앞·맨 뒤에 있거나 서로 붙어 있어도 돼요. 그 구역에는 {minimum ? '추가할 공이 0개예요. 먼저 넣은 공은 그대로 남아요.' : '공이 0개예요.'}</p>
      {patterns.length >= 2 && <><p className="uca-question">전체 자리 수, 고를 칸막이 수, 배분의 수를 연결해 보세요.</p>
        <div className="uca-expression"><NumberField label="전체 자리 수" value={rule[0]} disabled={ruleOk} onChange={value => setRule(previous => [value, previous[1], previous[2]])} />
          <span>자리 중</span><NumberField label="고를 칸막이 수" value={rule[1]} disabled={ruleOk} onChange={value => setRule(previous => [previous[0], value, previous[2]])} /><span>자리 선택 =</span>
          <NumberField label="배분의 수" value={rule[2]} disabled={ruleOk} onChange={value => setRule(previous => [previous[0], previous[1], value])} onSubmit={checkRule} /></div>
        {!ruleOk && <button className="uca-primary" type="button" disabled={rule.some(value => readWhole(value) === null)} onClick={checkRule}>식 확인</button>}
        {!ruleOk && <button className="uca-text" type="button" onClick={() => setMessage(`조합으로 계산해요. ${slots} × ${slots - 1} ÷ 2! = ${distributionCount(free, 3)}. 칸막이를 고른 순서는 구별하지 않아요.`)}>조합 계산 힌트</button>}</>}
      {message && <p className="uca-message" role="status">{message}</p>}
      {ruleOk && <><div className="uca-summary"><span>{minimum ? '최솟값을 빼고 중복조합' : '배분 한 가지 ↔ 칸막이 위치 한 가지'}</span>
        {!minimum && <p>상자 A, B, C를 과자 세 종류라고 생각해 보세요. 배분 (2, 0, 1)은 A종류 두 개, B종류는 안 고르고, C종류 한 개를 고르는 것과 같아요.</p>}
        <ProblemContent content={minimum ? '$x\\ge1, y\\ge3, z\\ge0$이라면 $x\'=x-1, y\'=y-3, z\'=z$로 바꿔요. $x+y+z=8$은 $x\'+y\'+z\'=4$가 되고, 남은 개수는 모두 0 이상이에요.' : '$n$종류에서 중복을 허용해 $r$개를 순서 없이 고르면, 별 $r$개와 칸막이 $n-1$개를 놓아요. $_nH_r={}_{n+r-1}C_{n-1}$. 같은 종류의 개수가 같으면 같은 선택이에요.'} /></div>
        <div className="uca-footer"><span /><button className="uca-primary" type="button" onClick={() => setStage(3)}>혼자 풀어보기</button></div></>}
    </div>}
    {stage === 3 && <IndependentPractice skill={minimum ? 'minimum' : 'repetition'} retry={retry} onComplete={() => { setDone(true); onComplete(); }} />}
  </section>;
}
