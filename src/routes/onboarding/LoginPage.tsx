import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1 style={{ fontSize: '36px', color: '#2563EB', marginBottom: '40px' }}>수확행</h1>

      <button
        onClick={() => navigate('/onboarding/grade')}
        style={{ display: 'block', width: '100%', padding: '14px', background: '#fff', color: '#000', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
      >
        Google로 계속하기
      </button>
    </div>
  );
}
