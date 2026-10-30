import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import MathText from '../../../components/MathText';
import { Asset, Frame, Profile, TrainBadge } from '../FigmaMetro';
import { UNITS, nextTopic, topicDone, type JourneyState, type Screen, type UnitId } from '../model';
import { Logo } from './Onboarding';

export type ChatMessage = { text: string; own: boolean };
const SUGGESTIONS = ['이 개념 쉽게 설명해줘', '예시 하나 보여줘', '다음에 뭘 공부해?'];

/** Home, notes and AI share one artboard and sidebar so switching between them only swaps the content. */
export function LibraryFrame({ screen, nickname, go, children }: { screen: Screen; nickname: string; go: (screen: Screen) => void; children: ReactNode }) {
  const item = (target: Screen, icon: string, label: string) =>
    <button className={screen === target ? 'active' : ''} aria-current={screen === target ? 'page' : undefined} onClick={() => go(target)}><Asset name={icon} />{label}</button>;
  return <Frame><div className="j-library-shell">
    <aside className="j-sidebar">
      <Logo onClick={screen === 'home' ? undefined : () => go('home')} />
      <nav aria-label="주 메뉴">
        {item('home', 'home-imgGroup429', '홈')}
        {item('notes', 'home-imgGroup430', '개념 노트')}
        {item('ai', 'home-imgGroup431', '수확행 AI')}
      </nav>
      <Profile name={nickname} onClick={() => go('profile')} />
    </aside>
    <section className={`j-library-content ${screen === 'home' ? 'is-home' : ''}`}>{children}</section>
  </div></Frame>;
}

export function HomeContent({ state, openUnit }: { state: JourneyState; openUnit: (id: UnitId, index?: number) => void }) {
  return <div className="j-home-content">
    <h1>지금의 실력에 맞춰, 수학 학습을 시작해요.</h1>
    <p className="j-home-subtitle">레벨테스트 결과를 바탕으로 지금 필요한 개념부터 학습 순서를 구성했어요.</p>
    <div className="j-curriculum-cards">
      {UNITS.map(item => {
        const activeIndex = nextTopic(state, item);
        return <section className="j-curriculum-card" key={item.id} style={{ '--unit-color': item.color } as CSSProperties}>
          <button className="j-card-heading" onClick={() => openUnit(item.id)} aria-label={`${item.name} 커리큘럼 열기`}>
            <TrainBadge unit={item.id} />
            <span><h2>{item.name}</h2><small>{item.topics.length}개 개념 · {item.topics.reduce((sum, t) => sum + t.children.length, 0)}개 세부 개념</small></span>
          </button>
          <ol>
            {item.topics.map((t, i) => {
              const done = topicDone(state, item, i);
              const current = i === activeIndex && !done && item.id === state.unitId;
              return <li key={t.name} className={`${current ? 'is-current' : ''} ${done ? 'is-done' : ''}`}>
                <button onClick={() => openUnit(item.id, i)}>
                  <span className="j-home-stop">{current ? <Asset name="home-imgGroup434" /> : done ? <span className="j-stop-check">✓</span> : <Asset name="home-img" />}</span>
                  <span>{t.short || t.name}</span>
                  {current && <small>학습 중</small>}
                  {done && <small>진단·학습 확인</small>}
                </button>
              </li>;
            })}
          </ol>
        </section>;
      })}
    </div>
    <footer className="j-home-footer">
      <button className="j-primary" onClick={() => openUnit(state.unitId)}>학습 {state.completed.length ? '이어하기' : '시작하기'} <span>→</span></button>
    </footer>
  </div>;
}

export function NotesContent({ notes, openNote, openUnit }: { notes: string[]; openNote: (key: string) => void; openUnit: () => void }) {
  return <>
    <span className="j-step-label">MY CONCEPT NOTES</span>
    <h1>조금씩 쌓이는 나의 개념 노트</h1>
    <p>다시 보고 싶은 개념을 모아두세요.</p>
    {notes.length ? <div className="j-note-grid">
      {notes.map(key => {
        const [id, ti, ci] = key.split(':');
        const unit = UNITS.find(item => item.id === id)!;
        const topic = unit.topics[Number(ti)];
        return <button key={key} className="j-note-card" onClick={() => openNote(key)}>
          <span className="j-tag">{unit.name} · {topic.short || topic.name}</span>
          <h2>{topic.children[Number(ci)]}</h2>
          <p>{topic.description}</p>
          <span>다시 살펴보기 →</span>
        </button>;
      })}
    </div> : <div className="j-empty-notes">
      <Asset name="home-imgGroup430" />
      <h2>첫 번째 개념을 담아볼까요?</h2>
      <p>학습 화면에서 ‘개념 노트에 저장’을 누르면 여기에 모여요.</p>
      <button className="j-primary" onClick={openUnit}>학습하러 가기 →</button>
    </div>}
  </>;
}

export function AiContent({ nickname, topicName, messages, pending, onAsk }: {
  nickname: string; topicName: string; messages: ChatMessage[]; pending: boolean; onAsk: (text: string) => void;
}) {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  // Keep the newest message in view as the conversation grows.
  useEffect(() => { const list = listRef.current; if (list) list.scrollTop = list.scrollHeight; }, [messages.length, pending]);
  const send = (text: string) => { if (!text.trim() || pending) return; onAsk(text.trim()); setInput(''); };
  return <>
    <span className="j-step-label">수확행 AI · 체험 답변</span>
    <h1>생각이 막힐 때, 함께 풀어봐요.</h1>
    <p>현재 학습 중인 <b>{topicName}</b>에 대해 물어보세요. 프로토타입의 준비된 예시 답변으로 대화해요.</p>
    <div className="j-chat">
      <div className="j-chat-messages" ref={listRef} aria-live="polite">
        <div className="j-chat-bubble">안녕하세요, {nickname}님! {topicName}에서 어떤 부분이 궁금한가요?</div>
        {messages.map((message, i) => <div key={i} className={`j-chat-bubble ${message.own ? 'own' : ''}`}><MathText text={message.text} /></div>)}
        {pending && <div className="j-chat-bubble j-chat-typing" aria-label="답변을 준비하고 있어요"><i /><i /><i /></div>}
      </div>
      <div className="j-chat-suggestions">{SUGGESTIONS.map(text => <button key={text} disabled={pending} onClick={() => send(text)}>{text}</button>)}</div>
      <form onSubmit={e => { e.preventDefault(); send(input); }}>
        <input aria-label="AI에게 질문하기" value={input} onChange={e => setInput(e.target.value)} placeholder="궁금한 점을 입력해 보세요" />
        <button className="j-primary" disabled={!input.trim() || pending}>보내기 ↑</button>
      </form>
    </div>
  </>;
}
