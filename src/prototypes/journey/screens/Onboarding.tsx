import { useState, type ReactNode } from 'react';
import MathText from '../../../components/MathText';
import { TrainBadge } from '../FigmaMetro';
import { UNITS, TEST_QUESTIONS, type JourneyState } from '../model';

const GRADES = ['고등학교 1학년', '고등학교 2학년', '고등학교 3학년', '그 외'];
const GENERATION_MESSAGES = ['레벨테스트 답안을 확인하고 있어요.', '지금 필요한 개념을 찾고 있어요.', '단원별 학습 순서를 정리하고 있어요.', '나만의 수학 여정이 준비됐어요.'];

export const Logo = ({ onClick }: { onClick?: () => void }) => onClick
  ? <button className="j-logo" onClick={onClick} aria-label="수확행 홈으로"><span />수확행</button>
  : <div className="j-logo"><span />수확행</div>;

export function OnboardingShell({ children, onLogo }: { children: ReactNode; onLogo?: () => void }) {
  return <div className="j-onboarding">
    <header className="j-onboarding-header"><Logo onClick={onLogo} /><span>나에게 맞는 수학, 한 걸음씩.</span><small>프로토타입 체험</small></header>
    {children}
  </div>;
}

export function LoginScreen({ onStart }: { onStart: () => void }) {
  return <div className="j-login-layout">
    <section className="j-login-copy">
      <span className="j-eyebrow">수학에도, 나만의 노선이 있으니까.</span>
      <h1>지금의 나에게 맞는<br /><em>수학을 시작해요.</em></h1>
      <p>어디서 시작할지 몰라도 괜찮아요.<br />내 실력을 알아보고, 나에게 필요한 개념부터 차근차근.</p>
      <div className="j-login-lines" aria-hidden="true">
        <span className="line-blue"><i />경우의 수<i /></span>
        <span className="line-cyan"><i />확률<i /></span>
        <span className="line-mint"><i />통계<i /></span>
      </div>
    </section>
    <section className="j-signin">
      <TrainBadge />
      <h2>수확행에 오신 걸 환영해요.</h2>
      <p>나만의 수학 학습 경로를 만나보세요.</p>
      <button className="j-google" onClick={onStart}><b>G</b>Google 로그인 체험<span>→</span></button>
      <div className="j-or"><span />또는<span /></div>
      <button className="j-primary" onClick={onStart}>체험 계정으로 시작하기 <span>→</span></button>
      <small>실제 Google 계정 연결 없이<br />전체 학습 흐름을 체험할 수 있어요.</small>
    </section>
  </div>;
}

/** Edits a draft, so nothing changes until the learner saves, and returning learners can cancel. */
export function ProfileScreen({ state, onSave, onCancel }: { state: JourneyState; onSave: (nickname: string, grade: string) => void; onCancel?: () => void }) {
  const [nickname, setNickname] = useState(state.nickname);
  const [grade, setGrade] = useState(state.grade);
  const valid = Boolean(nickname.trim() && grade);
  return <form className="j-onboard-card" onSubmit={event => { event.preventDefault(); if (valid) onSave(nickname.trim(), grade); }}>
    <span className="j-step-label">{state.tested ? '내 프로필' : '01 · 간단한 소개'}</span>
    <h1>{state.tested ? '프로필을 수정할까요?' : '어떻게 불러드릴까요?'}</h1>
    <p>{state.tested ? '저장하기를 눌러야 바뀐 내용이 반영돼요.' : '학습을 시작하기 전에, 조금만 알려주세요.'}</p>
    <label htmlFor="journey-nickname">닉네임</label>
    <input id="journey-nickname" value={nickname} onChange={e => setNickname(e.target.value.slice(0, 12))} placeholder="예: 김성빈" maxLength={12} autoComplete="off" required />
    <small className="j-input-help">1~12자로 입력해 주세요.</small>
    <fieldset>
      <legend>현재 학년</legend>
      <div className="j-grade-options">
        {GRADES.map(item => <button key={item} type="button" aria-pressed={grade === item} onClick={() => setGrade(item)}>{item}</button>)}
      </div>
    </fieldset>
    <div className="j-form-actions">
      {onCancel && <button type="button" className="j-text-button" onClick={onCancel}>취소</button>}
      <button className="j-primary" disabled={!valid}>{state.tested ? '저장하기' : '다음으로'} <span>→</span></button>
    </div>
  </form>;
}

export function IntroScreen({ nickname, onStart }: { nickname: string; onStart: () => void }) {
  return <section className="j-onboard-card j-intro">
    <span className="j-step-label">02 · 레벨테스트</span>
    <h1>{nickname}님의<br />출발점을 찾아볼까요?</h1>
    <p>점수를 매기는 시험이 아니에요.<br />지금 필요한 개념을 찾는 짧은 여정이에요.</p>
    <div className="j-intro-units">
      {UNITS.map(item => <div key={item.id}><TrainBadge unit={item.id} /><b>{item.name}</b><span>3문항</span></div>)}
    </div>
    <div className="j-intro-facts"><span>총 <b>9문항</b></span><span>약 <b>3분</b></span><span>모르는 문제는 <b>건너뛰기</b></span></div>
    <button className="j-primary" onClick={onStart}>레벨테스트 시작하기 <span>→</span></button>
    <small>이번 프로토타입에서는 예시 문항으로 학습 흐름을 체험해요.</small>
  </section>;
}

export function TestScreen({ state, onAnswer, onNext, onPrevious }: {
  state: JourneyState; onAnswer: (choice: number) => void; onNext: (answer: number | null) => void; onPrevious: () => void;
}) {
  const index = state.questionIndex;
  const question = TEST_QUESTIONS[index];
  const answer = state.answers[index];
  return <div className="j-test-layout">
    <aside className="j-test-side">
      <span className="j-step-label">LEVEL TEST</span>
      <h1>나의 출발점<br />찾아보기</h1>
      <p>천천히 생각해 보세요.<br />모르겠다면 넘어가도 괜찮아요.</p>
      {UNITS.map((item, i) => <div className={`j-test-unit ${question.unit === i ? 'active' : ''}`} key={item.id}>
        <TrainBadge unit={item.id} />
        <span><b>{item.name}</b><small>{i < question.unit ? '확인 완료' : i === question.unit ? '진단 중' : '진단 전'}</small></span>
        <span>{i < question.unit ? '✓' : `0${i + 1}`}</span>
      </div>)}
    </aside>
    <section className="j-test-card" key={index}>
      <div className="j-test-progress-label"><span>{UNITS[question.unit].name}</span><b>{index + 1}<small> / 9</small></b></div>
      <div className="j-small-progress"><i style={{ width: `${(index + 1) / 9 * 100}%` }} /></div>
      <span className="j-question-number">QUESTION {String(index + 1).padStart(2, '0')}</span>
      <h2><MathText text={question.question} /></h2>
      <div className="j-answer-options">
        {question.choices.map((choice, i) => <button className={answer === i ? 'selected' : ''} aria-pressed={answer === i} key={choice} onClick={() => onAnswer(i)}>
          <span>{i + 1}</span><MathText text={choice} />
        </button>)}
      </div>
      <footer>
        <button className="j-text-button" onClick={() => onNext(null)}>잘 모르겠어요</button>
        <button className="j-primary" disabled={answer == null} onClick={() => onNext(answer!)}>{index === 8 ? '결과 확인하기' : '다음 문제'} <span>→</span></button>
      </footer>
      {index > 0 && <button className="j-previous-question" onClick={onPrevious}>← 이전 문제</button>}
    </section>
  </div>;
}

export function GeneratingScreen({ nickname, step }: { nickname: string; step: number }) {
  return <section className="j-generation" aria-live="polite">
    <div className="j-generating-icon"><TrainBadge /><span /><span /></div>
    <span className="j-step-label">나만의 커리큘럼을 준비하고 있어요</span>
    <h1>{nickname}님을 위한<br />수학 노선을 만들고 있어요.</h1>
    <p>{GENERATION_MESSAGES[step]}</p>
    <div className="j-generation-stops">
      {UNITS.map((item, i) => <div className={step > i ? 'done' : step === i ? 'current' : ''} key={item.id}>
        <span>{step > i ? '✓' : i + 1}</span><b>{item.name}</b>
      </div>)}
    </div>
  </section>;
}
