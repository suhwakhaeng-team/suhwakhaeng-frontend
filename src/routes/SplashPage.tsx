import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../lib/tokenStorage';

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tokenStorage.hasTokens()) {
        navigate('/main/home');
      } else {
        navigate('/onboarding/login');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '48px', color: '#2563EB' }}>수확행</h1>
      <p style={{ color: '#888' }}>수학 AI 학습 도우미</p>
    </div>
  );
}
