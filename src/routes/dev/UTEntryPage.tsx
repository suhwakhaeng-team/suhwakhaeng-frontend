import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { ut2Api } from './ut2ServerApi';
import { ut3Api } from './ut3ServerApi';
import { ut1Api } from './ut1ServerApi';
import './UT1PreviewPage.css';

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
      const third = password === 'math';
      const second = password === 'abcd';
      if (third) await ut3Api(import.meta.env.PROD ? '/api/v1' : import.meta.env.VITE_UT3_API_BASE_URL || '/api/v1').enter(password);
      else if (second) await ut2Api(import.meta.env.PROD ? '/api/v1' : import.meta.env.VITE_UT2_API_BASE_URL || '/api/v1').enter(password);
      else await ut1Api(import.meta.env.PROD ? '/api/v1' : import.meta.env.VITE_UT1_API_BASE_URL || '/api/v1').enter(password);
      navigate(third ? '/ut3' : second ? '/ut2' : '/ut1', { state: { entryPassword: password }, replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : '입장할 수 없어요.'); }
    finally { setBusy(false); }
  }
  return <div className="ut-preview ut-entry"><main className="ut-registration" style={{ padding: spacing.xl, background: colors.white, borderRadius: radius.lg }}>
    <div className="ut-entry-brand">수확행</div><h1>학습 체험하기</h1><p>안내받은 입장 암호를 입력해 주세요.</p>
    <form onSubmit={e => { e.preventDefault(); void enter(); }}><label>입장 암호<input type="password" inputMode="text" aria-label="입장 암호" autoComplete="off" autoFocus value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label>
      {error && <p className="ut-error" role="alert">{error}</p>}
      <button style={{ padding:'14px 24px', background:colors.brand600, color:colors.white, border:'none', borderRadius:radius.sm, ...typography.bodyTextXLSemiBold, fontSize:16, cursor:'pointer' }} disabled={busy || !password}>{busy ? '확인 중…' : '다음 →'}</button>
    </form>
  </main></div>;
}
