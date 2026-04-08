import { useNavigate } from 'react-router-dom';

export default function MyPagePage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h2>마이페이지</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px', padding: '20px', background: '#f9f9f9', borderRadius: '12px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
          👤
        </div>
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '18px' }}>닉네임</p>
          <p style={{ color: '#888' }}>고3</p>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {['고객센터', '이용약관', '로그아웃', '회원 탈퇴'].map((item) => (
          <button
            key={item}
            onClick={() => {
              if (item === '로그아웃') navigate('/onboarding/login');
            }}
            style={{ padding: '16px', background: '#fff', border: 'none', borderBottom: '1px solid #eee', textAlign: 'left', fontSize: '16px', cursor: 'pointer', color: item === '회원 탈퇴' ? '#ef4444' : '#333' }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
