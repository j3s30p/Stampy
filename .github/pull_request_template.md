<!--
이 템플릿은 모든 PR 에 강제로 적용됩니다.
빈 칸을 채우지 않은 PR 은 머지 불가 (검토자 차단).
관련 규약: AGENTS.md → "File ownership" / "Branch / commit convention".
-->

## 어느 영역?

체크: 위반 시 CODEOWNERS 가 자동으로 영역 담당을 리뷰어로 지정합니다.

- [ ] `stamp` (도장 수집/인증)
- [ ] `map` (Kakao WebView)
- [ ] `tour` (관광지/TourAPI)
- [ ] `core` (network / location / storage / auth)
- [ ] `shared` (brand 타입 / 상수 / ui-kit / mocks)
- [ ] `app` (라우트)
- [ ] `harness` (ESLint / CI / 문서 / skills)
- [ ] `docs` (README / AGENTS / CLAUDE / .ai-\*)

## 무엇을 / 왜?

<!-- 1~3 줄. 이 PR 이 무엇을 바꾸고 왜 필요한지. WHAT 보다 WHY 중심. -->

## Invariant 영향

`AGENTS.md` 의 critical invariants 중 닿는 것 표시. 없으면 "없음" 명시.

- [ ] `STAMP_RADIUS_METERS = 100` 관련
- [ ] branded `Latitude` / `Longitude` 사용 경계
- [ ] Kakao WebView 만 사용 (네이티브 SDK 도입 시도 X)
- [ ] TourAPI 응답 정규화 경계 (`features/tour/api` 안에서만 raw DTO)
- [ ] ESLint suppress 추가 (룰 ID + 근거 주석 포함 필수)
- [ ] 없음

## 테스트 / 검증

- [ ] `npm run quality:fast` 통과
- [ ] 로컬에서 iOS 시뮬레이터로 영향 화면 띄워봄
- [ ] (해당 시) 단위/통합 테스트 추가·갱신
- [ ] (해당 시) Mock fixture 추가·갱신

## Phase 1 분담 확인

- [ ] 본 PR 은 **Frontend** 영역 (interface / Mock / UI / 도메인) 만 수정
- [ ] 본 PR 은 **Backend** 영역 (real impl / core/network) 만 수정
- [ ] Co-owned 영역 (harness / 정본 문서) — 양쪽 리뷰 필요

## 관련 skill / background

작업 직전 읽은 `.ai-skills/*` 또는 `.ai-background/*` 가 있다면 표시:

- 예: `.ai-skills/location-verification.md`

## 스크린샷 / 영상 (UI 변경 시)

<!-- iOS 시뮬레이터 캡처 또는 짧은 mp4 -->
