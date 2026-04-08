import { useNavigate } from 'react-router-dom';

export default function CurriculumResultPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', paddingTop: '40px' }}>
      <h2>님에 딱 맞는 커리큘럼이<br />완성되었어요!</h2>

      <div style={{ marginTop: '32px', padding: '24px', background: '#f0f7ff', borderRadius: '12px', textAlign: 'left' }}>
        <h3 style={{ color: '#2563EB', marginBottom: '12px' }}>전체 평가</h3>
        <p style={{ color: '#666' }}>TODO: AI 학습경로 결과 표시</p>

        <h3 style={{ color: '#2563EB', marginTop: '20px', marginBottom: '12px' }}>토픽별 이해도</h3>
        <p style={{ color: '#666' }}>TODO: 토픽별 프로그레스 바</p>
      </div>

      <button
        onClick={() => navigate('/main/home')}
        style={{ marginTop: '32px', width: '100%', padding: '14px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
      >
        학습 시작하기
      </button>
    </div>
  );
}
