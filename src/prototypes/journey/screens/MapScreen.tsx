import { useEffect, type CSSProperties } from 'react';
import { Asset, Frame, MetroDiagram, Profile } from '../FigmaMetro';
import { stationX } from '../layout';
import { childKey, type JourneyState, type Screen, type Topic, type Unit } from '../model';

type MapProps = {
  mode: 'unit' | 'detail'; mobile: boolean; arrive: boolean;
  unit: Unit; state: JourneyState; topicIndex: number; childIndex: number; lesson: Topic;
  go: (screen: Screen) => void; selectTopic: (index: number) => void;
  openDetail: (topicIndex?: number, childIndex?: number) => void; startLesson: () => void;
};

function DetailPanel({ unit, topic, child, childIndex, lesson, hidden, go, startLesson }: {
  unit: Unit; topic: Topic; child: string; childIndex: number; lesson: Topic; hidden?: boolean; go: (screen: Screen) => void; startLesson: () => void;
}) {
  return <aside className="j-detail-panel" aria-label="세부 학습 정보" inert={hidden}>
    <div className="j-breadcrumb">
      <span>{unit.name}</span><span>›</span><b>{topic.short || topic.name}</b>
      <button aria-label="세부 학습 닫기" onClick={() => go('unit')}><Asset name="detail-img13" /></button>
    </div>
    <header key={`${topic.name}:${child}`}><span className="j-tag">{topic.short || topic.name}</span><h1>{child}</h1></header>
    <section className="j-concept-info"><h2>개념 정보</h2><p>{lesson.description}</p></section>
    <h2 className="j-panel-heading">학습하기</h2>
    <button className="j-panel-action primary" onClick={startLesson}>
      <Asset name="detail-imgSquarePen" /><span><b>문제 풀기</b><small>개념을 살펴보고 문제로 확인해요</small></span><Asset name="detail-imgGroup39" />
    </button>
    <button className="j-panel-action" onClick={() => go('unit')}>
      <Asset name="detail-imgWaypoints" /><span><b>개념 지도 보기</b><small>연결된 개념을 한눈에 살펴봐요</small></span><Asset name="detail-imgGroup40" />
    </button>
    <div className="j-detail-sequence">
      <span>세부 학습 {childIndex + 1} / {topic.children.length}</span>
      <div className="j-small-progress"><i style={{ width: `${(childIndex + 1) / topic.children.length * 100}%` }} /></div>
      <p>학습을 마치면 다음 개념으로 이어져요.</p>
    </div>
  </aside>;
}

/**
 * Overview and detail are one screen on desktop: the same map stays mounted and a CSS camera zooms into the
 * selected station while the panel slides in, so there is never a second copy of the map to cross-fade.
 */
export default function MapScreen(props: MapProps) {
  const { mode, mobile, arrive, unit, state, topicIndex, childIndex, lesson, go, selectTopic, openDetail, startLesson } = props;
  const topic = unit.topics[topicIndex];
  const child = topic.children[childIndex];
  const detail = mode === 'detail';
  const totalChildren = unit.topics.reduce((sum, t) => sum + t.children.length, 0);
  const completedChildren = unit.topics.reduce((sum, t, ti) => sum + t.children.filter((_, ci) => state.completed.includes(childKey(unit.id, ti, ci))).length, 0);
  const topicCompleted = topic.children.filter((_, i) => state.completed.includes(childKey(unit.id, topicIndex, i))).length;

  useEffect(() => {
    // On a phone the map is wider than the screen, so bring the current station into view.
    if (mobile && !detail) document.querySelector('.j-major-node.is-current')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [mobile, detail, topicIndex, unit.id]);

  const diagram = <MetroDiagram unit={unit} state={state} arrive={arrive} selectedTopic={topicIndex} selectedChild={detail ? childIndex : undefined}
    onSelectTopic={detail ? i => openDetail(i) : selectTopic} onSelectChild={openDetail} />;
  const panel = <DetailPanel unit={unit} topic={topic} child={child} childIndex={childIndex} lesson={lesson} hidden={!detail} go={go} startLesson={startLesson} />;

  if (mobile && detail) {
    return <div className="j-mobile-detail">
      <div className="j-mobile-focus-map">
        <div style={{ transform: `translate(${190 - stationX(topicIndex, unit.topics.length) * .9}px,-240px) scale(.9)` }}>{diagram}</div>
        <button onClick={() => go('unit')}>← 단원 전체 보기</button>
      </div>
      {panel}
    </div>;
  }

  return <>
    <Frame kind="map">
      <section className={`j-unit-board ${detail ? 'is-detail' : ''}`} style={{ '--station-x': `${stationX(topicIndex, unit.topics.length)}px` } as CSSProperties}>
        <header className="j-unit-header" inert={detail}>
          <span className="j-tag">{completedChildren ? '학습 중' : '맞춤 커리큘럼'}</span>
          <h1>{unit.name}</h1>
          <p>전체 {totalChildren}개 세부 개념 중 {completedChildren}개 학습 완료</p>
        </header>
        <div className="j-unit-profile" inert={detail}><Profile name={state.nickname} onClick={() => go('profile')} /></div>
        <div className="j-map-camera">{diagram}</div>
        <button className="j-focus-back" inert={!detail} onClick={() => go('unit')}>← 단원 전체 보기</button>
        <footer className="j-map-footer" inert={detail}>
          <div className="j-footer-backplate" />
          <button className="j-map-back" aria-label="커리큘럼 홈으로 돌아가기" onClick={() => go('home')}><Asset name="counting-imgUnion" /></button>
          <div className="j-footer-body">
            <div className="j-footer-train"><Asset name="counting-imgGroup2" /><Asset name="counting-imgGroup20" /></div>
            <div className="j-footer-topic"><span className="j-tag">{unit.name}</span><h2>{topic.short || topic.name}</h2></div>
            <div className="j-footer-progress">
              <small>학습 완료한 세부 개념</small>
              <div><span className="j-small-progress"><i style={{ width: `${topicCompleted / topic.children.length * 100}%` }} /></span><small>{topicCompleted}/{topic.children.length}</small></div>
            </div>
            <button className="j-primary" onClick={() => openDetail()}>학습하기 <span>→</span></button>
          </div>
        </footer>
        {!mobile && panel}
      </section>
    </Frame>
    {mobile && <div className="j-mobile-map-controls">
      <button aria-label="커리큘럼 홈으로 돌아가기" onClick={() => go('home')}>←</button>
      <span><b>{topic.short || topic.name}</b><small>세부 개념 {topicCompleted}/{topic.children.length} 완료 · 옆으로 밀어 살펴보세요</small></span>
      <button onClick={() => openDetail()}>학습하기 →</button>
    </div>}
  </>;
}
