import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ut2Api } from './ut2ServerApi';
import { ut1Api } from './ut1ServerApi';
import './ConditionalProblemMapPage.css';

export default function UTEntryPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function enter() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      // Only routing is client-side; both campaigns validate the entry code on the server.
      const second = password === 'abcd';
      if (second) await ut2Api(import.meta.env.PROD ? '/api/v1' : import.meta.env.VITE_UT2_API_BASE_URL || '/api/v1').enter(password);
      else await ut1Api(import.meta.env.PROD ? '/api/v1' : import.meta.env.VITE_UT1_API_BASE_URL || '/api/v1').enter(password);
      navigate(second ? '/ut2' : '/ut1', { state: { entryPassword: password }, replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : '입장할 수 없어요.'); }
    finally { setBusy(false); }
  }
  return <div className="cpm-page"><nav className="cpm-nav"><strong>수확행</strong><Link to="/">홈</Link></nav><main><section className="cpm-study"><h1>학습 체험하기</h1><p>안내받은 입장 암호를 입력해 주세요.</p>
    <form onSubmit={e => { e.preventDefault(); void enter(); }}><label>입장 암호<input type="password" aria-label="입장 암호" autoComplete="off" autoFocus value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label><div className="cpm-actions"><button className="cpm-primary" disabled={busy || !password}>{busy ? '확인 중…' : '다음 →'}</button></div></form>{error && <p role="alert">{error}</p>}
  </section></main></div>;
}
