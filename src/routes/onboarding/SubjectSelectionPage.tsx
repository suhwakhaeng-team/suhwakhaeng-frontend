import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';

const subjects = ['미적분', '확률과 통계', '기하'];

export default function SubjectSelectionPage() {
  const navigate = useNavigate();
  const { setSubject } = useOnboarding();

  const handleSelect = (subject: string) => {
    setSubject(subject);
    navigate('/onboarding/unit');
  };

  return (
    <div>
      <h2 style={{ ...typography.headingXLBold, color: colors.gray900, margin: 0 }}>
        과목을 선택해주세요
      </h2>
      <p style={{ ...typography.bodyTextXLRegular, color: colors.gray500, marginTop: spacing.sm }}>
        고3 전용
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          marginTop: spacing.xl,
        }}
      >
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => handleSelect(subject)}
            style={{
              padding: spacing.lg,
              ...typography.headingMdBold,
              border: `1px solid ${colors.gray200}`,
              borderRadius: radius.md,
              background: colors.white,
              color: colors.gray900,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {subject}
          </button>
        ))}
      </div>
    </div>
  );
}
