import { useNavigate } from 'react-router-dom';

const grades = ['중1', '중2', '중3', '고1', '고2', '고3'];

export default function GradeSelectionPage() {
  const navigate = useNavigate();

  const handleSelect = (grade: string) => {
    if (grade === '고3') {
      navigate('/onboarding/subject');
    } else {
      navigate('/onboarding/nickname');
    }
  };

  return (
    <div>
      <h2>학년을 선택해주세요</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
        {grades.map((grade) => (
          <button
            key={grade}
            onClick={() => handleSelect(grade)}
            style={{ padding: '20px', fontSize: '18px', border: '1px solid #ddd', borderRadius: '12px', background: '#fff', cursor: 'pointer' }}
          >
            {grade}
          </button>
        ))}
      </div>
    </div>
  );
}
