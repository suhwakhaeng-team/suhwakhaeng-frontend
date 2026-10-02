// Emit fixtures from the production frontend model; callers persist with their file tool.
import { archiveLearning, beginPost, beginUTLearning, createSession, learningDiagnostic,
  learningQuestion, nextUTLearning, resumeTest, submitTest, submitUTLearning, UT_GOALS } from '../../src/routes/dev/ut1Model.ts';

const journeys = {};
for (let ordinal = 0; ordinal < 2; ordinal++) {
  let session = createSession('프론트 경로 검증', ordinal, 100000), now = 100000;
  const snapshots = [];
  const snapshot = () => snapshots.push(structuredClone({ stage: session.stage, completed: session.completed,
    learning: session.learning, history: session.history, evidence: session.evidence,
    preResponses: session.pre.responses, postResponses: session.post.responses }));
  for (let i = 0; i < 10; i++) {
    session = resumeTest(session, now); session = submitTest(session, null, now += 1000);
    if (i === 0 || i === 9) snapshot();
  }
  const attempted = new Set();
  for (const goal of UT_GOALS) {
    session = beginUTLearning(session, goal.id, now);
    for (let turn = 0; !session.learning.complete && turn < 200; turn++) {
      let state = { ...session.learning, reading: false, startedAt: now };
      const answer = attempted.has(state.currentId) ? learningQuestion(state).answer : null;
      attempted.add(state.currentId);
      state = submitUTLearning(state, answer, now += 1000);
      session = { ...session, learning: nextUTLearning(state, learningDiagnostic(session), now) };
    }
    if (!session.learning.complete) throw new Error('Unfinished frontend journey');
    session = archiveLearning(session); snapshot();
  }
  session = beginPost(session);
  for (let i = 0; i < 10; i++) {
    session = resumeTest(session, now);
    session = submitTest(session, session.post.questions[i].answer, now += 1000);
    if (i === 0 || i === 9) snapshot();
  }
  journeys[session.pre.form] = snapshots;
}
console.log(JSON.stringify(journeys));
