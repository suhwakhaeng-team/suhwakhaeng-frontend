import { useSyncExternalStore } from 'react';
import { emptyPreviewSession, parsePreviewSession, resumeUnitFlow, type PreviewSession } from './levelTestPreviewState.ts';

// Scoped to the local prototype; never modifies account or production records.
const STORAGE_KEY = 'suhwakhaeng:level-test-preview:v1';

function readStoredSession() {
  try { return resumeUnitFlow(parsePreviewSession(window.localStorage.getItem(STORAGE_KEY))); }
  catch { return emptyPreviewSession(); }
}

let snapshot = typeof window === 'undefined' ? emptyPreviewSession() : readStoredSession();
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function getSnapshot() { return snapshot; }

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    snapshot = resumeUnitFlow(parsePreviewSession(event.newValue));
    listeners.forEach(listener => listener());
  });
}

export function updatePreviewSession(update: Partial<PreviewSession> | ((state: PreviewSession) => PreviewSession)) {
  snapshot = typeof update === 'function' ? update(snapshot) : { ...snapshot, ...update };
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); }
  catch { /* The current tab still works when browser storage is disabled. */ }
  listeners.forEach(listener => listener());
}

export function usePreviewSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
