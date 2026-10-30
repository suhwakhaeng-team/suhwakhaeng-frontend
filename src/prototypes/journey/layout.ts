import { useEffect, useState } from 'react';

// clientWidth excludes a scrollbar, so artboards never overflow their host.
const measure = () => ({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight });

export const MOBILE_WIDTH = 760;

/** The single source of truth for layout decisions, so the app and its artboards never disagree about "mobile". */
export function useViewport() {
  const [size, setSize] = useState(measure);
  useEffect(() => {
    const resize = () => setSize(measure());
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return { ...size, mobile: size.width < MOBILE_WIDTH };
}

export const stationX = (index: number, count: number) => count === 8 ? [139.5, 290.5, 458.5, 618.5, 758, 918, 1078, 1257][index] : 139.5 + index * 1117.5 / (count - 1);
