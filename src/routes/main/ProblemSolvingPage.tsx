import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ProblemSolvingPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [answer, setAnswer] = useState('');

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h2>문제 {id}</h2>
      <p style={{ color: '#666', marginTop: '8px' }}>TODO: 서버에서 문제 데이터 로드</p>

      <div style={{ marginTop: '24px', padding: '60px', background: '#f9f9f9', borderRadius: '12px', textAlign: 'center', color: '#aaa' }}>
        TODO: 문제 내용
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="답 입력"
          style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
        />
        <button
          onClick={() => navigate('/main/problem-result')}
          style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
