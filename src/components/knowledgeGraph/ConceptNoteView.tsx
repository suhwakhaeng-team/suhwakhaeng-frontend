import type { RefObject } from 'react';
import type { ConceptNote } from '../../data/conceptNotes';
import ConceptNoteRevisionForm from './ConceptNoteRevisionForm';
import ConceptNoteVisual from './ConceptNoteVisual';

export default function ConceptNoteView({ note, uid, noteRef }: {
  note: ConceptNote;
  uid: string | null;
  noteRef: RefObject<HTMLElement | null>;
}) {
  return <article className="kg-note" ref={noteRef}>
    <section className="kg-note-hero">
      <h2>{note.title}</h2>
      <p>{note.summary}</p>
    </section>

    <section className="kg-note-section">
      <div className="kg-note-section-title"><span>01</span><h3>쉬운 말로 먼저 보기</h3></div>
      <dl className="kg-note-words">
        {note.plainWords.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}
      </dl>
    </section>

    <section className="kg-note-section">
      <div className="kg-note-section-title"><span>02</span><h3>왜 배울까요?</h3></div>
      <p className="kg-note-copy">{note.why}</p>
    </section>

    <ConceptNoteVisual conceptName={note.title} />

    <section className="kg-note-section">
      <div className="kg-note-section-title"><span>03</span><h3>단계별로 이해하기</h3></div>
      <ol className="kg-note-steps">
        {note.steps.map((step, index) => <li key={step.title}>
          <span>{index + 1}</span>
          <div><strong>{step.title}</strong><p>{step.body}</p></div>
        </li>)}
      </ol>
    </section>

    <section className="kg-note-section">
      <div className="kg-note-section-title"><span>04</span><h3>대표 예제</h3></div>
      <div className="kg-note-example">
        <strong>{note.example.question}</strong>
        <ol>{note.example.solution.map(line => <li key={line}>{line}</li>)}</ol>
        <p>{note.example.answer}</p>
      </div>
    </section>

    <section className="kg-note-section">
      <div className="kg-note-section-title"><span>05</span><h3>많이 하는 실수</h3></div>
      <div className="kg-note-mistakes">
        {note.mistakes.map(item => <div key={item.wrong}>
          <p><b>이렇게 생각하기 쉬워요</b>{item.wrong}</p>
          <p><b>이렇게 기억해요</b>{item.right}</p>
        </div>)}
      </div>
    </section>

    <section className="kg-note-recap">
      <span>핵심 정리</span>
      <ul>{note.recap.map(line => <li key={line}>{line}</li>)}</ul>
    </section>

    <ConceptNoteRevisionForm conceptName={note.title} uid={uid} />
  </article>;
}
