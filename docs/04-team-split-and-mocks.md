# 04 · Mock-first Repository Contract

> 2026-06-12 이후 Stampy 는 1인 개발 체제다. 이 문서는 역할 분리표가 아니라, 모든 기능을 백엔드·스토리지·네트워크 준비 상태와 무관하게 먼저 개발하고 검증하기 위한 Mock-first 작업 순서 계약이다.

## 작업 순서 매트릭스

| 추상화 계층              | 먼저 만든다                              | 연결 단계에서 추가한다                                   |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------- |
| 화면 / 라우트            | `app/`, `features/*/ui/`                 | 필요한 route wiring 보강                                 |
| 도메인 모델·타입         | `features/*/model/`                      | real 응답에 맞춘 필드 추가도 도메인 타입 PR 이 먼저      |
| Repository **interface** | `features/*/api/*Repository.ts`          | 기존 interface 를 깨야 하면 별도 contract 변경 PR        |
| Repository **Mock impl** | `Mock*Repository.ts`                     | 시나리오 확장, fixture 추가                              |
| Repository **Real impl** | 없음                                     | `Http*Repository.ts`, `AsyncStorage*Repository.ts`       |
| HTTP 클라이언트 / 재시도 | 최소 contract 만 필요하면 interface 부터 | `core/network/` 실제 호출·재시도·에러 정규화             |
| 도메인 상수·brand 타입   | `shared/`                                | real integration 이 요구하는 공통 타입은 여기로 승격     |
| Mock fixture 데이터      | `shared/mocks/`                          | 테스트·시연 시나리오를 대표하도록 유지                   |
| DI 조립                  | Mock 을 기본 주입                        | 환경변수 토글로 같은 interface 의 real impl 을 선택 주입 |

## 인터페이스 정본 원칙

도메인 타입 = **contract**. Mock 과 real repository 구현은 같은 타입을 반환한다.

```ts
// features/tour/model/types.ts  ← contract 의 단일 출처
export interface TourSpot { ... }

// features/tour/api/TourRepository.ts  ← interface 를 먼저 정의
export interface TourRepository {
  searchNearby(center: Coordinates, radiusMeters: number): Promise<TourSpot[]>;
  byId(contentId: string): Promise<TourSpot | null>;
}

// features/tour/api/MockTourRepository.ts  ← 기본 주입 구현
export class MockTourRepository implements TourRepository { ... }

// features/tour/api/HttpTourRepository.ts  ← 백엔드 연결 단계에서 같은 interface 에 추가
export class HttpTourRepository implements TourRepository {
  // raw DTO → TourSpot 변환은 이 경계에서만
}
```

타입을 바꾸려면 모델과 interface 를 먼저 갱신하고, Mock 구현·fixture 로 앱 흐름을 검증한 뒤 real mapper 를 따라 갱신한다. 역순으로 raw DTO 에 맞춰 UI 나 도메인 타입을 끌고 가지 않는다.

## Mock 의 위치와 격리

- 모든 fixture 는 `src/shared/mocks/` 한 곳. feature 별로 흩지 않는다 (cross-feature 시나리오를 한 곳에서 조립할 수 있어야 한다).
- 파일 컨벤션: `<도메인>.fixture.ts` — 예: `tourSpots.fixture.ts`, `stamps.fixture.ts`.
- Production 코드는 `@shared/mocks/*` import 금지. Mock repository (`Mock*Repository`) 만 import 허용. 현재 ESLint `no-restricted-imports` 로 강제한다.

## 주입 / Swap 전략

- 기본 주입은 **Mock**. 화면을 띄우는 데 API 키, 쿼터, 네트워크, 스토리지 구현에 의존하지 않는다.
- Swap 지점은 `src/core/di/`. 환경변수 `EXPO_PUBLIC_USE_REAL_API` 가 `true` 이고 필요한 키가 있을 때만 real impl 을 inject 한다.
- `EXPO_PUBLIC_USE_REAL_API=true` 인데 필수 키가 없으면 명시적으로 실패시킨다. 그 외 개발·시연 기본값은 Mock 으로 부팅 가능해야 한다.
- real impl 이 안정화돼도 Mock 은 테스트·시연·오프라인 개발용으로 유지한다.

## 연결 단계 트리거

- real API / storage 연결은 같은 interface 를 이미 만족하는 Mock 흐름이 있을 때 시작한다.
- 연결 PR 은 raw DTO, storage key, 네트워크 에러를 해당 repository 경계에서 도메인 타입과 앱 에러로 정규화한다.
- 연결 후에도 UI 는 repository interface 만 바라본다. feature 간 직접 import 가 필요해지면 `core/` 또는 `shared/` 로 끌어올린다.
