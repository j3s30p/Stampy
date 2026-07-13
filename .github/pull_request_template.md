<!--
이 템플릿은 모든 PR 에 강제로 적용됩니다.
빈 칸을 채우지 않은 PR 은 머지 불가 (검토자 차단).
-->

## 관련 issue

<!--
가능하면 항상 issue 를 먼저 만들고 PR 에서 닫는다. issue 없는 PR 은 사후 추적 어려움.

  Closes #<번호>     ← 머지 시 issue 자동 close
  Refs #<번호>       ← 부분 진행 (close 안 함)

명백한 작은 chore (포맷 수정 등) 는 issue 생략 가능 — "issue 없음" 명시.
-->

Closes #

## 어느 영역?

- [ ] `stamp` (도장 수집/인증)
- [ ] `map` (Kakao WebView)
- [ ] `tour` (관광지/TourAPI)
- [ ] `core` (위치/좌표/공통 위젯)
- [ ] `shared` (공통 타입/상수/UI)
- [ ] `app` (앱 셸/라우트/테마)
- [ ] `harness` (CI/빌드/tooling)
- [ ] `docs` (README/docs/GitHub 템플릿)
- [ ] `deps` (의존성/빌드 설정)

## 무엇을 / 왜?

<!-- 1~3 줄. 이 PR 이 무엇을 바꾸고 왜 필요한지. WHAT 보다 WHY 중심. -->

## 제품 제약 영향

- [ ] 도장 인증 반경 100m 관련
- [ ] `Latitude` / `Longitude` 값 객체 경계
- [ ] Kakao WebView 만 사용 (네이티브 SDK 도입 시도 X)
- [ ] TourAPI secret·raw DTO의 서버 정규화 경계
- [ ] Supabase RLS/최소 권한 경계
- [ ] 추천 chip과 장소 상태 chip 분리
- [ ] 없음

## 테스트 / 검증

- [ ] `dart format --output=none --set-exit-if-changed .` 통과
- [ ] `flutter analyze` 통과
- [ ] `flutter test` 통과
- [ ] (UI/플랫폼 변경 시) iOS Simulator 확인
- [ ] (UI/플랫폼 변경 시) Android Emulator 확인
- [ ] (해당 시) 스크린샷/영상 첨부

## Mock-first 순서 확인

- [ ] interface / Mock / UI / 도메인 흐름을 먼저 세우는 변경
- [ ] 같은 interface 에 real impl / core network / storage 를 연결하는 변경
- [ ] 문서 / 저장소 설정 변경

## 스크린샷 / 영상 (UI 변경 시)

<!-- iOS 시뮬레이터 캡처 또는 짧은 mp4 -->
