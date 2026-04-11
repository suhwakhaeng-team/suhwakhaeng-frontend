# 온보딩 UI 개발 지시서 — 웹 포팅 스펙

> iOS `NicknameInputView`, `LevelTestView`, `CurriculumResultView` 코드 기반 추출.
> 구현 대상: `src/routes/onboarding/` 3개 파일.
> 디자인 토큰 상수 위치: `src/lib/designTokens.ts` (신규 생성 필요).

---

## 1. 디자인 토큰 (`src/lib/designTokens.ts`)

iOS `ColorExtension.swift`, `Spacing.swift`, `Radius.swift` 에서 1:1 추출한 확정값.

```ts
// src/lib/designTokens.ts

export const colors = {
  // Base
  black:        '#000000',
  white:        '#FFFFFF',

  // Gray scale (iOS primaryGray*)
  gray50:       '#F9FAFB',
  gray100:      '#F3F4F6',
  gray200:      '#E5E7EB',
  gray300:      '#D2D5DA',
  gray400:      '#9CA3AF',
  gray500:      '#6D7280',
  gray600:      '#4B5563',
  gray700:      '#374151',
  gray800:      '#1F2937',
  gray900:      '#111827',

  // Brand blue (iOS brandPrimary*)
  brand50:      '#EFF6FF',
  brand100:     '#DBEAFE',
  brand400:     '#60A5FA',
  brand500:     '#3B82F6',   // 주 액션 색 (버튼, 강조 텍스트, 진행 바 fill)
  brand600:     '#2563EB',   // hover / pressed 상태
  brand700:     '#1D4ED8',

  // Supporting — error
  red500:       '#EF4444',

  // Supporting — success
  green500:     '#22C55E',
} as const;

export const spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  x3l:  48,
  x4l:  64,
} as const;

export const radius = {
  xs:   4,
  sm:   8,
  md:   12,   // 버튼 기본
  lg:   16,   // 카드, 모달
  xl:   24,   // 문제 카드
  full: 9999, // 캡슐
} as const;
```

### 토큰 매핑 표 (iOS → 웹)

| iOS 토큰 | 웹 상수 (`colors.*`) | hex |
|---|---|---|
| `Color.brandPrimary500` | `colors.brand500` | `#3B82F6` |
| `Color.brandPrimary600` | `colors.brand600` | `#2563EB` |
| `Color.brandPrimary50` | `colors.brand50` | `#EFF6FF` |
| `Color.primaryGray100` | `colors.gray100` | `#F3F4F6` |
| `Color.primaryGray200` | `colors.gray200` | `#E5E7EB` |
| `Color.primaryGray300` | `colors.gray300` | `#D2D5DA` |
| `Color.primaryGray400` | `colors.gray400` | `#9CA3AF` |
| `Color.primaryGray500` | `colors.gray500` | `#6D7280` |
| `Color.primaryGray700` | `colors.gray700` | `#374151` |
| `Color.primaryGray900` | `colors.gray900` | `#111827` |
| `Color.primaryBaseWhite` | `colors.white` | `#FFFFFF` |
| `Color.primaryBaseBlack` | `colors.black` | `#000000` |
| `Color.red` (에러 인라인) | `colors.red500` | `#EF4444` |
| `Color.green` (완료 아이콘) | `colors.green500` | `#22C55E` |

### 타이포그래피 토큰 매핑 (iOS TextStyle → CSS)

| iOS 토큰 | font-size | font-weight | line-height | letter-spacing | 사용 위치 |
|---|---|---|---|---|---|
| `headingXLBold` | 20px | 700 | 1.4 | -0.07px | 닉네임 페이지 제목 |
| `headingMdBold` | 16px | 700 | 1.4 | -0.056px | 시작하기 버튼 레이블 |
| `bodyTextXLSemiBold` | 14px | 600 | 1.5 | -0.049px | "환영합니다!" 강조 |
| `bodyTextXLRegular` | 14px | 400 | 1.5 | -0.049px | 입력 필드 텍스트, 답변 캡슐 |
| `headingXLSemiBold` | 20px | 600 | 1.4 | -0.07px | 문제 본문 텍스트 |
| `captionSemiBold` | 12px | 600 | 1.5 | -0.042px | "문제 N" 레이블 |

> letter-spacing 계산식: `size(px) * -0.0035` (iOS TextStyle.swift 그대로 적용)

---

## 2. 레이아웃 공통 (OnboardingLayout)

기존 `OnboardingLayout.tsx`의 컨테이너를 그대로 사용한다.

- 페이지 배경: `colors.white`
- 컨테이너: `max-width: 480px`, `width: 100%`, 좌우 자동 마진 (중앙 정렬)
- 외부 패딩: `padding: 40px 20px` (세로 40px / 가로 20px) — 기존 OnboardingLayout 값 유지
- 각 페이지 컴포넌트는 OnboardingLayout의 `<Outlet>` 안에 들어가므로 추가 컨테이너 불필요

---

## 3. NicknameInputPage

### 3-1. 레이아웃 구조

```
VStack (column, gap: 0)
  ├─ 뒤로가기 버튼 행          padding-horizontal: 24px, padding-top: 16px, padding-bottom: 48px
  ├─ 제목 섹션                 padding-horizontal: 24px, padding-bottom: 32px
  │    ├─ "환영합니다!" (강조)  padding-left: 40px
  │    └─ 아이콘 + "닉네임을…"
  ├─ 입력 필드 섹션            padding-horizontal: 24px
  │    ├─ TextField
  │    ├─ 하단 구분선 (1px)
  │    └─ 에러 메시지 (조건부)
  ├─ Spacer (flex: 1)
  └─ 시작하기 버튼             padding-horizontal: 24px, padding-bottom: 32px
```

### 3-2. 컬러

| 요소 | 색상 토큰 | hex |
|---|---|---|
| 뒤로가기 아이콘 | `colors.gray900` | `#111827` |
| "환영합니다!" 텍스트 | `colors.brand500` | `#3B82F6` |
| "닉네임을 입력해 주세요" 텍스트 | `colors.gray900` | `#111827` |
| 입력 필드 텍스트 | `colors.gray900` | `#111827` |
| 입력 필드 플레이스홀더 | `colors.gray400` | `#9CA3AF` |
| 구분선 | `colors.gray300` | `#D2D5DA` |
| 에러 메시지 | `colors.red500` | `#EF4444` |
| 버튼 활성 배경 | `colors.brand500` | `#3B82F6` |
| 버튼 비활성 배경 | `colors.gray300` | `#D2D5DA` |
| 버튼 텍스트 | `colors.white` | `#FFFFFF` |
| 로딩 스피너 | `colors.white` | `#FFFFFF` |

### 3-3. 타이포그래피

| 요소 | 토큰 | CSS |
|---|---|---|
| "환영합니다!" | `bodyTextXLSemiBold` | `font-size: 14px; font-weight: 600; line-height: 1.5` |
| "닉네임을 입력해 주세요" | `headingXLBold` | `font-size: 20px; font-weight: 700; line-height: 1.4` |
| 입력 필드 / 플레이스홀더 | `bodyTextXLRegular` | `font-size: 14px; font-weight: 400; line-height: 1.5` |
| 에러 메시지 | `bodyTextXLRegular` | `font-size: 14px; font-weight: 400; line-height: 1.5` |
| 버튼 레이블 | `headingMdBold` | `font-size: 16px; font-weight: 700; line-height: 1.4` |

### 3-4. 컴포넌트 상태

**입력 필드**

- 기본: 구분선 `colors.gray300`, 텍스트 `colors.gray900`
- 포커스: 구분선을 `colors.brand500` 2px로 변경 (iOS와 동일하게 하단 강조선만 변경)
- 에러(서버 응답 실패): 구분선 `colors.red500`, 하단에 에러 메시지 노출 (padding-top: 8px)
- 제출 중(disabled): `opacity: 0.5`, pointer-events: none

**시작하기 버튼**

- 활성 조건: 공백 제거 후 `2 <= length <= 7`
- 활성: `background: colors.brand500`, `cursor: pointer`
- 비활성: `background: colors.gray300`, `cursor: default`, `opacity: 1` (색만 교체, opacity 유지)
- 로딩(isSubmitting): 버튼 텍스트 숨김 + 중앙에 스피너, 버튼은 비활성 상태

### 3-5. 치수

| 요소 | 값 |
|---|---|
| 뒤로가기 버튼 탭 영역 | min 44×44px |
| 제목 섹션 "환영합니다!" 좌측 들여쓰기 | `padding-left: 40px` |
| 입력 필드 padding-bottom | 8px |
| 구분선 높이 | 1px |
| 에러 메시지 margin-top | 8px |
| 버튼 padding-vertical | 16px |
| 버튼 border-radius | `radius.md` → 12px |
| 버튼 width | 100% (컨테이너 전체) |

### 3-6. 구현 예시

```tsx
import { colors, spacing, radius } from '../../lib/designTokens';

// 버튼
<button
  disabled={!isButtonEnabled}
  style={{
    width: '100%',
    padding: `${spacing.lg}px 0`,
    background: isButtonEnabled ? colors.brand500 : colors.gray300,
    color: colors.white,
    border: 'none',
    borderRadius: radius.md,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.4,
    cursor: isButtonEnabled ? 'pointer' : 'default',
  }}
>
  시작하기
</button>
```

---

## 4. LevelTestPage

### 4-1. 필기 기능 제외 선언

> **웹 MVP 제외 — Apple Pencil 필기 캔버스(PencilKit)는 iOS 전용 하드웨어 기능.**
> 웹에서는 단순 텍스트 답변 입력(TextField)만 구현한다.
> `inputMode.pencil`, `isEraserActive`, `clearCanvas` 관련 UI 일체 생략.

### 4-2. 레이아웃 구조

```
ZStack (relative 포지셔닝)
  ├─ 배경: colors.gray100 (전체 화면)
  ├─ 문제 카드 (problemCard)
  │    padding: top 24px / horizontal 24px / bottom 112px (바텀 바 여백)
  └─ 바텀 플로팅 바 (position: fixed, bottom: 24px)
       웹에서는 position: sticky 또는 fixed 둘 다 가능

문제 카드 내부 (column, gap: 0)
  ├─ 진행률 바              padding-bottom: 16px
  ├─ "문제 N" 레이블        padding-bottom: 8px
  ├─ 문제 본문              padding-bottom: 24px
  └─ (필기 캔버스 자리 — 웹에서는 빈 공간 또는 Spacer)
```

### 4-3. 진행률 바

| 속성 | 값 |
|---|---|
| 높이 | 6px |
| border-radius | `radius.full` → 9999px (Capsule) |
| 배경 트랙 | `colors.gray200` |
| fill 색 | `colors.brand500` |
| fill width | `(currentIndex + 1) / totalProblems * 100%` |
| transition | `width 0.25s ease-in-out` |

### 4-4. 문제 카드

| 속성 | 값 |
|---|---|
| background | `colors.white` |
| border-radius | `radius.xl` → 24px |
| box-shadow | `0px 4px 20px rgba(0, 0, 0, 0.06)` |
| padding (내부) | top 16px / horizontal 24px / bottom 24px |
| width | 100% (컨테이너 채움) |
| min-height | `calc(100vh - 160px)` 또는 flex 1 — 바텀 바가 카드 위에 뜨게 |

### 4-5. 바텀 플로팅 바 (idle 상태 — 텍스트 입력 모드)

웹 MVP는 idle 상태와 answer 입력 상태 두 가지만 구현한다.

**idle 상태** — 답 입력 캡슐 + 다음 화살표 버튼

```
HStack (row, gap: 12px, padding: 12px 16px)
  ├─ 답 입력 캡슐 (flex: 1)
  └─ 다음 화살표 원형 버튼 (44×44px)

전체 컨테이너:
  background: colors.white
  border-radius: radius.full → 9999px (Capsule)
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08)
  min-width: 320px
  position: fixed / bottom: 24px / 좌우 24px
```

**답 입력 캡슐 (idle)**

| 속성 | 값 |
|---|---|
| background | `colors.gray100` |
| border-radius | `radius.full` |
| padding | `12px 24px` |
| placeholder 색 | `colors.gray400` |
| 텍스트 색 | `colors.black` |
| font | `bodyTextXLRegular` → 14px / 400 / 1.5 |

**다음 화살표 버튼 (원형)**

| 상태 | background | icon 색 |
|---|---|---|
| 답 입력됨 (canProceed) | `colors.brand500` | `colors.white` |
| 답 없음 (not canProceed) | `colors.gray200` | `colors.gray400` |
| 크기 | 44×44px circle | — |

**answer 입력 상태** — 텍스트 필드 전체 너비 확장

```
HStack (row, padding: 12px 24px)
  └─ input (flex: 1)

border: 2px solid colors.brand500
border-radius: radius.full
background: colors.white
box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08)
```

### 4-6. 컬러

| 요소 | 토큰 | hex |
|---|---|---|
| 페이지 배경 | `colors.gray100` | `#F3F4F6` |
| 카드 배경 | `colors.white` | `#FFFFFF` |
| "문제 N" 레이블 | `colors.brand500` | `#3B82F6` |
| 문제 본문 | `colors.black` | `#000000` |
| 뒤로가기 아이콘 — 첫 문제 | `colors.gray300` | `#D2D5DA` |
| 뒤로가기 아이콘 — 이전 문제 있음 | `colors.gray700` | `#374151` |
| 로딩 오버레이 배경 | `rgba(0,0,0,0.35)` | — |
| 오버레이 카드 배경 | `rgba(0,0,0,0.6)` | — |
| 오버레이 텍스트 / 스피너 | `colors.white` | `#FFFFFF` |

### 4-7. 타이포그래피

| 요소 | 토큰 | CSS |
|---|---|---|
| "문제 N" | `captionSemiBold` | `font-size: 12px; font-weight: 600; line-height: 1.5` |
| 문제 본문 | `headingXLSemiBold` | `font-size: 20px; font-weight: 600; line-height: 1.4` |
| 답 입력 캡슐 / 필드 | `bodyTextXLRegular` | `font-size: 14px; font-weight: 400; line-height: 1.5` |
| 오버레이 텍스트 | `bodyTextXLRegular` | `font-size: 14px; font-weight: 400; line-height: 1.5` |

### 4-8. 로딩 / 제출 오버레이

- `isSubmitting` === true 시 화면 전체를 덮는 반투명 오버레이 표시
- 중앙 카드: padding 32px, border-radius `radius.lg` → 16px
- 스피너 + "학습 경로를 생성하고 있어요…" 텍스트 (gap: 16px)
- 오버레이가 활성화된 동안 하단 바 숨김 처리

---

## 5. CurriculumResultPage

CurriculumResultView.swift는 디자인 토큰이 미완성 상태(`.font(.title2)`, `Color.blue` 등 하드코딩). 아래 스펙은 동일 앱의 디자인 토큰을 적용해 정규화한 값이다.

### 5-1. 레이아웃 구조

```
VStack (column, justify-content: center, gap: 24px)
  ├─ Spacer (flex: 1)
  ├─ 로딩 상태 (isLoading)
  │    ├─ 스피너 (scale 1.5x)
  │    └─ "커리큘럼 생성 중..." 텍스트
  ├─ 결과 상태 (isLoaded)
  │    ├─ 완료 아이콘 (64×64px)
  │    ├─ 제목 텍스트 (multi-line, center)
  │    ├─ 전체 평가 섹션 (overallAssessment)
  │    ├─ 토픽별 이해도 섹션 (topicMastery)
  │    └─ 학습 시작하기 버튼
  └─ Spacer (flex: 1)
```

### 5-2. 완료 아이콘

| 속성 | 값 |
|---|---|
| 아이콘 | checkmark.circle (SF Symbols 대신 웹: ✓ 원형 또는 SVG 아이콘) |
| 크기 | 64×64px |
| 색상 | `colors.green500` → `#22C55E` |

### 5-3. 제목 텍스트

- 내용: `{nickname}님에 딱 맞는\n커리큘럼이 완성되었어요`
- font-size: 20px (iOS `.title2` 매핑), font-weight: 700, line-height: 1.4
- color: `colors.gray900` `#111827`
- text-align: center

### 5-4. 결과 카드 (전체 평가 / 토픽별 이해도)

| 속성 | 값 |
|---|---|
| background | `colors.brand50` → `#EFF6FF` |
| border-radius | `radius.md` → 12px |
| padding | 24px |
| margin-top | 32px |

**섹션 헤더 ("전체 평가", "토픽별 이해도")**

| 속성 | 값 |
|---|---|
| color | `colors.brand600` → `#2563EB` |
| font-size | 16px, font-weight: 700 |
| margin-bottom | 12px |

**섹션 간 간격**

- "전체 평가" 하단 → "토픽별 이해도" 상단: `margin-top: 20px`

**overallAssessment 텍스트**

- font-size: 14px, font-weight: 400, line-height: 1.5
- color: `colors.gray600` → `#4B5563`

**topicMastery 항목** (항목별 진행 바)

각 토픽에 대해:
- 토픽명: 14px / 600 / `colors.gray700`
- 진행 바: 높이 8px, border-radius full, track `colors.gray200`, fill `colors.brand500`
- 숙련도 % 수치: 12px / 400 / `colors.gray500`
- 항목 간 gap: 12px

### 5-5. 학습 시작하기 버튼

| 속성 | 값 |
|---|---|
| background | `colors.brand500` → `#3B82F6` |
| hover/focus | `colors.brand600` → `#2563EB` |
| color | `colors.white` |
| border-radius | `radius.md` → 12px |
| padding | 16px 0 |
| width | 100% |
| font | 16px / 700 / line-height 1.4 |
| margin-top | 32px |

### 5-6. 로딩 상태

- 배경: `colors.white` (카드 없이 페이지 중앙)
- 스피너: 브라우저 기본 또는 CSS spinner, 크기 scale 1.5
- 텍스트: "커리큘럼 생성 중...", font-size 18px, color `colors.gray500`
- 스피너 ↔ 텍스트 gap: 16px

---

## 6. 접근성 체크리스트

| 항목 | 기준 | 해당 요소 |
|---|---|---|
| 최소 탭 영역 | min 44×44px | 뒤로가기 버튼, 화살표 원형 버튼 |
| 색 대비 (WCAG AA) | 4.5:1 이상 (일반 텍스트) | brand500 `#3B82F6` on white → 3.1:1 (AA Large 충족, 일반 텍스트는 brand600 `#2563EB` 사용 권장) |
| 색 대비 — 버튼 텍스트 | 4.5:1 이상 | white on brand500: 3.1:1 (Large text 기준 충족) |
| 에러 표시 | 색 단독 의존 금지 | 에러 메시지 텍스트 병행 (색 + 문구) — 현재 iOS 코드도 텍스트 병행 |
| 비활성 버튼 | cursor: default, aria-disabled | gray300 배경 + aria-disabled="true" |
| 스피너 접근성 | role="status" + aria-label | `<div role="status" aria-label="로딩 중">` |
| 키보드 네비게이션 | Tab 순서 보장 | 입력 필드 → 버튼 순서 자연스럽게 유지 |
| input autocomplete | 닉네임은 off 권장 | `autocomplete="off"` |

---

## 7. iOS와 웹 구현 차이 정리

| 항목 | iOS | 웹 MVP |
|---|---|---|
| 필기 입력 | PencilKit 캔버스 | **제외** — 텍스트 입력만 |
| 뒤로가기 | `chevron.left` 시스템 아이콘 | `<` 텍스트 또는 SVG 아이콘 |
| 손 이모지 아이콘 | Image("hand") 에셋 | 유니코드 "👋" 또는 SVG |
| 키보드 자동 포커스 | `@FocusState` | `useRef` + `.focus()` on mode change |
| 제스처 비활성화 | `SwipeBackDisabler` (UIKit) | 해당 없음 (브라우저 기본) |
| 네비게이션 | `NavigationStack` | `useNavigate()` |
| 애니메이션 | `.easeInOut(duration: 0.2)` | `transition: 0.2s ease-in-out` CSS |
| 진행률 바 | `GeometryReader` + Capsule | CSS width + border-radius: 9999px |
| 카드 radius | `radiusXL` = 24px | `radius.xl` = 24px (동일) |
