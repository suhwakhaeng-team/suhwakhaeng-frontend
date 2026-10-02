import { useEffect, useMemo, useState } from 'react';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { AdaptiveQuestionTag } from '../../types/adaptive';
import './TimedConceptHints.css';

interface Props {
  tags: AdaptiveQuestionTag[];
  solutionHint?: string | null;
}

const HINT_UNLOCK_SECONDS = 30;

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function TimedConceptHints({ tags, solutionHint }: Props) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [hasConceptHintBeenOpened, setHasConceptHintBeenOpened] = useState(false);
  const [isSolutionHintOpen, setIsSolutionHintOpen] = useState(false);
  const [hasSolutionHintBeenOpened, setHasSolutionHintBeenOpened] = useState(false);

  const elapsedSeconds = Math.floor((now - startedAt) / 1000);
  const isHintUnlocked = elapsedSeconds >= HINT_UNLOCK_SECONDS;
  const secondsRemaining = Math.max(0, HINT_UNLOCK_SECONDS - elapsedSeconds);
  const progressPercent = Math.min(100, (elapsedSeconds / HINT_UNLOCK_SECONDS) * 100);
  const solutionElapsedSeconds = Math.max(0, elapsedSeconds - HINT_UNLOCK_SECONDS);
  const isSolutionHintUnlocked = solutionElapsedSeconds >= HINT_UNLOCK_SECONDS;
  const solutionSecondsRemaining = Math.max(0, HINT_UNLOCK_SECONDS - solutionElapsedSeconds);
  const solutionProgressPercent = Math.min(100, (solutionElapsedSeconds / HINT_UNLOCK_SECONDS) * 100);

  useEffect(() => {
    if (isSolutionHintUnlocked) return;

    const syncNow = () => setNow(Date.now());
    const timerId = window.setInterval(syncNow, 250);
    document.addEventListener('visibilitychange', syncNow);

    return () => {
      window.clearInterval(timerId);
      document.removeEventListener('visibilitychange', syncNow);
    };
  }, [isSolutionHintUnlocked]);

  const conceptHints = useMemo(() => {
    const uniqueConcepts = new Map<string, AdaptiveQuestionTag>();

    tags.forEach(tag => {
      const tagName = tag.tagName.trim();
      if (!tagName) return;

      const key = tag.tagId ? String(tag.tagId) : `${tag.chapterName}:${tagName}`;
      if (!uniqueConcepts.has(key)) {
        uniqueConcepts.set(key, { ...tag, tagName });
      }
    });

    return [...uniqueConcepts.values()];
  }, [tags]);

  const handleConceptHintToggle = () => {
    if (isHintOpen) {
      setIsHintOpen(false);
      setIsSolutionHintOpen(false);
      return;
    }

    setHasConceptHintBeenOpened(true);
    setIsHintOpen(true);
  };

  const handleSolutionHintToggle = () => {
    setHasSolutionHintBeenOpened(true);
    setIsSolutionHintOpen(previous => !previous);
  };

  return (
    <section className="timed-hints" aria-label="문제 힌트" style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
      <button
        type="button"
        className={`timed-hints__summary ${isHintUnlocked ? (hasConceptHintBeenOpened ? 'timed-hints__summary--available' : 'timed-hints__summary--ready') : 'timed-hints__summary--waiting'}${isHintOpen ? ' timed-hints__summary--open' : ''}`}
        aria-expanded={isHintOpen}
        aria-controls="concept-hint-content"
        disabled={!isHintUnlocked}
        onClick={handleConceptHintToggle}
      >
        <span className="timed-hints__button-label">
          <span className="timed-hints__icon" aria-hidden="true">💡</span>
          <span className="timed-hints__label-copy">
            <strong>개념 힌트</strong>
            <small>문제에 필요한 개념을 모두 확인해 보세요.</small>
          </span>
        </span>
        <span className="timed-hints__button-meta">
          <span className="timed-hints__countdown" aria-label={`${secondsRemaining}초 남음`}>
            {formatCountdown(secondsRemaining)}
          </span>
          <span className="timed-hints__chevron" aria-hidden="true">{isHintOpen ? '▲' : '▼'}</span>
        </span>
        <span className="timed-hints__progress" aria-hidden="true">
          <span className="timed-hints__progress-value" style={{ width: `${progressPercent}%` }} />
        </span>
      </button>

      {isHintOpen && (
        <div
          id="concept-hint-content"
          className="timed-hints__card"
          role="status"
          style={{
            marginTop: spacing.sm,
            padding: spacing.lg,
            background: '#FFF9E8',
            border: '1px solid #F5D98B',
            borderRadius: radius.md,
            color: colors.gray800,
          }}
        >
          <div className="timed-hints__card-heading" style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <span aria-hidden="true" style={{ fontSize: 20 }}>💡</span>
            <strong style={{ ...typography.bodyTextXLSemiBold }}>이 문제에 필요한 모든 개념</strong>
          </div>
          {conceptHints.length > 0 ? (
            <>
              <p style={{ margin: `0 0 ${spacing.sm}px`, ...typography.bodyTextXLRegular, lineHeight: 1.6 }}>
                연결된 {conceptHints.length}개 개념의 정의와 핵심 성질을 먼저 떠올려 보세요.
              </p>
              <div className="timed-hints__topics" style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                {conceptHints.map(concept => (
                  <span
                    key={`${concept.tagId}:${concept.chapterName}:${concept.tagName}`}
                    className="timed-hints__topic"
                    title={concept.chapterName.trim() || undefined}
                    style={{
                      padding: `${spacing.xxs}px ${spacing.sm}px`,
                      background: colors.white,
                      border: '1px solid #E8C767',
                      borderRadius: radius.full,
                      color: colors.gray700,
                      ...typography.captionSemiBold,
                    }}
                  >
                    <strong>{concept.tagName}</strong>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p style={{ margin: 0, ...typography.bodyTextXLRegular, lineHeight: 1.6 }}>
              문제의 조건과 구하려는 값을 나누어 적어 보세요.
            </p>
          )}
        </div>
      )}

      {isHintUnlocked && (
        <>
          <button
            type="button"
            className={`timed-hints__summary timed-hints__summary--secondary timed-hints__summary--spawned ${isSolutionHintUnlocked ? (hasSolutionHintBeenOpened ? 'timed-hints__summary--available' : 'timed-hints__summary--ready') : 'timed-hints__summary--waiting'}${isSolutionHintOpen ? ' timed-hints__summary--open' : ''}`}
            aria-expanded={isSolutionHintOpen}
            aria-controls="solution-hint-content"
            disabled={!isSolutionHintUnlocked}
            onClick={handleSolutionHintToggle}
          >
            <span className="timed-hints__button-label">
              <span className="timed-hints__icon" aria-hidden="true">✏️</span>
              <span className="timed-hints__label-copy">
                <strong>풀이 힌트</strong>
                <small>풀이 방향을 단계별로 확인해 보세요.</small>
              </span>
            </span>
            <span className="timed-hints__button-meta">
              <span className="timed-hints__countdown" aria-label={`${solutionSecondsRemaining}초 남음`}>
                {formatCountdown(solutionSecondsRemaining)}
              </span>
              <span className="timed-hints__chevron" aria-hidden="true">{isSolutionHintOpen ? '▲' : '▼'}</span>
            </span>
            <span className="timed-hints__progress" aria-hidden="true">
              <span className="timed-hints__progress-value" style={{ width: `${solutionProgressPercent}%` }} />
            </span>
          </button>

          {isSolutionHintOpen && (
            <div
              id="solution-hint-content"
              className={`timed-hints__card${solutionHint ? '' : ' timed-hints__card--placeholder'}`}
              role="status"
              style={solutionHint ? {
                marginTop: spacing.sm,
                padding: spacing.lg,
                background: '#FFF9E8',
                border: '1px solid #F5D98B',
                borderRadius: radius.md,
                color: colors.gray800,
              } : undefined}
            >
              {solutionHint ? (
                <>
                  <div className="timed-hints__card-heading" style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <span aria-hidden="true" style={{ fontSize: 20 }}>✏️</span>
                    <strong style={{ ...typography.bodyTextXLSemiBold }}>풀이를 시작하는 방향</strong>
                  </div>
                  <p style={{ margin: 0, ...typography.bodyTextXLRegular, lineHeight: 1.7 }}>
                    {solutionHint}
                  </p>
                </>
              ) : (
                <>
                  <span aria-hidden="true">🚧</span>
                  <div>
                    <strong>풀이 힌트는 아직 준비 중이에요.</strong>
                    <p>조금만 기다려 주세요. 더 이해하기 쉬운 풀이 힌트로 찾아올게요.</p>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
