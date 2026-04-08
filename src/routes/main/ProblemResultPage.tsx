import { useNavigate } from 'react-router-dom';

export default function ProblemResultPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
      <h2 style={{ color: '#22c55e' }}>정답입니다!</h2>

      <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/main/problem/2')}
          style={{ padding: '12px 32px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
        >
          다음 문제 풀기
        </button>
        <button
          onClick={() => navigate('/main/home')}
          style={{ padding: '12px 32px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
        >
          홈으로
        </button>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', color: '#666' }}>
        <input type="checkbox" />
        문제 저장하기
      </label>
    </div>
  );
}
