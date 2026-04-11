import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { User } from '../../types/auth';

export default function NicknameInputPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // iOS와 동일하게 공백 제거 후 2~7자 규칙.
  const trimmed = nickname.trim();
  const isValidLength = trimmed.length >= 2 && trimmed.length <= 7;
  const isButtonEnabled = isValidLength && !isSubmitting;

  const handleSubmit = async () => {
    if (!isValidLength) {
      setError('닉네임은 2~7자로 입력해주세요.');
      return;
    }
    if (!user?.uid) {
      setError('로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await apiClient.patch<User>(`/users/${user.uid}/nickname`, { nickname: trimmed });

    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error || '닉네임 저장에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    updateUser({ nickname: trimmed });
    navigate('/onboarding/test-intro');
  };

  const borderColor = error ? colors.red500 : isFocused ? colors.brand500 : colors.gray300;
  const borderWidth = isFocused || error ? 2 : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '70vh' }}>
      <div style={{ paddingBottom: spacing.xxl }}>
        <p
          style={{
            ...typography.bodyTextXLSemiBold,
            color: colors.brand500,
            paddingLeft: 40,
            margin: 0,
            marginBottom: spacing.sm,
          }}
        >
          환영합니다!
        </p>
        <h2 style={{ ...typography.headingXLBold, color: colors.gray900, margin: 0 }}>
          닉네임을 입력해 주세요
        </h2>
      </div>

      <div>
        <input
          type="text"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            if (error) setError(null);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="닉네임 (2~7자)"
          autoComplete="off"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: `${spacing.sm}px 0`,
            ...typography.bodyTextXLRegular,
            color: colors.gray900,
            border: 'none',
            borderBottom: `${borderWidth}px solid ${borderColor}`,
            outline: 'none',
            background: 'transparent',
            boxSizing: 'border-box',
            opacity: isSubmitting ? 0.5 : 1,
          }}
        />
        {error && (
          <p
            style={{
              ...typography.bodyTextXLRegular,
              color: colors.red500,
              margin: 0,
              marginTop: spacing.sm,
            }}
          >
            {error}
          </p>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={handleSubmit}
        disabled={!isButtonEnabled}
        style={{
          width: '100%',
          padding: `${spacing.lg}px 0`,
          marginTop: spacing.xxl,
          background: isButtonEnabled ? colors.brand500 : colors.gray300,
          color: colors.white,
          border: 'none',
          borderRadius: radius.md,
          ...typography.headingMdBold,
          cursor: isButtonEnabled ? 'pointer' : 'default',
        }}
      >
        {isSubmitting ? '저장 중...' : '시작하기'}
      </button>
    </div>
  );
}
