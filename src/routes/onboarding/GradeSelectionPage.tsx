import { useNavigate } from 'react-router-dom';
import { useOnboarding, type Grade } from '../../contexts/OnboardingContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';

const gradeOptions: { label: string; value: Grade }[] = [
  { label: '중1', value: 'middle1' },
  { label: '중2', value: 'middle2' },
  { label: '중3', value: 'middle3' },
  { label: '고1', value: 'high1' },
  { label: '고2', value: 'high2' },
  { label: '고3', value: 'high3' },
];

export default function GradeSelectionPage() {
  const navigate = useNavigate();
  const { setGrade } = useOnboarding();

  const handleSelect = (value: Grade) => {
    setGrade(value);
    // 고3만 subject/unit 스텝을 거치고, 나머지 학년은 바로 닉네임 입력으로 직행한다.
    if (value === 'high3') {
      navigate('/onboarding/subject');
    } else {
      navigate('/onboarding/nickname');
    }
  };

  return (
    <div>
      <h2 style={{ ...typography.headingXLBold, color: colors.gray900, margin: 0 }}>
        학년을 선택해주세요
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing.md,
          marginTop: spacing.xl,
        }}
      >
        {gradeOptions.map((g) => (
          <button
            key={g.value}
            onClick={() => handleSelect(g.value)}
            style={{
              padding: spacing.xl,
              ...typography.headingMdBold,
              border: `1px solid ${colors.gray200}`,
              borderRadius: radius.lg,
              background: colors.white,
              color: colors.gray900,
              cursor: 'pointer',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
