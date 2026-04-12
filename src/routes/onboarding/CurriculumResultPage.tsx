import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { buildCurriculumCards } from '../../lib/curriculumDefinition';
import CurriculumCardsScrollView from '../../components/CurriculumCardsScrollView';

export default function CurriculumResultPage() {
  const navigate = useNavigate();
  const { levelTestResult } = useOnboarding();
  const { user } = useAuth();

  useEffect(() => {
    if (!levelTestResult) {
      navigate('/onboarding/level-test', { replace: true });
    }
  }, [levelTestResult, navigate]);

  const cards = useMemo(() => {
    if (!levelTestResult) return [];
    return buildCurriculumCards(levelTestResult.topicMastery);
  }, [levelTestResult]);

  if (!levelTestResult) {
    return null;
  }

  const displayName = user?.nickname || user?.name || '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: colors.gray50,
      }}
    >
      {/* 헤더 */}
      <div style={{ padding: `${spacing.xxl}px ${spacing.xl}px ${spacing.xl}px` }}>
        <h2
          style={{
            ...typography.headingXLBold,
            color: colors.gray900,
            margin: 0,
            textAlign: 'left',
          }}
        >
          <span style={{ color: colors.brand500 }}>{displayName}</span>님에게 딱맞는
          <br />
          커리큘럼이 완성되었어요
        </h2>
      </div>

      {/* 카드 가로 스크롤 영역 */}
      <div style={{ flex: 1 }}>
        <CurriculumCardsScrollView cards={cards} />
      </div>

      {/* 하단 버튼 */}
      <div style={{ padding: `${spacing.xl}px ${spacing.xl}px ${spacing.xxl}px` }}>
        <button
          onClick={() => navigate('/main/home')}
          style={{
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
    </div>
  );
}
