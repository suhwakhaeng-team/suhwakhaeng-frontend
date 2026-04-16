import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.nickname || user?.name || '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2>{displayName}님, 오늘도 학습해볼까요?</h2>
          <p style={{ color: '#888' }}>고3 · 확률과 통계</p>
        </div>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          👤
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 커리큘럼 섹션 */}
        <div>
          <h3>커리큘럼</h3>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['경우의 수 > 여러 가지 순열', '경우의 수 > 중복조합', '확률 > 조건부확률'].map((topic, i) => (
              <div key={i} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', color: '#666' }}>{topic}</p>
                <p style={{ fontSize: '12px', color: '#aaa' }}>문제 5개</p>
                {i === 0 && (
                  <button
                    onClick={() => navigate('/main/problem/start')}
                    style={{ marginTop: '8px', padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    문제 풀기
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 복습 + 진도 */}
        <div>
          <h3>복습하기</h3>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['원순열 → 여러 가지 순열', '중복조합 → 중복조합과 이항정리'].map((item, i) => (
              <div key={i} style={{ padding: '12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '14px' }}>
                {item}
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: '24px' }}>학습 진도</h3>
          <div style={{ marginTop: '12px', padding: '24px', background: '#f9f9f9', borderRadius: '12px', textAlign: 'center', color: '#aaa' }}>
            TODO: 진도 차트
          </div>
        </div>
      </div>
    </div>
  );
}
