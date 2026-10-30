# 수확행 학습 여정 프로토타입

Figma를 바탕으로 만든 독립 웹 시안입니다. 로그인 → 간단한 회원 정보 →
레벨테스트 → 커리큘럼 생성 → 경우의 수·확률·통계의 맞춤 커리큘럼 →
단원 노선도 → 세부 개념 → 개념 이해와 문제 풀이 흐름을 체험할 수 있습니다.

## 받아서 실행하기

프론트엔드 저장소에서 실행합니다. Vite 8이 지원하는 Node.js
(20.19 이상 또는 22.12 이상)가 필요합니다.

```sh
git fetch origin
git switch --track origin/prototype/personalized-learning-journey
npm ci
npx vite --config vite.journey.config.ts
```

브라우저에서 **http://127.0.0.1:18091/journey.html**을 엽니다.
이미 해당 로컬 브랜치가 있다면 `git switch prototype/personalized-learning-journey`로 이동합니다.
18091 포트를 사용 중이라면 기존 미리보기 서버를 종료하거나 `--port`로 다른 포트를 지정하세요.

왼쪽 아래 **시안 메뉴 → 커리큘럼 바로 보기**로 진단을 건너뛰고 디자인을 확인할 수 있습니다.
처음부터 다시 체험하려면 같은 메뉴에서 **체험 기록 초기화**를 누르세요.

## 확인할 화면

- 로그인·회원 정보·9문항 레벨테스트와 커리큘럼 생성 화면.
- 경우의 수·확률·통계의 세 커리큘럼. 진단 결과에 따라 시작 개념이 달라집니다.
- 단원 노선도에서 정거장 선택 시 기차 이동, 학습하기에서 지도 확대와 상세 패널 전환.
- 개념 이해 → 문제 확인 → 다음 세부 학습, 개념 노트 저장과 복습.
- 홈·개념 노트·AI의 공통 메뉴 및 모바일 화면.
- OS의 움직임 줄이기 설정을 존중하는 화면 전환과 모션.

## 구현 범위

로그인, AI 대화, 커리큘럼 생성은 브라우저 안에서 동작하는 체험 기능입니다.
실제 Google 인증, AI API, 백엔드와 운영 DB 연결은 포함하지 않습니다.
진도·닉네임·개념 노트는 이 브라우저의 전용 localStorage
(`suhwakhaeng-journey-prototype-v1`)에 저장됩니다.

단원별 주제 수는 8/8/9개, 세부 개념 수는 54/19/31개입니다.
진단으로 확인한 개념과 문제를 풀어 완료한 학습 기록은 구분합니다.
콘텐츠와 추천 방식은 검토용 예시이며 실제 교과서와 문제 은행 반영은 후속 작업입니다.

## 소스와 검사

- `journey.html`: 독립 진입점.
- `src/prototypes/journey/JourneyPrototype.tsx`: 화면 전환 및 학습 상태.
- `src/prototypes/journey/screens/`: 온보딩·홈·노트·AI·지도·학습 화면.
- `src/prototypes/journey/FigmaMetro.tsx`, `layout.ts`: 지도 및 공통 화면 구성.
- `src/prototypes/journey/model.ts`: 학습·진단 예시 데이터와 진도 계산.
- `src/prototypes/journey/journey.css`: 스타일과 애니메이션.
- `src/prototypes/journey/assets/`: Figma SVG와 로컬 글꼴. 글꼴 라이선스도 포함합니다.
- 수식은 저장소의 공통 `src/components/MathText.tsx`를 사용합니다.

```sh
npx tsc -p tsconfig.journey.json
npx vite build --config vite.journey.config.ts
```

정적 빌드는 `dist/journey/`에 생성됩니다. 빌드 결과와 개인 체험 기록은 커밋하지 않습니다.
기존 앱과 분리된 Vite 설정이며 API 프록시를 사용하지 않습니다.
이 브랜치는 팀 공유와 검토를 위한 것으로 운영 배포를 변경하지 않습니다.
