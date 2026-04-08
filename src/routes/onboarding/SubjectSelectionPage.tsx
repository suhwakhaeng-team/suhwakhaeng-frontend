import { useNavigate } from 'react-router-dom';

const subjects = ['미적분', '확률과 통계', '기하'];

export default function SubjectSelectionPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>과목을 선택해주세요</h2>
      <p style={{ color: '#888' }}>고3 전용</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => navigate('/onboarding/unit')}
            style={{ padding: '16px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', textAlign: 'left' }}
          >
            {subject}
          </button>
        ))}
      </div>
    </div>
  );
}
