import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { localTestMode } from '../../lib/localMode';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginLocal } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const localPending = useRef(false);
  const { reset } = useOnboarding();

  const handleLocalLogin = async (createNew: boolean) => {
    if (localPending.current) return;
    localPending.current = true;
    setLocalBusy(true);
    try {
      setError(null);
      const user = await loginLocal(createNew);
      reset();
      navigate(user.isTested ? '/main/home' : '/onboarding/grade');
    } catch (e) {
      setError(e instanceof Error ? e.message : '로컬 로그인 실패');
    } finally {
      localPending.current = false;
      setLocalBusy(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google 인증 정보를 받지 못했습니다.');
      return;
    }

    try {
      setError(null);
      const loggedInUser = await login(credentialResponse.credential);
      // 이미 레벨테스트까지 마친 사용자는 메인으로 직행, 아니면 온보딩 진행.
      if (loggedInUser.isTested) {
        navigate('/main/home');
      } else {
        navigate('/onboarding/grade');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.');
    }
  };

  return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1 style={{ fontSize: '36px', color: '#2563EB', marginBottom: '40px' }}>수확행</h1>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {localTestMode ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button disabled={localBusy} onClick={() => void handleLocalLogin(true)}>새 테스트 계정 만들기</button>
          <button disabled={localBusy} onClick={() => void handleLocalLogin(false)}>최근 테스트 계정으로 계속하기</button>
          <small>새 계정은 학년 선택부터 시작하며, 기존 계정의 기록은 유지됩니다.</small>
        </div> : <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google 로그인에 실패했습니다.')}
          size="large"
          width={320}
          text="continue_with"
          shape="rectangular"
        />}
      </div>
      {localTestMode && <p>로컬 복원 DB 연결 · 테스트 기록은 내 컴퓨터에만 저장됩니다.<br />AI·Google·AWS 연동은 비활성 상태입니다.</p>}

      {error && (
        <p style={{ color: '#EF4444', marginTop: '16px', fontSize: '14px' }}>{error}</p>
      )}
    </div>
  );
}
