# 2차 UT 설문과 수정 문항

- 최종 13문항을 마치면 결과 화면에서 피드백 설문을 작성한다. 별도 회원 로그인이나 외부 설문 링크는 필요 없다.
- 기존 설문의 14개 필수 질문과 선택 전화번호를 재사용한다. 연락처를 남긴 제출자만 빽다방 상품권 추첨 대상으로 안내한다. 금액과 당첨 인원은 지정하지 않았다.
- 서버가 참가자 토큰, 학습 목표 3개 완료, 최종 테스트 13문항 완료를 확인한다. 참가자당 첫 설문 한 건만 저장하며 재시도는 기존 제출 결과를 반환한다.
- 설문과 연락처는 서버의 참가자 snapshot에 저장한다. 일반 세션 응답과 브라우저 캐시에는 제출 여부와 추첨 응모 여부만 포함한다.
- 관리자 `/admin/ut2`의 참가자 상세에서 설문을 확인한다. `/admin/ut2-feedback.csv`에서 제출 응답과 추첨 연락처를 내려받는다.

## 문제 수정

수정 전 A/B형 13번은 `P(Aᶜ ∩ B) > P(Aᶜ)`가 되어 조건을 만족하는 확률 모형이 없었다.

| 형식 | 수정 조건 | 수정 정답 | 네 영역 [AB, ABᶜ, AᶜB, AᶜBᶜ] |
| --- | --- | --- | --- |
| A | P(Bᶜ): 2/5 → 4/5 | 1/4 | [3/20, 3/5, 1/20, 1/5] |
| B | P(Bᶜ): 1/5 → 2/3 | 2/5 | [1/5, 7/15, 2/15, 1/5] |

신규 참가자는 `bankVersion: 2`를 사용한다. 기존 참가자의 검사와 보고서는 원래 v1 문항을 유지하며, 관리자 상세에 해당 오류를 알린다. v1 참가자와 v2 참가자의 13번 결과를 같은 문항으로 합산하지 않는다.

## 검증과 출력

- `node --test tests/ut2.test.mjs tests/ut2WebUi.test.mjs tests/ut2ParticipantSwitch.test.mjs tests/conditionalProblemBreakdown.test.mjs tests/ut2ProbabilityFeasibility.test.mjs`
- `npm run build`
- 백엔드: `gradlew test --tests '*Ut2IntegrationTest' --tests '*FeedbackServiceTest'`
- 모노레포 루트의 `scripts/export-ut2-pdf.mjs`를 실행하면 `output/pdf/`에 A/B형 문제지와 별도 운영자 정답표를 생성한다. A/B는 참가자별로 사전·사후 배정 순서가 다르다.

로컬 소스 변경이다. 운영 배포와 운영 참가 데이터 변경은 수행하지 않는다.
