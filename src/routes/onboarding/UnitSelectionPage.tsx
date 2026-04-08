import { useNavigate } from 'react-router-dom';

const units = ['전체', '확률', '통계'];

export default function UnitSelectionPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>단원을 선택해주세요</h2>
      <p style={{ color: '#888' }}>학습 범위 설정</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
        {units.map((unit) => (
          <button
            key={unit}
            onClick={() => navigate('/onboarding/nickname')}
            style={{ padding: '16px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', textAlign: 'left' }}
          >
            {unit}
          </button>
        ))}
      </div>
    </div>
  );
}
