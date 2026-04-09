import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google 인증 정보를 받지 못했습니다.');
      return;
    }

    try {
      setError(null);
      await login(credentialResponse.credential);
      navigate('/onboarding/grade');
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.');
    }
  };

  return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1 style={{ fontSize: '36px', color: '#2563EB', marginBottom: '40px' }}>수확행</h1>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google 로그인에 실패했습니다.')}
          size="large"
          width={320}
          text="continue_with"
          shape="rectangular"
        />
      </div>

      {error && (
        <p style={{ color: '#EF4444', marginTop: '16px', fontSize: '14px' }}>{error}</p>
      )}
    </div>
  );
}
