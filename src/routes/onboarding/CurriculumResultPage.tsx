import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnboarding, type Grade } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import './CurriculumResultPage.css';
import {
  buildDiagnosticReport,
  DIAGNOSTIC_REPORT_PREVIEWS,
  type DiagnosticStatus,
} from '../../lib/diagnosticReport';

const GRADE_LABELS: Record<Grade, string> = {
  middle1: '중1', middle2: '중2', middle3: '중3',
  high1: '고1', high2: '고2', high3: '고3',
};

const STATUS_META: Record<DiagnosticStatus, { label: string; color: string; background: string }> = {
  stable: { label: '안정', color: '#15803D', background: '#ECFDF3' },
  unstable: { label: '불안정', color: '#A16207', background: '#FFFBEB' },
  'needs-review': { label: '보완 필요', color: '#DC2626', background: '#FEF2F2' },
  'not-diagnosed': { label: '미진단', color: colors.gray500, background: colors.gray100 },
};

export default function CurriculumResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { grade, subject, levelTestResult } = useOnboarding();
  const { user } = useAuth();
  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set());
  const searchParams = new URLSearchParams(location.search);
  const previewKey = searchParams.get('preview') ?? '';
  const previewResult = import.meta.env.DEV ? DIAGNOSTIC_REPORT_PREVIEWS[previewKey] : undefined;
  const isPreview = Boolean(previewResult);
  const activeResult = previewResult ?? levelTestResult;

  useEffect(() => {
    if (!activeResult) navigate('/onboarding/level-test', { replace: true });
  }, [activeResult, navigate]);

  const report = useMemo(() => activeResult ? buildDiagnosticReport(activeResult) : null, [activeResult]);
  if (!activeResult || !report) return null;

  const displayName = (isPreview && searchParams.get('name')) || user?.nickname || user?.name || '학생';
  const gradeLabel = isPreview ? '고3' : grade ? GRADE_LABELS[grade] : '고등';
  const subjectLabel = subject || '확률과 통계';
  const weakConcepts = report.concepts.filter(
    (concept) => concept.status === 'unstable' || concept.status === 'needs-review',
  );
  const priorityConceptGroups = (['needs-review', 'unstable'] as const).map((status) => ({
    status,
    plans: report.learningPlans
      .map((plan) => ({
        area: plan.area,
        concepts: plan.concepts.filter((concept) => concept.status === status),
      }))
      .filter((plan) => plan.concepts.length > 0),
  })).filter((group) => group.plans.length > 0);
  const total = report.concepts.length || 1;

  return (
    <main className="diagnostic-report-page">
      <header className="diagnostic-report-hero" style={{
        padding: spacing.xxl,
        borderRadius: radius.xl,
        color: colors.white,
        background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
        boxShadow: '0 18px 45px rgba(37, 99, 235, 0.18)',
      }}>
        <span style={{
          display: 'inline-flex', padding: '6px 12px', borderRadius: radius.full,
          background: 'rgba(255,255,255,0.16)', ...typography.captionSemiBold,
        }}>
          {gradeLabel} · {subjectLabel}
        </span>
        <h1 className="diagnostic-report-title" style={{ color: colors.white, margin: `${spacing.lg}px 0 0` }}>
          {displayName}님의 학습 데이터
        </h1>
      </header>

      <section className="report-section report-summary-section">
        <h2 className="report-section-title" style={{ ...typography.headingXLBold, fontSize: 22 }}>진단 요약</h2>
        <div className="diagnostic-summary-grid">
          {[
            { label: '진단 개념', value: report.concepts.length, color: colors.gray900, background: colors.white },
            { label: '안정', value: report.counts.stable, color: STATUS_META.stable.color, background: STATUS_META.stable.background },
            { label: '불안정', value: report.counts.unstable, color: STATUS_META.unstable.color, background: STATUS_META.unstable.background },
            { label: '보완 필요', value: report.counts['needs-review'], color: STATUS_META['needs-review'].color, background: STATUS_META['needs-review'].background },
          ].map((item) => (
            <div key={item.label} className="diagnostic-summary-card" style={{
              padding: spacing.lg, textAlign: 'center', borderRadius: radius.lg,
              background: item.background, border: `1px solid ${colors.gray200}`,
            }}>
              <strong style={{ display: 'block', fontSize: 28, color: item.color }}>{item.value}</strong>
              <span style={{ ...typography.captionSemiBold, color: item.color }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div aria-label="개념 상태 분포" style={{ display: 'flex', height: 12, marginTop: spacing.md, overflow: 'hidden', borderRadius: radius.full, background: colors.gray100 }}>
          {(['stable', 'unstable', 'needs-review'] as const).map((status) => (
            <div key={status} style={{ width: `${(report.counts[status] / total) * 100}%`, background: STATUS_META[status].color }} />
          ))}
        </div>
      </section>

      <section className="report-section report-concept-section">
        <h2 className="report-section-title" style={{ ...typography.headingXLBold, fontSize: 22 }}>보완할 개념</h2>
        {weakConcepts.length === 0 ? (
          <div style={{ padding: spacing.xl, textAlign: 'center', borderRadius: radius.lg, background: STATUS_META.stable.background, color: STATUS_META.stable.color, ...typography.headingMdBold }}>
            보완할 개념 없음
          </div>
        ) : (
          <div className="diagnostic-priority-list">
            {priorityConceptGroups.map((group) => {
              const meta = STATUS_META[group.status];
              const conceptCount = group.plans.reduce((sum, plan) => sum + plan.concepts.length, 0);
              return (
                <div key={group.status} className={`diagnostic-priority-group is-${group.status}`}>
                  <div className="diagnostic-priority-heading">
                    <strong style={{ color: meta.color }}><i />{meta.label}</strong>
                    <span>{conceptCount}개 개념</span>
                  </div>
                  <div className="diagnostic-priority-areas">
                    {group.plans.map((plan) => {
                      const areaKey = `${group.status}:${plan.area}`;
                      const isOpen = openAreas.has(areaKey);
                      return (
                        <div key={plan.area} className={`diagnostic-area-card${isOpen ? ' is-open' : ''}`}>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setOpenAreas((current) => {
                              const next = new Set(current);
                              if (next.has(areaKey)) next.delete(areaKey);
                              else next.add(areaKey);
                              return next;
                            })}
                            className="diagnostic-area-trigger"
                          >
                            <span className="diagnostic-area-heading">
                              <strong style={{ color: colors.gray900, ...typography.headingLgBold }}>{plan.area}</strong>
                              <span className="diagnostic-area-count">{plan.concepts.length}개 개념</span>
                            </span>
                            <span className="diagnostic-toggle-label">{isOpen ? '접기' : '개념 보기'}</span>
                          </button>
                          <div className="diagnostic-area-collapse" aria-hidden={!isOpen}>
                            <div className="diagnostic-area-collapse-inner">
                              <div className="diagnostic-concept-grid">
                                {plan.concepts.map((concept) => (
                                  <div key={concept.label} className="diagnostic-concept-card">
                                    <i className="diagnostic-concept-dot" style={{ background: meta.color }} />
                                    <strong style={{ color: colors.gray800, ...typography.bodyTextLgMedium }}>{concept.label}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {report.learningPlans.length > 0 && (
        <section className="report-section report-learning-section">
          <div className="learning-plan-title-row">
            <h2 className="report-section-title" style={{ ...typography.headingXLBold, fontSize: 22 }}>맞춤 학습 방향</h2>
            <div className="learning-plan-legend" aria-label="개념 상태 범례">
              <span className="is-unstable"><i />불안정</span>
              <span className="is-review"><i />보완 필요</span>
            </div>
          </div>
          <div style={{ display: 'grid', gap: spacing.md }}>
            {report.learningPlans.map((plan) => (
              <div key={plan.area} className="learning-area-card" style={{ padding: spacing.xl, borderRadius: radius.lg }}>
                <strong style={{ display: 'block', color: colors.brand700, marginBottom: spacing.md }}>{plan.area}</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  {plan.concepts.map((concept, index) => (
                    <span key={concept.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '8px 12px', borderRadius: radius.sm, background: colors.white, border: `1px solid ${colors.brand100}`, color: STATUS_META[concept.status].color, ...typography.bodyTextLgMedium }}>
                        {concept.label}
                      </span>
                      {index < plan.concepts.length - 1 && <span style={{ color: colors.brand400 }}>→</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <button onClick={() => navigate('/main/home')} style={{
        width: '100%', marginTop: spacing.xxl, padding: spacing.lg, border: 0,
        borderRadius: radius.md, color: colors.white, background: colors.brand600,
        cursor: 'pointer', ...typography.headingMdBold,
      }}>
        맞춤 커리큘럼 보기
      </button>
    </main>
  );
}
