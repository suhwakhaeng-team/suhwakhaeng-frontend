import { lazy, Suspense } from 'react';

const TopologyPage = lazy(() => import('./main/TopologyPage'));
const KnowledgeGraphPage = lazy(() => import('./main/KnowledgeGraphPage'));

export function TopologyRoute() {
  return <Suspense fallback={null}><TopologyPage /></Suspense>;
}

export function KnowledgeGraphRoute({ preview = false }: { preview?: boolean }) {
  const page = <Suspense fallback={<p>개념 지도를 준비하고 있어요…</p>}><KnowledgeGraphPage preview={preview} /></Suspense>;
  if (!preview) return page;
  return <div className="kg-preview-shell">
    <nav className="kg-preview-nav"><strong>수확행</strong><span>홈</span><span>AI 개념정리</span><span>마이페이지</span></nav>
    <div className="kg-preview-content">{page}</div>
  </div>;
}
