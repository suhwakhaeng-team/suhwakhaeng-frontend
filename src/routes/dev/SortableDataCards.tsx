import { useId, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { moveCard } from './cardOrder';

type Drag = { id: number; pointer: number; startX: number; startY: number; moving: boolean };

export default function SortableDataCards({ data }: { data: readonly number[] }) {
  // Observation IDs, not values: two equal numbers are still two cards.
  const [order, setOrder] = useState(() => data.map((_, index) => index));
  const [preview, setPreview] = useState<{ id: number; target: number | null; x: number; y: number } | null>(null);
  const [status, setStatus] = useState('');
  const drag = useRef<Drag | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<number, HTMLButtonElement>());
  const helpId = useId();

  function targetAt(x: number, y: number) {
    const bounds = list.current?.getBoundingClientRect();
    if (!bounds || x < bounds.left - 16 || x > bounds.right + 16 || y < bounds.top - 16 || y > bounds.bottom + 16) return null;
    let nearest: number | null = null;
    let distance = Infinity;
    order.forEach((id, index) => {
      const rect = cards.current.get(id)?.getBoundingClientRect();
      if (!rect) return;
      const next = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
      if (next < distance) { nearest = index; distance = next; }
    });
    return nearest;
  }

  function move(id: number, to: number) {
    const from = order.indexOf(id);
    const updated = moveCard(order, from, to);
    if (updated === order) return;
    setOrder(updated);
    setStatus(`${data[id]}분 카드를 ${to + 1}번째로 옮겼어요.`);
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    if (!active.moving && Math.hypot(event.clientX - active.startX, event.clientY - active.startY) < 5) return;
    active.moving = true;
    setPreview({ id: active.id, target: targetAt(event.clientX, event.clientY), x: event.clientX, y: event.clientY });
  }

  function cancel() { drag.current = null; setPreview(null); }

  return <div className="fs-new-data">
    <span>옆 반 학생 {data.length}명의 통학 시간 · 분</span>
    <p className="fs-sort-help" id={helpId}>끌어서 순서를 바꾸세요. 키보드: ← →</p>
    <div className="fs-sort-cards" ref={list} role="group" aria-label="통학 시간 카드 정렬">
      {order.map((id, index) => <button
        type="button" key={id}
        ref={element => { if (element) cards.current.set(id, element); else cards.current.delete(id); }}
        aria-label={`${data[id]}분 카드, ${index + 1} / ${data.length}`}
        aria-describedby={helpId}
        className={`fs-sort-card${preview?.id === id ? ' is-dragging' : ''}${preview?.target === index && preview.id !== id ? ' is-target' : ''}`}
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0 || drag.current) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, moving: false };
        }}
        onPointerMove={pointerMove}
        onPointerUp={event => {
          const active = drag.current;
          if (!active || active.pointer !== event.pointerId) return;
          const target = targetAt(event.clientX, event.clientY);
          if (active.moving && target !== null) move(active.id, target);
          cancel();
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={cancel} onLostPointerCapture={cancel}
        onKeyDown={event => {
          if (event.key === 'Escape') { cancel(); return; }
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          move(id, index + (event.key === 'ArrowLeft' ? -1 : 1));
        }}
      >{data[id]}</button>)}
    </div>
    {preview && <span className="fs-sort-ghost" aria-hidden="true" style={{ left: preview.x, top: preview.y }}>{data[preview.id]}</span>}
    <p className="fs-sort-status" role="status">{status}</p>
  </div>;
}
