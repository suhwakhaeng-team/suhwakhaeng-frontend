# 팀 제공 개념 자료 로컬 반영

> 아래는 최초 로컬 검토 시점의 기록이다. 후속 운영 배포에서는 `/concepts` 경로를 추가하고 기존 개념 노트 및 UT1/UT2 보충 설명에도 자료를 활성화했다. AI 참고 자료는 운영 `team-concepts.enabled` 설정으로 활성화하며 `TEAM_CONCEPTS_ENABLED=false`로 끌 수 있다. 태그 선수 연결 실험과 DB 변경은 배포 대상이 아니다.

## 확인할 화면

- 전체 자료: http://127.0.0.1:18085/dev/team-concepts
- 조건부확률 설명: http://127.0.0.1:18085/dev/team-concepts?concept=조건부확률
- 기존 지도: http://127.0.0.1:18085/dev/tag-map → 개념 노드 → 노트 보기
- UT2 시안: http://127.0.0.1:18085/dev/ut2/problem-map → 개념 노드 → 개념 보충 설명
- UT1 시안: http://127.0.0.1:18085/dev/ut1 → 개념 학습 → 개념 보충 설명

프론트 폴더에서 `npm.cmd run dev:graph -- --host 127.0.0.1`로 실행한다.

## 반영 범위

팀 제공 Notion HTML의 경우의 수·확률·통계 95개 항목과 PNG 23개를 모두 보존했다. 원자료 UUID와 파일 해시를 저장하며 원본 파일은 수정하지 않는다. 원자료의 비어 있는 ‘누락’ 항목도 그대로 표시한다. 본문에서 참조하지 않은 그림 4개는 ‘반영 내역과 원자료 보완’에서 볼 수 있다.

기존 태그 61개 중 54개에 관련 자료를 연결했다. 이는 내용 분류이지 선수 관계 추가나 DB 태그 변경이 아니다. 원자료가 없는 7개 태그는 산점도, 상관관계, 줄기와 잎, 최빈값, 전수조사, 표본비율, 중앙값이다. 기존 개념 노트가 있으면 그대로 유지한다.

원자료 HTML에서 잘린 조건부확률 표의 식 4개를 행의 명시적인 상황에 맞춰 복구했고, 수정 전후와 이유를 catalog의 `repairs`에 기록했다. 전체 자료는 수학 검토 완료본이 아니다 (`IMPORTED_NOT_FULL_MATH_AUDIT`).

번호가 있는 기출 예제는 문제를 먼저 보여주고, 원자료의 제목과 번호 매긴 목록을 기준으로 풀이를 단계별로 펼친다. 자동 정답 판정, 숫자 변형, 새로운 AN 채점 노드, UT 통과 기록은 추가하지 않았다. 기존 UT 검사 문항·진단·학습 통과·전후 비교는 유지한다.

## 수정 위치

프론트 (`suhwakhaeng-frontend/`):

- `scripts/import-team-concepts.py`: 원자료를 읽기만 하는 재현 가능한 변환기.
- `scripts/team-concept-mapping.json`: 기존 태그와 원자료 제목의 명시적 대응.
- `src/data/teamConcepts.json`, `src/data/teamConcepts.ts`: 95개 항목, 그림 목록, 출처, 복구 내역, 태그 대응, 검색·단계 분리.
- `public/team-concepts/diagram-01.png` ~ `diagram-23.png`: 제공 그림 전체.
- `src/routes/dev/TeamConceptLibraryPage.tsx`, `.css`: 검색·단원·태그 필터가 있는 전체 설명서.
- `src/components/knowledgeGraph/TeamConceptContent.tsx`, `.css`: 설명·목록·표·그림을 안전한 React 요소로 표시.
- `src/components/knowledgeGraph/TeamWorkedExample.tsx`: 기출 풀이 단계 공개/다시 가리기.
- `src/data/conceptNotes.ts`, `src/components/knowledgeGraph/ConceptNoteView.tsx`: DEV에서만 기존 노트에 자료 추가. 운영 노트 6개는 변경하지 않음.
- `src/components/knowledgeGraph/ConceptDetailPanel.tsx`: 로컬 지도 검토 모드에서도 노트 보기 허용. 문제 풀이 API는 여전히 비활성.
- `src/routes/dev/TagMapPreviewPage.tsx`: 전체 설명서로 이동하는 링크.
- `src/routes/dev/ConditionalConceptLesson.tsx`, `ConditionalProblemMapPage.tsx`, `UT1PreviewPage.tsx`: 로컬 UT 시안에 보충 설명. 운영 UT는 옵션을 활성화하지 않음.
- `src/routes/index.tsx`: DEV 전용 전체 설명서 경로.
- `tests/teamConcepts.test.mjs`: 원자료 보존·이미지 해시·태그 대응·수식 복구·운영 격리·안전한 렌더링·단계 공개 검사.

백엔드 (`suhwakhaeng-backend/`):

- `src/main/resources/team-concepts/catalog.json`와 UUID별 Markdown 95개: 로컬 AI 참고용 텍스트. 그림은 설명과 로컬 경로로 기록하며 AI가 그림을 시각적으로 해석하지는 않는다.
- `src/main/java/com/minzzzun/captest1_be/service/rag/TeamConceptReferenceService.java`: 읽기 전용 키워드 검색. DB, 임베딩, 외부 API를 호출하지 않는다.
- 같은 폴더 `RagRetrievalService.java`: 로컬 자료 검색 결과가 있을 때 우선 제공.
- `src/main/resources/application-mock.properties`: `team-concepts.local-enabled=true`.
- `src/test/java/com/minzzzun/captest1_be/service/rag/TeamConceptReferenceServiceTest.java`: 검색과 프로필 차단 테스트.

기존 태그 지도 관련 미완료 변경은 보존했다. 이번 자료 반영으로 새로운 선수 간선을 만들지는 않았다.

## 로컬 AI 연결의 한계와 보호 장치

`team-concepts.local-enabled=true`와 `mock` 또는 `local` 프로필이 모두 필요하다. `prod`가 포함되면 혼합 프로필에서도 비활성화된다. 일반 운영 프로필은 기존 벡터 검색을 유지한다. 검색 결과는 최대 6개, 각 6,000자이며 완전한 의미 검색이나 임베딩 색인이 아니다. 이미 저장된 AI 노트를 자동 재생성하지 않는다. 외부 AI 호출이나 운영 DB 변경은 이번 작업에서 수행하지 않았다.

## 재생성

프론트 폴더에서 사용 가능한 Python 실행 파일로 아래 변환기를 실행한다. 소스 경로는 팀 제공 HTML과 PNG가 들어 있는 폴더다.

```text
python scripts/import-team-concepts.py SOURCE_DIRECTORY --frontend . --references ../suhwakhaeng-backend/src/main/resources/team-concepts
```

## 검증

- 프론트 테스트 195개 통과.
- TypeScript 및 Vite 빌드 통과.
- 백엔드 참고 자료 서비스 테스트 3개 통과.
- 브라우저에서 설명 본문·수식 표·그림, 기출 풀이 단계 공개, 지도 노트 진입, UT2 보충 설명 확인.
- PDF 다운로드의 전체 페이지 내용과 외부 AI 생성 결과는 별도 검증하지 않음.
- 커밋·푸시·배포·운영 DB 변경 없음.
