import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { gradeLabel as formatGrade } from '../../types/home';
import ProfileEditModal from './ProfileEditModal';

const TERMS_URL = 'https://dazzling-card-d4f.notion.site/34d69b69e90380ee9eace2393373a6f5?source=copy_link';
const SUPPORT_URL = 'https://dazzling-card-d4f.notion.site/Suhwakhaeng-34d69b69e9038039a02ec9a9bb50afce?source=copy_link';

export default function MyPagePage() {
  const { user, logout, deleteAccount, updateUser } = useAuth();
  const displayName = user?.nickname || user?.name || '닉네임';
  const gradeLabel = formatGrade(user?.grade) ?? '';
  const [editOpen, setEditOpen] = useState(false);

  const handleItemClick = async (item: string) => {
    if (item === '로그아웃') {
      const confirmed = window.confirm('로그아웃 하시겠어요?');
      if (!confirmed) return;
      await logout();
      return;
    }
    if (item === '회원 탈퇴') {
      const confirmed = window.confirm(
        '정말 탈퇴하시겠어요?\n모든 학습 기록이 삭제되며 복구할 수 없습니다.',
      );
      if (!confirmed) return;
      await deleteAccount();
      return;
    }
    if (item === '이용약관') {
      window.open(TERMS_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item === '고객센터') {
      window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer');
      return;
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h2>마이페이지</h2>

      <div
        onClick={() => setEditOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px', padding: '20px', background: '#f9f9f9', borderRadius: '12px', cursor: 'pointer' }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
          👤
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 'bold', fontSize: '18px' }}>{displayName}</p>
          <p style={{ color: '#888' }}>{gradeLabel}</p>
        </div>
        <span style={{ fontSize: '14px', color: '#6366f1', fontWeight: 600 }}>수정</span>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {['고객센터', '이용약관', '로그아웃', '회원 탈퇴'].map((item) => (
          <button
            key={item}
            onClick={() => { void handleItemClick(item); }}
            style={{ padding: '16px', background: '#fff', border: 'none', borderBottom: '1px solid #eee', textAlign: 'left', fontSize: '16px', cursor: 'pointer', color: item === '회원 탈퇴' ? '#ef4444' : '#333' }}
          >
            {item}
          </button>
        ))}
      </div>

      {editOpen && (
        <ProfileEditModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          currentNickname={user?.nickname || user?.name || ''}
          currentGrade={user?.grade ?? null}
          uid={user?.uid || ''}
          onSaved={(nickname, grade) => {
            updateUser({ nickname, grade });
          }}
        />
      )}
    </div>
  );
}
