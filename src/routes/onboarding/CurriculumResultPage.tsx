import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';

export default function CurriculumResultPage() {
  const navigate = useNavigate();
  const { levelTestResult } = useOnboarding();
  const { user } = useAuth();

  // 결과 없이 직접 접근한 경우: 실력테스트로 리다이렉트.
  useEffect(() => {
    if (!levelTestResult) {
      navigate('/onboarding/level-test', { replace: true });
    }
  }, [levelTestResult, navigate]);

  if (!levelTestResult) {
    return null;
  }

  const displayName = user?.nickname || user?.name || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* 완료 아이콘 (유니코드 체크) */}
      <div
        aria-hidden
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.full,
          background: colors.green500,
          color: colors.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          fontWeight: 700,
          marginBottom: spacing.xl,
        }}
      >
        ✓
      </div>

      <h2
        style={{
          ...typography.headingXLBold,
          color: colors.gray900,
          textAlign: 'center',
          margin: 0,
        }}
      >
        {displayName}님에 딱 맞는
        <br />
        커리큘럼이 완성되었어요
      </h2>

      <div
        style={{
          marginTop: spacing.xxl,
          width: '100%',
          padding: spacing.xl,
          background: colors.brand50,
          borderRadius: radius.md,
          boxSizing: 'border-box',
        }}
      >
        <h3
          style={{
            ...typography.headingMdBold,
            color: colors.brand600,
            margin: 0,
            marginBottom: spacing.md,
          }}
        >
          전체 평가
        </h3>
        <p
          style={{
            ...typography.bodyTextXLRegular,
            color: colors.gray600,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {levelTestResult.overallAssessment}
        </p>

        <h3
          style={{
            ...typography.headingMdBold,
            color: colors.brand600,
            marginTop: spacing.xl,
            marginBottom: spacing.md,
          }}
        >
          토픽별 이해도
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {Object.entries(levelTestResult.topicMastery).map(([topic, mastery]) => {
            const percent = Math.max(0, Math.min(100, Math.round(mastery * 100)));
            return (
              <div key={topic}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: spacing.xs,
                  }}
                >
                  <span
                    style={{
                      ...typography.bodyTextXLSemiBold,
                      color: colors.gray700,
                    }}
                  >
                    {topic}
                  </span>
                  <span
                    style={{
                      ...typography.captionSemiBold,
                      color: colors.gray500,
                    }}
                  >
                    {percent}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 8,
                    borderRadius: radius.full,
                    background: colors.gray200,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: colors.brand500,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {levelTestResult.learningRoute && (
          <>
            <h3
              style={{
                ...typography.headingMdBold,
                color: colors.brand600,
                marginTop: spacing.xl,
                marginBottom: spacing.md,
              }}
            >
              학습 경로
            </h3>
            <p
              style={{
                ...typography.bodyTextXLRegular,
                color: colors.gray700,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {levelTestResult.learningRoute}
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => navigate('/main/home')}
        style={{
          marginTop: spacing.xxl,
          width: '100%',
          padding: `${spacing.lg}px 0`,
          background: colors.brand500,
          color: colors.white,
          border: 'none',
          borderRadius: radius.md,
          ...typography.headingMdBold,
          cursor: 'pointer',
        }}
      >
        학습 시작하기
      </button>
    </div>
  );
}
