import { useNavigate } from 'react-router-dom';

export default function TestIntroPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
      <h2>커리큘럼 테스트</h2>
      <p style={{ color: '#666', marginTop: '16px', lineHeight: '1.6' }}>
        3문제의 간단한 테스트를 통해<br />
        맞춤형 커리큘럼을 만들어드려요!
      </p>
      <button
        onClick={() => navigate('/onboarding/level-test')}
        style={{ marginTop: '40px', padding: '14px 48px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
      >
        테스트 시작하기
      </button>
    </div>
  );
}
