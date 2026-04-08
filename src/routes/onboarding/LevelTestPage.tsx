import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LevelTestPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const totalProblems = 3;

  const handleNext = () => {
    if (current < totalProblems - 1) {
      setCurrent(current + 1);
      setAnswer('');
    } else {
      navigate('/onboarding/result');
    }
  };

  return (
    <div>
      {/* 프로그레스 바 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {Array.from({ length: totalProblems }).map((_, i) => (
          <div
            key={i}
            style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= current ? '#2563EB' : '#eee' }}
          />
        ))}
      </div>

      <h2>문제 {current + 1}</h2>
      <p style={{ color: '#666', marginTop: '12px' }}>
        TODO: 서버에서 문제 데이터 로드
      </p>

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="답 입력"
        style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '16px', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        {current > 0 && (
          <button
            onClick={() => { setCurrent(current - 1); setAnswer(''); }}
            style={{ flex: 1, padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
          >
            이전
          </button>
        )}
        <button
          onClick={handleNext}
          style={{ flex: 1, padding: '14px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
        >
          {current < totalProblems - 1 ? '다음' : '제출'}
        </button>
      </div>
    </div>
  );
}
