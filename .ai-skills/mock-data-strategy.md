---
name: mock-data-strategy
description: shared/mocks/ fixture 작성·사용 규칙. Mock repository 가 production import 로 새는 것을 ESLint 와 디렉터리 격리로 차단하고, Real impl 합류 시 무중단 swap 절차를 정의한다.
triggers:
  - 새 Mock fixture 추가 / 기존 fixture 수정
  - MockTourRepository · MockStampRepository · MockStorageRepository · MockAuthRepository 작업
  - Repository 주입 / DI 변경
  - "이 fixture 어디 둬야 하지?" 판단
owner-paths:
  - src/shared/mocks/
  - src/features/*/api/Mock*Repository.ts
  - src/core/*/Mock*Repository.ts
  - src/core/di/
status: stub
filled-in-stage: 2
---

## Intent

Mock 은 (1) 프론트 단독 개발의 생명선이지만 (2) production 으로 누수되면 가짜 데이터가 사용자에게 보이고 (3) Real impl 합류 시 Mock 잔재가 시간 폭탄이 된다. 이 skill 은 세 가지를 모두 다룬다.

## To be filled in Stage 2

- Fixture 파일 컨벤션 (`<도메인>.fixture.ts`, 한 도메인당 1개, 함수 시그니처 `make<Domain>(overrides?)`)
- Mock repository 구현 패턴 (in-memory Map, latency 시뮬레이션, 실패 케이스 토글)
- DI 주입 지점 (`src/core/di/container.ts` — Stage 2 신설), 환경변수 swap (`EXPO_PUBLIC_USE_REAL_API`)
- ESLint 격리 룰 (`stampy/no-mock-in-production`) 동작 규약 — Stage 3 에서 ID 부여
- Real impl 합류 절차 (1) DI 기본값 뒤집기 (2) Mock 의 Storybook/test 전용화 (3) integration 테스트 회귀
