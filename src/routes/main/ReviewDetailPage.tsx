import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { tokenStorage } from '../../lib/tokenStorage';
import { fetchConcept } from '../../lib/conceptClient';
import { fetchSavedProblems } from '../../lib/savedProblemClient';
import type { ConceptNote } from '../../types/concept';
import type { SavedProblem } from '../../types/savedProblem';
import type { AdaptiveQuestion } from '../../types/adaptive';
import ConceptMarkdown from '../../components/review/ConceptMarkdown';
import SavedProblemCard from '../../components/review/SavedProblemCard';

/**
 * 복습 상세 — 좌:개념(60%) / 우:저장 문제(40%) 분할.
 * 좁은 화면(<= 960px)에선 세로 스택으로 fallback.
 *
 * URL: `/main/review/:tagId`
 * tagName 은 `useLocation().state.tagName` 으로 받되, 새로고침 등으로 사라지면 비워둠(헤더만 영향).
 */
export default function ReviewDetailPage() {
  const { tagId: tagIdParam } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const tagId = Number(tagIdParam);
  const initialTagName = (location.state as { tagName?: string } | null)?.tagName ?? '';

  const [concept, setConcept] = useState<ConceptNote | null>(null);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [conceptError, setConceptError] = useState<string | null>(null);

  const [savedProblems, setSavedProblems] = useState<SavedProblem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  const headerTitle = concept?.tagName || initialTagName || '복습';

  const loadConcept = () => {
    if (!Number.isFinite(tagId)) {
      setConceptError('잘못된 단원입니다.');
      return;
    }
    setConceptLoading(true);
    setConceptError(null);
    fetchConcept(tagId)
      .then((note) => setConcept(note))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '개념 정리를 불러오지 못했습니다.';
        setConceptError(msg);
      })
      .finally(() => setConceptLoading(false));
  };

  const loadSaved = () => {
    const uid = tokenStorage.getUid();
    if (!uid || !Number.isFinite(tagId)) return;
    setSavedLoading(true);
    setSavedError(null);
    fetchSavedProblems(uid, tagId)
      .then((items) => setSavedProblems(items))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '저장 문제를 불러오지 못했습니다.';
        setSavedError(msg);
      })
      .finally(() => setSavedLoading(false));
  };

  const handleRetry = (problem: SavedProblem) => {
    const question: AdaptiveQuestion = {
      questionId: problem.questionId,
      content: problem.content,
      answer: problem.answer,
      explanation: problem.explanation,
      difficulty: null,
      tags: problem.tagId != null
        ? [{ tagId: problem.tagId, chapterId: 0, chapterName: '', tagName: problem.tagName ?? '', baseColor: '' }]
        : [],
    };
    navigate('/main/problem/start', { state: { questions: [question], currentIndex: 0 } });
  };

  useEffect(() => {
    loadConcept();
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagId]);

  return (
    <div
      style={{
        background: colors.gray100,
        minHeight: '100%',
        margin: `-${spacing.xl}px`,
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.gray700,
            ...typography.bodyTextXLSemiBold,
            cursor: 'pointer',
            padding: `${spacing.xs}px ${spacing.sm}px`,
          }}
        >
          ‹ 뒤로
        </button>
        <h2 style={{ ...typography.headingLgBold, color: colors.gray900, margin: 0 }}>{headerTitle}</h2>
      </div>

      {/* Split layout — 데스크톱 2분할, 모바일 세로 스택 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
          gap: spacing.lg,
          alignItems: 'start',
        }}
        className="review-detail-grid"
      >
        {/* 좌: 개념 */}
        <section
          style={{
            background: colors.white,
            borderRadius: radius.lg,
            padding: spacing.xl,
            minHeight: 320,
          }}
        >
          {conceptLoading && !concept && (
            <div style={{ textAlign: 'center', padding: `${spacing.xxl}px 0` }}>
              <p style={{ ...typography.bodyTextLgMedium, color: colors.gray700, margin: 0 }}>
                ⚙️ 개념 정리를 만들고 있어요
              </p>
              <p style={{ ...typography.captionMedium, color: colors.gray500, marginTop: spacing.xs }}>
                처음 진입할 때는 잠시 시간이 걸려요
              </p>
            </div>
          )}
          {conceptError && (
            <div style={{ textAlign: 'center', padding: `${spacing.xl}px 0` }}>
              <p style={{ ...typography.bodyTextLgMedium, color: colors.gray700, margin: 0 }}>
                개념 정리를 불러오지 못했어요
              </p>
              <p style={{ ...typography.captionMedium, color: colors.gray500, marginTop: spacing.xs }}>
                {conceptError}
              </p>
              <button
                type="button"
                onClick={loadConcept}
                style={{
                  marginTop: spacing.md,
                  padding: `${spacing.sm}px ${spacing.lg}px`,
                  background: colors.brand500,
                  color: colors.white,
                  border: 'none',
                  borderRadius: radius.sm,
                  ...typography.bodyTextXLSemiBold,
                  cursor: 'pointer',
                }}
              >
                다시 시도
              </button>
            </div>
          )}
          {concept && !conceptError && <ConceptMarkdown content={concept.content} />}
        </section>

        {/* 우: 저장 문제 */}
        <section
          style={{
            background: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ ...typography.headingMdBold, color: colors.gray900, margin: 0 }}>
              📚 저장 문제 ({savedProblems.length})
            </h3>
          </div>

          {savedLoading && savedProblems.length === 0 && (
            <div
              style={{
                background: colors.white,
                borderRadius: radius.md,
                padding: spacing.xl,
                textAlign: 'center',
                ...typography.bodyTextLgRegular,
                color: colors.gray500,
              }}
            >
              불러오는 중입니다…
            </div>
          )}
          {savedError && (
            <div
              style={{
                background: colors.white,
                borderRadius: radius.md,
                padding: spacing.lg,
                ...typography.bodyTextLgRegular,
                color: colors.gray700,
              }}
            >
              {savedError}
              <button
                type="button"
                onClick={loadSaved}
                style={{
                  marginLeft: spacing.sm,
                  background: 'transparent',
                  color: colors.brand500,
                  border: 'none',
                  cursor: 'pointer',
                  ...typography.bodyTextXLSemiBold,
                }}
              >
                다시 시도
              </button>
            </div>
          )}
          {!savedLoading && !savedError && savedProblems.length === 0 && (
            <div
              style={{
                background: colors.white,
                borderRadius: radius.md,
                padding: spacing.xl,
                textAlign: 'center',
                ...typography.bodyTextLgRegular,
                color: colors.gray500,
              }}
            >
              이 단원에 저장한 문제가 없어요. 결과 화면에서 ☐ 체크박스로 저장해보세요.
            </div>
          )}
          {savedProblems.map((problem) => (
            <SavedProblemCard
              key={problem.savedId}
              problem={problem}
              onRetry={() => handleRetry(problem)}
            />
          ))}
        </section>
      </div>

      {/* AI 챗 진입 — iOS 와 동일한 보조 동선.
          단원 컨텍스트(seedTagId/seedTagName)를 location.state 로 전달해
          AIConceptPage 빈 상태에서 추천 질문 칩 3개를 자동 구성. */}
      <button
        type="button"
        onClick={() =>
          navigate('/main/ai-concept', {
            state: {
              seedTagId: tagId,
              seedTagName: concept?.tagName || initialTagName || undefined,
            },
          })
        }
        style={{
          padding: `${spacing.md}px ${spacing.xl}px`,
          background: colors.brand500,
          color: colors.white,
          border: 'none',
          borderRadius: radius.md,
          ...typography.bodyTextXLSemiBold,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        💬 이 단원으로 AI에게 물어보기
      </button>

      {/* Mobile fallback: 좁은 폭에서 grid 를 1열로 */}
      <style>{`
        @media (max-width: 960px) {
          .review-detail-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
