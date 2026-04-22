import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../lib/tokenStorage';
import { refreshTokens } from '../lib/apiClient';

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedUser = tokenStorage.getUser();
      const hasTokens = tokenStorage.hasTokens();

      // 토큰 없거나 온보딩 미완료 → 바로 로그인 화면으로.
      if (!hasTokens || !storedUser?.isTested) {
        if (!cancelled) navigate('/onboarding/login');
        return;
      }

      // 저장된 토큰이 만료됐을 수 있으므로 메인 진입 전에 선제 refresh.
      // 성공: 새 토큰으로 /main/home. 실패: 로컬 토큰 정리 후 /onboarding/login.
      // (과거 플로우는 만료 토큰으로 메인 진입 → 첫 API 호출 401 → 강제 로그아웃 루프)
      const ok = await refreshTokens();
      if (cancelled) return;

      if (ok) {
        navigate('/main/home');
      } else {
        tokenStorage.clear();
        navigate('/onboarding/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '48px', color: '#2563EB' }}>수확행</h1>
      <p style={{ color: '#888' }}>수학 AI 학습 도우미</p>
    </div>
  );
}
