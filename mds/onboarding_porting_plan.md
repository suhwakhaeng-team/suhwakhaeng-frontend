# 온보딩 & 실력테스트 서버 연동 포팅 계획
> 기준 플랜: `/Users/kimminjun/.claude/plans/deep-forging-moore.md`  
> 작성일: 2026-04-11

---

## 1. 테스트 기준 (Test Criteria)

### 골든패스 — 고3 사용자

- [ ] GP-01: 학년 "고3" 선택 → `grade === 'grade3'` OnboardingContext에 저장, `/onboarding/subject`로 이동
- [ ] GP-02: 과목 선택 → `subject` 저장, `/onboarding/unit`으로 이동
- [ ] GP-03: 단원 1개 이상 선택 → `units` 배열 저장, `/onboarding/nickname`으로 이동
- [ ] GP-04: 닉네임 4자 입력 후 확인 → `PATCH /users/{uid}/nickname` 호출, 200 응답 시 AuthContext `user.nickname` 갱신 후 `/onboarding/leveltest`로 이동
- [ ] GP-05: LevelTestPage mount → `GET /learning/problems` 호출, 3문제 렌더링
- [ ] GP-06: 3문제 모두 답변 입력 → 클라이언트 채점 후 `POST /learning/submit` body에 `correct` 포함, 200 응답 수신
- [ ] GP-07: submit 성공 → `LearningRouteResponse`를 OnboardingContext에 저장 후 `/onboarding/result`로 이동
- [ ] GP-08: CurriculumResultPage → `learningRoute`, `overallAssessment`, `topicMastery` 3개 영역 모두 화면에 표시

### 골든패스 — 비고3 사용자

- [ ] GP-09: 학년 "고3 외" 선택 → subject/unit 스텝 건너뛰고 `/onboarding/nickname`으로 직행
- [ ] GP-10: subject/unit 미선택 상태에서 LevelTest 완료 → submit body의 topic이 null 또는 빈값이어도 서버 400 없이 정상 응답

### 엣지케이스 — 닉네임 유효성

- [ ] EC-01: 닉네임 1자 → 확인 버튼 비활성화 또는 인라인 에러 "2~7자로 입력해주세요" 표시, API 미호출
- [ ] EC-02: 닉네임 8자 → 동일하게 차단
- [ ] EC-03: 닉네임 2자, 7자 경계값 → 정상 제출 가능
- [ ] EC-04: 닉네임 공백만 입력(예: "   ") → trim 후 길이 0으로 간주, 차단

### 엣지케이스 — 네트워크/서버 실패

- [ ] EC-05: `PATCH /users/{uid}/nickname` 500 응답 → NicknameInputPage에 인라인 에러 메시지 표시, 이동 없음
- [ ] EC-06: `GET /learning/problems` 네트워크 타임아웃 → LevelTestPage에 에러 상태 UI("문제를 불러올 수 없습니다") 표시, 재시도 버튼 노출
- [ ] EC-07: `GET /learning/problems` 응답 `data: []` (빈 배열) → "출제된 문제가 없습니다" 안내 UI, submit 버튼 숨김
- [ ] EC-08: `POST /learning/submit` 401 → apiClient의 자동 refresh 후 재시도, 재시도도 실패 시 로그인 페이지 이동
- [ ] EC-09: `POST /learning/submit` 500 → LevelTestPage 에러 상태 UI, 재제출 가능 상태 유지

### 엣지케이스 — 클라이언트 채점 정확성

- [ ] EC-10: 정답 `"  Yes "`, 사용자 입력 `"yes"` → trim + toLowerCase 정규화 후 `correct: true`
- [ ] EC-11: 정답 `"42"`, 사용자 입력 `" 42 "` → 정규화 후 `correct: true`
- [ ] EC-12: 사용자 입력 빈 문자열 → `correct: false`, submit body에 포함 (problemId/topic/userAnswer: "" 포함)

### 빌드 타입체크

- [ ] EC-13: `npm run build` → 백엔드 미가용 상태에서도 TypeScript 컴파일 오류 0건
- [ ] EC-14: `src/types/learning.ts`의 모든 타입이 LevelTestPage/CurriculumResultPage 사용처와 계약 일치

---

## 2. 단계별 태스크 분해

의존성 순서대로 나열. 앞 태스크 DONE 후 다음 착수.

---

### TASK-01: 타입 정의 신설
- 파일: `src/types/learning.ts` (신규)
- 내용: `LearningProblem`, `AnswerItem`, `AnswerSubmissionRequest`, `LearningRouteResponse` 인터페이스 정의
- DONE 판정: `npm run build` 타입 오류 0건 + 이후 태스크에서 import 시 자동완성 동작

### TASK-02: 디자인 토큰 신설
- 파일: `src/lib/designTokens.ts` (신규)
- 내용: 플랜의 `colors`, `radius`, `spacing` 상수 그대로 export
- 의존: 없음 (TASK-01과 병렬 가능)
- DONE 판정: 파일 존재, `npm run build` 통과

### TASK-03: OnboardingContext 신설
- 파일: `src/contexts/OnboardingContext.tsx` (신규)
- 내용: `grade`, `subject`, `units`, `levelTestResult` state + `setGrade`, `setSubject`, `setUnits`, `setLevelTestResult` + `OnboardingProvider` export
- 의존: TASK-01 (`LearningRouteResponse` 타입 참조)
- DONE 판정: Provider import 후 context 값이 자식 컴포넌트에서 읽힘 (GP-01~03, GP-07 판정 전제)

### TASK-04: AuthContext `updateUser` 헬퍼 추가
- 파일: `src/contexts/AuthContext.tsx` (수정)
- 내용: `updateUser(partial: Partial<User>)` 함수 추가, user state를 merge 갱신
- 의존: 없음 (TASK-01과 병렬 가능)
- DONE 판정: NicknameInputPage에서 `updateUser({ nickname })` 호출 후 `useAuth().user.nickname` 즉시 갱신

### TASK-05: apiClient patch 메서드 확인/추가
- 파일: `src/lib/apiClient.ts` (조건부 수정)
- 내용: `apiClient.patch` 미존재 시 `request('PATCH', …)` 한 줄 추가
- 의존: 없음
- DONE 판정: `apiClient.patch('/users/123/nickname', {nickname:'test'})` TypeScript 오류 없이 컴파일

### TASK-06: 라우터에 OnboardingProvider 감싸기
- 파일: `src/routes/index.tsx` (수정)
- 내용: `/onboarding/*` 구간을 `<OnboardingProvider>`로 래핑
- 의존: TASK-03
- DONE 판정: GradeSelectionPage에서 `useOnboarding()` 호출 시 런타임 에러 없음

### TASK-07: GradeSelectionPage — context 연동 + 분기 라우팅
- 파일: `src/routes/onboarding/GradeSelectionPage.tsx` (수정)
- 내용: 선택 시 `setGrade()` 호출; 고3 → `/onboarding/subject`, 비고3 → `/onboarding/nickname`으로 분기 이동
- 의존: TASK-06
- DONE 판정: GP-01, GP-09 통과

### TASK-08: SubjectSelectionPage, UnitSelectionPage — context 연동
- 파일: `src/routes/onboarding/SubjectSelectionPage.tsx`, `UnitSelectionPage.tsx` (수정)
- 내용: 선택 값을 `setSubject()`, `setUnits()`로 OnboardingContext에 저장
- 의존: TASK-06
- DONE 판정: GP-02, GP-03 통과; CurriculumResultPage에서 subject/units 읽기 가능

### TASK-09: NicknameInputPage — API 연동 + 유효성 검사
- 파일: `src/routes/onboarding/NicknameInputPage.tsx` (수정)
- 내용:
  1. trim 후 길이 2~7자 검사 (EC-01~04)
  2. 유효 시 `apiClient.patch('/users/{uid}/nickname', { nickname })` 호출
  3. 성공 → `updateUser({ nickname })` 후 `/onboarding/leveltest` 이동
  4. 실패 → 인라인 에러 메시지, 이동 없음 (EC-05)
- 의존: TASK-04, TASK-05, TASK-06
- DONE 판정: GP-04, EC-01~05 통과

### TASK-10: LevelTestPage — 문제 로드 + 채점 + 제출
- 파일: `src/routes/onboarding/LevelTestPage.tsx` (수정)
- 내용:
  1. mount 시 `GET /learning/problems` 호출, 로딩/에러/빈 배열 상태 UI
  2. 답변 입력 수집
  3. 채점 함수: `answer.trim().toLowerCase() === userAnswer.trim().toLowerCase()`
  4. `POST /learning/submit` body 구성 후 전송
  5. 성공 → `setLevelTestResult(response.data)` + `/onboarding/result` 이동
  6. 실패 → 에러 상태 UI, 재제출 가능 (EC-06~09)
- 의존: TASK-01, TASK-03, TASK-05, TASK-06
- DONE 판정: GP-05~07, EC-06~12 통과

### TASK-11: CurriculumResultPage — context 데이터 표시
- 파일: `src/routes/onboarding/CurriculumResultPage.tsx` (수정)
- 내용: `useOnboarding().levelTestResult`에서 `learningRoute`, `overallAssessment`, `topicMastery` 읽어 렌더링; result null이면 `/onboarding/leveltest` 리다이렉트
- 의존: TASK-03, TASK-10
- DONE 판정: GP-08 통과; levelTestResult 없이 직접 접근 시 리다이렉트 동작

### TASK-12: 디자인 토큰 적용
- 파일: TASK-07~11에서 수정된 모든 페이지 (수정)
- 내용: 하드코딩 색상을 `designTokens.colors.*`로 교체; radius, spacing 상수 참조
- 의존: TASK-02, TASK-07~11
- DONE 판정: `npm run build` 통과, 인라인 스타일에서 hex 리터럴 직접 사용 0건 (토큰 정의 파일 제외)

### TASK-13: 최종 빌드 검증
- 내용: `npm run build` 실행, TypeScript 오류/경고 0건 확인
- 의존: TASK-01~12 전체
- DONE 판정: EC-13, EC-14 통과; 빌드 출력 오류 없음

---

## 3. 의존성 그래프 요약

```
TASK-01 ──┬── TASK-03 ── TASK-06 ──┬── TASK-07
TASK-02   │                         ├── TASK-08
TASK-04 ──┤                         ├── TASK-09 ── TASK-12
TASK-05 ──┘                         └── TASK-10 ── TASK-11

TASK-01~06 병렬 가능 → TASK-06 완료 후 07~10 착수 → TASK-11 → TASK-12 → TASK-13
```

---

## 4. 검증 불가 항목 (한계 명시)

- 백엔드 미가용 시: TASK-09~11의 실서버 응답 검증 불가. UI 상태(에러 표시/분기 이동)만 확인 가능.
- 비고3 분기의 subject/units 미전송 시 서버 side-effect: 플랜상 클라이언트 로컬만 사용이므로 서버 계약 확인 불필요. 단, submit body에 topic 필드가 포함되는 경우 서버가 허용하는지 별도 확인 권장.
