export default function GraphIcon({ name, size = 18 }: { name: 'graph' | 'search' | 'focus' | 'arrow' | 'close' | 'back'; size?: number }) {
  const paths = {
    graph: <><path d="m5 6 13 2M5 6l5 13M18 8l-8 11" /><circle cx="5" cy="6" r="3" /><circle cx="18" cy="8" r="3" /><circle cx="10" cy="19" r="3" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    focus: <><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" /><circle cx="12" cy="12" r="3" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
