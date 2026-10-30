import { type CSSProperties, type ReactNode } from 'react';
import type { JourneyState, Unit } from './model';
import { stationX, useViewport } from './layout';
import { childKey, topicDone } from './model';

const images = import.meta.glob('./assets/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export function Asset({ name, className = '', style }: { name: string; className?: string; style?: CSSProperties }) {
  return <img src={images[`./assets/${name}.svg`]} className={className} style={style} alt="" draggable={false} data-figma-asset={name} />;
}
export function TrainBadge({ unit = 'counting' }: { unit?: string }) {
  return <span className="j-train-badge"><Asset name={`home-imgGroup${unit === 'counting' ? '1' : unit === 'probability' ? '2' : '3'}`} /><Asset name="home-imgGroup19" className="j-badge-train" /></span>;
}
export function Profile({ name, onClick }: { name: string; onClick?: () => void }) {
  return <button className="j-profile" onClick={onClick} aria-label={`${name || '학습자'} 프로필`}><span>{(name || '학습자').slice(-1)}</span><b>{name || '학습자'}</b></button>;
}

const BASE_WIDTH = 1473.56;
const BASE_HEIGHT = 1024;

export const MOBILE_WIDTH = 760;

export function Frame({ children, kind = 'home' }: { children: ReactNode; kind?: 'home' | 'map' }) {
  const size = useViewport();
  const mobile = size.mobile;
  const fluid = mobile && kind === 'home';
  const scale = fluid ? 1 : mobile ? .8 : Math.min(size.width / BASE_WIDTH, size.height / BASE_HEIGHT);
  // Desktop artboards grow to the viewport's shape instead of letterboxing; content keeps Figma coordinates.
  const width = mobile ? BASE_WIDTH : Math.max(BASE_WIDTH, size.width / scale);
  const height = mobile ? BASE_HEIGHT : Math.max(BASE_HEIGHT, size.height / scale);
  const board = { width, height, transform: `scale(${scale})`, '--board-w': `${width}px`, '--board-h': `${height}px` } as CSSProperties;
  return <div className={`j-frame-host ${mobile ? 'is-mobile' : ''} j-frame-${kind}`}>
    <div className="j-frame-space" style={fluid ? undefined : { width: width * scale, height: height * scale }}>
      <div className="j-artboard" style={fluid ? undefined : board}>{children}</div>
    </div>
  </div>;
}

const branchAssets = ['img7', 'img6', 'img5', 'img4', 'img3', 'img2', 'img3', 'img'];

/** The map retains Figma's fixed diagram geometry; its data and state are interactive. */
export function MetroDiagram({ unit, state, selectedTopic, selectedChild, onSelectTopic, onSelectChild, arrive = false }: {
  unit: Unit; state: JourneyState; selectedTopic: number; selectedChild?: number;
  onSelectTopic: (index: number) => void; onSelectChild: (topic: number, child: number) => void; arrive?: boolean;
}) {
  return <div className={`j-metro-diagram ${arrive ? 'is-arriving' : ''}`} style={{ '--unit-color': unit.color } as CSSProperties}>
    <Asset name={`${unit.id}-imgLine14`} className="j-axis-rail" style={{ left: unit.id === 'counting' ? 64 : -65, top: 472 }} />
    {[0, 1, 2].map(i => <Asset key={i} name={`counting-imgVector${i || ''}`} className="j-rail-chevron" style={{ left: 1408 + i * 13, top: 473 }} />)}
    <div className="j-traveling-train" aria-hidden="true" style={{ transform: `translateX(${stationX(selectedTopic, unit.topics.length) - 55}px)` }}>
      <div className="j-train-carriage"><Asset name="counting-img12" className="j-station-halo" /><Asset name="counting-imgGroup1" className="j-station-circle" /><Asset name="counting-imgGroup19" className="j-station-train" /></div>
    </div>
    {unit.topics.map((topic, topicIndex) => {
      const x = stationX(topicIndex, unit.topics.length);
      const upper = topicIndex % 2 === 0;
      const selected = topicIndex === selectedTopic;
      const done = topicDone(state, unit, topicIndex);
      const rows = Math.min(topic.children.length, 8);
      const gap = upper ? Math.min(topicIndex === 0 ? 48 : 30, 225 / Math.max(1, rows - 1)) : Math.min(30, 210 / Math.max(1, rows - 1));
      const firstY = upper ? 421 - (rows - 1) * gap : 578;
      const lastY = upper ? 482 : firstY + (rows - 1) * gap;
      const lineTop = upper ? firstY : 482;
      return <div key={topic.name} className="j-metro-topic" data-topic-index={topicIndex}>
        <div className="j-branch-crop" style={{ left: x - 1.5, top: lineTop, height: lastY - lineTop, backgroundColor: done ? '#9eadff' : '#bec3cc' }}>
          <Asset name={`counting-${branchAssets[topicIndex % 8]}`} className="j-branch-image" />
        </div>
        <button className={`j-major-node ${selected ? 'is-current' : ''} ${done ? 'is-done' : ''}`} style={{ left: x - 55, top: 427.5 }} aria-label={`${topic.name} 선택`} aria-pressed={selected} onClick={() => onSelectTopic(topicIndex)}>
          <Asset name={done ? `${unit.id === 'probability' ? 'probability-imgGroup414' : unit.id === 'statistics' ? 'statistics-imgGroup402' : 'counting-imgGroup402'}` : 'counting-imgGroup403'} className="j-station-idle" />
          <span className="j-major-label">{topic.short || topic.name}</span>
        </button>
        {topic.children.slice(0, 8).map((child, childIndex) => {
          const passed = state.completed.includes(childKey(unit.id, topicIndex, childIndex)) || done;
          const active = selected && selectedChild === childIndex;
          return <button className={`j-minor-node ${passed ? 'is-done' : ''} ${active ? 'is-selected' : ''}`} style={{ left: x - 5.5, top: firstY + childIndex * gap - 5.5 }} key={child} aria-label={`${child} 학습 보기`} aria-current={active ? 'step' : undefined} onClick={() => onSelectChild(topicIndex, childIndex)}>
            <Asset name={passed ? 'counting-img11' : 'counting-img10'} /><span>{child}</span>
          </button>;
        })}
        {topic.children.length > 8 && <button className="j-more-children" style={{ left: x + 12, top: upper ? firstY - 28 : lastY + 24 }} onClick={() => onSelectChild(topicIndex, 8)}>+ {topic.children.length - 8}개 세부 개념</button>}
      </div>;
    })}
  </div>;
}
