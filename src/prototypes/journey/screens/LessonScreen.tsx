import { useState } from 'react';
import MathText from '../../../components/MathText';
import { childKey, conceptHint, type JourneyState, type Topic, type Unit } from '../model';
import { Logo } from './Onboarding';

/**
 * Concept first, then one check question. The worked explanation stays hidden until the learner answers
 * correctly; before that, only a hint is shown so the practice question is not spoiled.
 */
export default function LessonScreen({ unit, state, topicIndex, childIndex, lesson, onClose, onToggleNote, onComplete }: {
  unit: Unit; state: JourneyState; topicIndex: number; childIndex: number; lesson: Topic;
  onClose: () => void; onToggleNote: () => void; onComplete: () => void;
}) {
  const [phase, setPhase] = useState<'concept' | 'question'>('concept');
  const [selection, setSelection] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const topic = unit.topics[topicIndex];
  const child = topic.children[childIndex];
  const key = childKey(unit.id, topicIndex, childIndex);
  const saved = state.notes.includes(key);
  const correct = checked && selection === lesson.answer;
  const last = childIndex + 1 === topic.children.length;

  return <div className="j-lesson-shell">
    <header>
      <Logo />
      <div><span>{unit.name}</span><i>›</i><b>{topic.name}</b></div>
      <button className="j-close" aria-label="학습 닫기" onClick={onClose}>×</button>
    </header>
    <div className="j-lesson-layout">
      <aside className="j-lesson-sequence">
        <button className="j-text-button" onClick={onClose}>← 개념 지도로</button>
        <h2>{topic.name}</h2>
        <p>{topic.children.length}개의 작은 걸음</p>
        <ol>
          {topic.children.map((name, i) => <li className={i === childIndex ? 'current' : ''} aria-current={i === childIndex ? 'step' : undefined} key={name}>
            <span>{state.completed.includes(childKey(unit.id, topicIndex, i)) ? '✓' : i + 1}</span>{name}
          </li>)}
        </ol>
      </aside>
      <section className="j-lesson-card" key={`${key}:${phase}`}>
        <div className="j-lesson-step">
          <span>{phase === 'concept' ? '개념 이해' : '개념 확인'}</span>
          <button className="j-save-note" aria-pressed={saved} onClick={onToggleNote}>{saved ? '✓ 노트에 저장됨' : '＋ 개념 노트에 저장'}</button>
        </div>
        <span className="j-step-label">STEP {String(childIndex + 1).padStart(2, '0')}</span>
        <h1>{child}</h1>
        {phase === 'concept' ? <>
          <p className="j-lesson-description">{lesson.description}</p>
          <div className="j-formula"><MathText text={lesson.formula} /></div>
          <section className="j-think">
            <span>이렇게 생각해 보세요</span>
            <h2>{topic.name === '순열' ? '순서가 달라지면, 다른 경우일까요?' : `${topic.short || topic.name}의 핵심은 무엇일까요?`}</h2>
            <p><MathText text={conceptHint(lesson)} /></p>
          </section>
          <div className="j-lesson-bottom">
            <small>핵심 내용을 확인했다면 문제로 연습해 보세요.</small>
            <button className="j-primary" onClick={() => setPhase('question')}>문제로 확인하기 <span>→</span></button>
          </div>
        </> : <>
          <h2 className="j-practice-question"><MathText text={lesson.question} /></h2>
          <div className="j-answer-options">
            {lesson.choices.map((choice, i) => <button key={choice} aria-pressed={selection === i} disabled={correct && i !== lesson.answer}
              className={`${selection === i ? 'selected' : ''} ${correct && i === lesson.answer ? 'correct' : ''} ${checked && selection === i && i !== lesson.answer ? 'incorrect' : ''}`}
              onClick={() => { if (!correct) { setSelection(i); setChecked(false); } }}>
              <span>{i + 1}</span><MathText text={choice} />
            </button>)}
          </div>
          {checked && <div className={`j-answer-feedback ${correct ? 'correct' : ''}`} role="status">
            <b>{correct ? '잘했어요. 개념을 확인했어요!' : '조금만 더 생각해 볼까요?'}</b>
            <p><MathText text={correct ? lesson.explanation : `힌트: ${conceptHint(lesson)} 다른 보기를 골라 다시 확인해 보세요.`} /></p>
          </div>}
          <div className="j-lesson-bottom">
            <button className="j-text-button" onClick={() => setPhase('concept')}>← 개념 다시 보기</button>
            {correct
              ? <button className="j-primary" onClick={onComplete}>{last ? '개념 학습 마치기' : '다음 세부 학습'} <span>→</span></button>
              : <button className="j-primary" disabled={selection === null || checked} onClick={() => setChecked(true)}>정답 확인하기 <span>→</span></button>}
          </div>
        </>}
      </section>
    </div>
  </div>;
}
