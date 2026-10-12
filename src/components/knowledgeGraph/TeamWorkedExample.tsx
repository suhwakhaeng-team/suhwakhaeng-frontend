import { useState } from 'react';
import TeamConceptContent from './TeamConceptContent';
import { teamWorkedExampleParts, type TeamSection } from '../../data/teamConcepts';

/** Source worked examples, not graded AN nodes. Responses never enter UT reports. */
export default function TeamWorkedExample({ section }: { section: TeamSection }) {
  const [revealed, setRevealed] = useState(0);
  const parts = teamWorkedExampleParts(section);
  if (!parts) return <TeamConceptContent sections={[section]} collapsible={false} />;
  const { question, steps } = parts;
  return <><TeamConceptContent sections={[question]} collapsible={false} /><div className="team-library-breakdown"><p>먼저 직접 풀어보고, 필요할 때 풀이 단계를 하나씩 열어보세요. 이 예제는 UT 채점이나 통과 기록에 포함되지 않습니다.</p>
    <TeamConceptContent sections={steps.slice(0,revealed)} collapsible={false} />
    {revealed < steps.length ? <button className="team-library-child" onClick={() => setRevealed(n => n + 1)}>풀이 {revealed + 1}단계 보기 →</button> : <p role="status">모든 풀이 단계를 확인했어요.</p>}
    {revealed > 0 && <button className="team-library-child" onClick={() => setRevealed(0)}>풀이 다시 가리기</button>}
  </div></>;
}
