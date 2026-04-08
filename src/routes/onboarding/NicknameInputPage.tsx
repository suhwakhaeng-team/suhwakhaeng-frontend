import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NicknameInputPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');

  return (
    <div>
      <h2>닉네임을 입력해주세요</h2>
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="닉네임"
        style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '24px', boxSizing: 'border-box' }}
      />
      <button
        onClick={() => navigate('/onboarding/test-intro')}
        disabled={!nickname.trim()}
        style={{ width: '100%', padding: '14px', marginTop: '16px', background: nickname.trim() ? '#2563EB' : '#ccc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: nickname.trim() ? 'pointer' : 'default' }}
      >
        다음
      </button>
    </div>
  );
}
