# 02 · Architecture Decisions

> ADR(Architecture Decision Record) 경량 포맷. 결정을 뒤집고 싶을 때 본 문서의 _Context_ 와 _Consequences_ 를 먼저 점검한다.

---

## ADR-001 · React Native + Expo (Managed) 채택

- **Context**: 공모전 일정상 iOS/Android 동시 출시 필요. 1~2인 개발. 사내 인증서/네이티브 빌드 인프라 없음.
- **Decision**: Expo Managed workflow + EAS Build.
- **Consequences**: 네이티브 모듈 추가 시 prebuild/EAS 의존. 본 결정은 ADR-003 (Kakao WebView) 의 전제다.

## ADR-002 · Expo Router (file-based)

- **Context**: 라우팅 보일러플레이트 최소화, 딥링크(`stampy://...`)와 웹 미리보기 지원 필요.
- **Decision**: Expo Router v4 typed routes 사용.
- **Consequences**: `app/` 디렉터리는 라우트 전용. 화면 본체는 `src/features/*/ui/*View.tsx` 로 분리하고 `app/` 은 얇은 어댑터만 둔다.

## ADR-003 · Kakao Maps 는 WebView, 네이티브 SDK 미사용

- **Context**: Kakao 의 공식 RN SDK 부재. 비공식 fork 가용성/유지보수 불확실. ADR-001 의 Expo Managed 유지가 우선.
- **Decision**: `react-native-webview` 로 Kakao Maps JS SDK 를 호스팅. RN ↔ WebView 통신은 `KakaoBridgeMessage` discriminated union.
- **Consequences**: WebView 성능·메모리 한계 인지. 마커 1000개+ 시나리오는 클러스터링 필요. Naver Maps 로 변경 시 본 결정만 갱신하면 도메인 코드 영향 최소.

## ADR-004 · Feature-Sliced + 3-Tier hybrid

- **Context**: 병렬 PR 환경 + 도메인이 명확히 분리됨 (stamp / map / tour). 클래식 Clean Architecture 4-layer 는 1~2인에 과함.
- **Decision**: `src/features/{stamp,map,tour}` (FSD slice) + `src/core` (cross-cutting infra) + `src/shared` (primitives). features 끼리 cross-import 금지.
- **Consequences**: Stage 3 ESLint 경계 룰 (`stampy/no-cross-feature-import`) 으로 강제. 공유 필요 시 무조건 `core/` 또는 `shared/` 로 끌어올린다.

## ADR-005 · TourAPI KorService2

- **Context**: KorService1 deprecated 예고. KorService2 가 신규 표준.
- **Decision**: `TOUR_API_BASE_URL = "https://apis.data.go.kr/B551011/KorService2"`.
- **Consequences**: 일부 엔드포인트 시그니처가 v1과 다름. 마이그레이션 문서는 `.ai-skills/tour-api-normalization.md` (Stage 2).

## ADR-006 · STAMP_RADIUS_METERS = 100

- **Context**: GPS 정확도는 도심 5~10m, 음영 30~100m, 실내 100m+. UX 측에서 “관광지 근처” 의 직관은 50~200m.
- **Decision**: 100m 고정. 변동 가능성을 거의 두지 않는다.
- **Consequences**: 너무 작게 잡으면 (50m) 가짜 negative 가, 너무 크게 잡으면 (200m) 가짜 positive 가 폭증. 100m 는 두 오류율의 trade-off 절충. 변경 시 본 ADR 갱신 + 회귀 테스트 필수.

## ADR-007 · Branded coordinate types

- **Context**: 좌표 swap (lat ↔ lng) 은 위치 앱의 1순위 회귀. TourAPI 는 `mapx`=경도/`mapy`=위도 (OGC 관습), Kakao 는 `LatLng(lat, lng)` 으로 순서가 반대다.
- **Decision**: `Latitude` / `Longitude` 를 nominal brand 로 정의 (`@shared/types/coordinates.ts`). 변환은 `asLatitude` / `asLongitude` 만 허용.
- **Consequences**: 외부 DTO 와의 경계에서 한 번만 변환하고, 도메인 내부는 swap 불가능.

## ADR-008 · 정본 문서 MECE 분리 (이 하네스 자체)

- **Context**: 단일 CLAUDE.md / 단일 README 가 비대해지면 (1) 인간이 안 읽고 (2) 에이전트가 매번 전부 로드해 토큰을 낭비한다.
- **Decision**: README (사람) / AGENTS (벤더중립) / CLAUDE (Claude) / .ai-skills (호출형) / .ai-background (그라운딩) 5분할.
- **Consequences**: 갱신 시 “어디에 쓸지” 판단 필요. Stage 4 `sync-harness-docs.sh` 로 정본 → mirror (`.cursorrules` 등) fan-out. Stage 5 verifier 로 MECE 위반(중복 정의/순환 참조) 검출.
