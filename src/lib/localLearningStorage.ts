export const LOCAL_LEARNING_STORAGE_KEYS = {
  frequencyCourse: 'dev_frequency_course_v1',
  frequencyStory: 'dev_frequency_story_v2_completed',
  frequencyAssessment: 'dev_frequency_assessment_ut1_passed',
} as const;

export const ONBOARDING_RESULT_STORAGE_KEY = 'suhwakhaeng.latestLevelTestResult';

type RemovableStorage = Pick<Storage, 'length' | 'key' | 'removeItem'>;

/** Remove browser-only learning state after the server has deleted an account. */
export function clearAccountLearningData(
  uid: string,
  local: RemovableStorage = window.localStorage,
  session: Pick<Storage, 'removeItem'> = window.sessionStorage,
): void {
  try {
    Object.values(LOCAL_LEARNING_STORAGE_KEYS).forEach(key => local.removeItem(key));

    const graphPrefix = `suhwakhaeng:learning-graph:v1:${encodeURIComponent(uid)}:`;
    const accountGraphKeys: string[] = [];
    for (let index = 0; index < local.length; index += 1) {
      const key = local.key(index);
      if (key?.startsWith(graphPrefix)) accountGraphKeys.push(key);
    }
    accountGraphKeys.forEach(key => local.removeItem(key));
  } catch {
    // The account is already deleted on the server; storage restrictions must not block sign-out.
  }

  try {
    session.removeItem(ONBOARDING_RESULT_STORAGE_KEY);
  } catch {
    // Session storage can be unavailable in private browsing modes.
  }
}
