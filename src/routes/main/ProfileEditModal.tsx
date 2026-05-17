import { useState, useEffect } from 'react';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { updateNickname, updateGrade } from '../../lib/userClient';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string;
  currentGrade: number | null;
  uid: string;
  onSaved: (nickname: string, grade: number | null) => void;
}

// 학년 grid 옵션: 중1~고3 = grade 1~6.
// MyPagePage 의 gradeLabel(`고${grade}`)와 동일한 매핑 규칙을 유지한다.
const GRADE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '중1' },
  { value: 2, label: '중2' },
  { value: 3, label: '중3' },
  { value: 4, label: '고1' },
  { value: 5, label: '고2' },
  { value: 6, label: '고3' },
];

export default function ProfileEditModal({
  isOpen,
  onClose,
  currentNickname,
  currentGrade,
  uid,
  onSaved,
}: ProfileEditModalProps) {
  const [nickname, setNickname] = useState(currentNickname);
  const [grade, setGrade] = useState<number | null>(currentGrade);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  // 닉네임 검증 — NicknameInputPage와 동일하게 trim 후 2~7자.
  const trimmedNickname = nickname.trim();
  const isNicknameValid = trimmedNickname.length >= 2 && trimmedNickname.length <= 7;

  // 변경 감지 — 둘 중 하나라도 달라졌고 닉네임은 유효해야 저장 가능.
  const nicknameChanged = trimmedNickname !== currentNickname.trim();
  const gradeChanged = grade !== currentGrade;
  const hasChanges = nicknameChanged || gradeChanged;
  const canSave = hasChanges && isNicknameValid && !isSubmitting;

  const handleSave = async () => {
    if (!canSave) return;
    if (!uid) {
      setError('로그인 정보를 확인할 수 없습니다.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // 부분 성공 추적 — 어느 한쪽이 실패하면 성공한 쪽만 onSaved로 반영한다.
    let savedNickname = currentNickname;
    let savedGrade = currentGrade;
    let failureMessage: string | null = null;

    if (nicknameChanged) {
      const res = await updateNickname(uid, trimmedNickname);
      if (res.success) {
        savedNickname = trimmedNickname;
      } else {
        failureMessage = res.error || '닉네임 저장에 실패했습니다.';
      }
    }

    if (gradeChanged && grade !== null) {
      const res = await updateGrade(uid, grade);
      if (res.success) {
        savedGrade = grade;
      } else {
        failureMessage = res.error || '학년 저장에 실패했습니다.';
      }
    }

    setIsSubmitting(false);

    if (failureMessage) {
      setError(failureMessage);
      // 부분 성공한 값이라도 부모에 반영 — UI 동기화 유지.
      if (savedNickname !== currentNickname || savedGrade !== currentGrade) {
        onSaved(savedNickname, savedGrade);
      }
      return;
    }

    onSaved(savedNickname, savedGrade);
    onClose();
  };

  // 오버레이 클릭 시에만 닫기. 카드 내부 클릭은 stopPropagation으로 막는다.
  const handleOverlayClick = () => {
    if (isSubmitting) return;
    onClose();
  };

  const nicknameBorderColor = error
    ? colors.red500
    : isFocused
      ? colors.brand500
      : colors.gray300;
  const nicknameBorderWidth = isFocused || error ? 2 : 1;

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: spacing.lg,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: colors.white,
          borderRadius: radius.xl,
          padding: spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xl,
          boxSizing: 'border-box',
        }}
      >
        <h2
          style={{
            ...typography.headingXLBold,
            color: colors.gray900,
            margin: 0,
          }}
        >
          프로필 수정
        </h2>

        {/* 닉네임 섹션 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <label
            style={{
              ...typography.bodyTextXLSemiBold,
              color: colors.gray700,
            }}
          >
            닉네임
          </label>
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
              borderBottom: `${nicknameBorderWidth}px solid ${nicknameBorderColor}`,
              outline: 'none',
              background: 'transparent',
              boxSizing: 'border-box',
              opacity: isSubmitting ? 0.5 : 1,
            }}
          />
          {!isNicknameValid && trimmedNickname.length > 0 && (
            <p
              style={{
                ...typography.bodyTextLgRegular,
                color: colors.red500,
                margin: 0,
              }}
            >
              닉네임은 2~7자로 입력해주세요.
            </p>
          )}
        </div>

        {/* 학년 섹션 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <label
            style={{
              ...typography.bodyTextXLSemiBold,
              color: colors.gray700,
            }}
          >
            학년
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: spacing.sm,
            }}
          >
            {GRADE_OPTIONS.map((option) => {
              const selected = grade === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGrade(option.value)}
                  disabled={isSubmitting}
                  style={{
                    padding: `${spacing.md}px 0`,
                    background: selected ? colors.brand500 : colors.white,
                    color: selected ? colors.white : colors.gray700,
                    border: `1px solid ${selected ? colors.brand500 : colors.gray300}`,
                    borderRadius: radius.md,
                    ...typography.bodyTextXLSemiBold,
                    cursor: isSubmitting ? 'default' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 에러 메시지 (API 실패) */}
        {error && (
          <p
            style={{
              ...typography.bodyTextLgRegular,
              color: colors.red500,
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        {/* 액션 버튼들 */}
        <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: `${spacing.md}px 0`,
              background: colors.white,
              color: colors.gray700,
              border: `1px solid ${colors.gray300}`,
              borderRadius: radius.md,
              ...typography.headingMdSemiBold,
              cursor: isSubmitting ? 'default' : 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 1,
              padding: `${spacing.md}px 0`,
              background: canSave ? colors.brand500 : colors.gray300,
              color: colors.white,
              border: 'none',
              borderRadius: radius.md,
              ...typography.headingMdBold,
              cursor: canSave ? 'pointer' : 'default',
            }}
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
