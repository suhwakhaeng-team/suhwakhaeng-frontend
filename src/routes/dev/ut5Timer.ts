export type Timing = { startedAt: number; activeMs: number; interruptions: number; updatedAt: number; running: boolean };
export type TimingStore = Pick<Storage, 'getItem' | 'setItem'>;

// A persisted heartbeat bounds lost active time after an abrupt browser termination.
// Closed pages and hidden tabs are never reconstructed as active solving time.
export class UT5Timer {
  state: Timing;
  private tickAt: number;
  private stopped = false;
  private storage: TimingStore;
  private key: string;
  private now: () => number;
  constructor(storage: TimingStore, key: string, now = () => Date.now()) {
    this.storage = storage; this.key = key; this.now = now;
    const at = now();
    const raw = storage.getItem(key);
    const saved: Timing | null = raw ? JSON.parse(raw) : null;
    if (saved && (!Number.isFinite(saved.activeMs) || saved.activeMs < 0 || !Number.isFinite(saved.startedAt) || !Number.isInteger(saved.interruptions))) throw new Error('시간 기록을 복원할 수 없어요. 관리자에게 문의해 주세요.');
    this.state = saved ? { ...saved, interruptions: saved.interruptions + (saved.running ? 1 : 0), running: false } : { startedAt: at, activeMs: 0, interruptions: 0, updatedAt: at, running: false };
    this.tickAt = at;
    this.save();
  }
  private save() { this.storage.setItem(this.key, JSON.stringify(this.state)); }
  tick() {
    const at = this.now();
    if (this.state.running) this.state.activeMs += Math.max(0, at - this.tickAt);
    this.tickAt = at; this.state.updatedAt = at; this.save();
  }
  resume() { if (this.stopped || this.state.running) return; this.tick(); this.state.running = true; this.save(); }
  pause() {
    this.tick();
    if (this.state.running) this.state.interruptions++;
    this.state.running = false; this.save();
  }
  finish() { this.tick(); this.state.running = false; this.stopped = true; this.save(); return this.metrics(); }
  metrics() {
    const seconds = this.state.activeMs / 1000;
    return { seconds, elapsedSeconds: Math.max(seconds, (this.now() - this.state.startedAt) / 1000), startedAt: this.state.startedAt, interruptions: this.state.interruptions };
  }
}
