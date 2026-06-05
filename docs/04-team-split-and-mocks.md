# 04 · Team Split & Mock Strategy

> Phase 1 한정. 프론트(사용자)와 백엔드(팀원)가 _동일 인터페이스 + 다른 구현체_ 패턴으로 병렬 진행한다. 본 문서는 인터페이스의 단일 출처, 누가 무엇을 채우는지, Mock 이 production 으로 새지 않도록 격리하는 방식을 정의한다.

## 분담 매트릭스

| 추상화 계층              | Frontend (사용자)                                                | Backend (팀원)                                        |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------- |
| 화면 / 라우트            | ✅ `app/`, `features/*/ui/`                                      | —                                                     |
| 도메인 모델·타입         | ✅ `features/*/model/`                                           | (소비만, 변경 금지)                                   |
| Repository **interface** | ✅ `features/*/api/*Repository.ts`, `core/*/[A-Z]*Repository.ts` | (소비만)                                              |
| Repository **Mock impl** | ✅ `Mock*Repository.ts`                                          | —                                                     |
| Repository **Real impl** | —                                                                | ✅ `Http*Repository.ts`, `AsyncStorage*Repository.ts` |
| HTTP 클라이언트 / 재시도 | —                                                                | ✅ `core/network/`                                    |
| 도메인 상수·brand 타입   | ✅ `shared/`                                                     | (소비만)                                              |
| Mock fixture 데이터      | ✅ `shared/mocks/`                                               | —                                                     |

## 인터페이스 정본 원칙

도메인 타입 = **contract**. 두 사람의 모든 repository 구현은 같은 타입을 반환한다.

```ts
// features/tour/model/types.ts  ← contract 의 단일 출처 (Frontend)
export interface TourSpot { ... }

// features/tour/api/TourRepository.ts  ← interface (Frontend)
export interface TourRepository {
  searchNearby(center: Coordinates, radiusMeters: number): Promise<TourSpot[]>;
  byId(contentId: string): Promise<TourSpot | null>;
}

// features/tour/api/MockTourRepository.ts  ← Frontend
export class MockTourRepository implements TourRepository { ... }

// features/tour/api/HttpTourRepository.ts  ← Backend, 같은 interface
export class HttpTourRepository implements TourRepository {
  // raw DTO → TourSpot 변환은 이 경계에서만
}
```

타입을 바꾸려면 PR 에서 _프론트가 먼저_ 모델을 갱신하고, 그 PR 을 머지한 뒤에 팀원이 mapper 를 따라 갱신한다. 역순 금지.

## Mock 의 위치와 격리

- 모든 fixture 는 `src/shared/mocks/` 한 곳. feature 별로 흩지 않는다 (cross-feature 시나리오를 한 곳에서 조립할 수 있어야 한다).
- 파일 컨벤션: `<도메인>.fixture.ts` — 예: `tourSpots.fixture.ts`, `stamps.fixture.ts`.
- Production 코드는 `@shared/mocks/*` import 금지. Mock repository (`Mock*Repository`) 만 import 허용. 현재 ESLint `no-restricted-imports` 로 강제한다.

## 주입 / Swap 전략

- 기본 주입은 **Mock**. 화면을 띄우는 데 백엔드 의존이 없다.
- Swap 지점은 `src/core/di/` (Stage 2 에서 신설). 환경변수 `EXPO_PUBLIC_USE_REAL_API` 가 `true` 면 real impl, 아니면 Mock 을 inject.
- Phase 2 (real impl 합류 후) 에는 기본값을 real 로 뒤집고 Mock 은 테스트·Storybook 용으로만 유지.

## Phase 전환 트리거

- Phase 2 진입 조건: 팀원의 `HttpTourRepository` + `core/network/` 가 머지되고 통합 테스트 1개 통과.
- 진입 시: `04-team-split-and-mocks.md` 의 본 분담 표를 갱신하고, `AGENTS.md` 의 Phase 1 owner 컬럼을 _Co-owned_ 로 바꾼다.
