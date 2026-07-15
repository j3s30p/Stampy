# 02 · Architecture Decisions

## ADR-008 — Flutter + Supabase로 앱 런타임 재구축

- **Status**: Accepted (2026-07-13)
- **Context**: 기존 Expo SDK 52 앱은 화면 전면 재설계, 실제 백엔드 부재, 임시 GPS 좌표, Mock 중심 흐름이 겹쳐 점진 업그레이드보다 새 앱 셸의 비용이 낮다.
- **Decision**: 최신 Flutter stable을 iOS/Android 클라이언트 정본으로 사용한다. Supabase가 Auth/Postgres/RLS/Data API/Edge Function/PostGIS를 맡고, 행동 기반 추천은 SQL/RPC로 계산한다. 앱 셸은 Supabase Kakao OAuth 회원만 진입할 수 있으며 익명 로그인은 사용하지 않는다. Kakao Maps는 Flutter WebView를 통해 JS SDK를 사용한다.
- **Consequences**: Stampy v1은 카카오 인증 → 행동 기반 추천 한 곳 → 지도 → 현재 GPS 기반 100m 인증 → 도장 수집에 집중한다. 기존 TypeScript UI와 Expo 런타임은 제거하고, 검증된 도메인 의미만 Dart와 서버 계약으로 다시 구현한다. 관광지·행사 탐색 및 상세 화면은 v1 범위가 아니다. FastAPI와 LLM은 자연어 추천이 실제 범위가 될 때까지 도입하지 않는다.

> ADR(Architecture Decision Record) 경량 포맷. 결정을 뒤집고 싶을 때 본 문서의 _Context_ 와 _Consequences_ 를 먼저 점검한다.

---

## ADR-001 · React Native + Expo (Managed) 채택

- **Status**: Superseded by ADR-008 (2026-07-13)
- **Context**: 공모전 일정상 iOS/Android 동시 출시 필요. 1~2인 개발. 사내 인증서/네이티브 빌드 인프라 없음.
- **Decision**: Expo Managed workflow + EAS Build.
- **Consequences**: 네이티브 모듈 추가 시 prebuild/EAS 의존. 본 결정은 ADR-003 (Kakao WebView) 의 전제다.

## ADR-002 · Expo Router (file-based)

- **Status**: Superseded by ADR-008 (2026-07-13)
- **Context**: 라우팅 보일러플레이트 최소화, 딥링크(`stampy://...`)와 웹 미리보기 지원 필요.
- **Decision**: Expo Router v4 typed routes 사용.
- **Consequences**: `app/` 디렉터리는 라우트 전용. 화면 본체는 `src/features/*/ui/*View.tsx` 로 분리하고 `app/` 은 얇은 어댑터만 둔다.

## ADR-003 · Kakao Maps는 Flutter WebView 사용

- **Status**: Revised by ADR-008; WebView 결정은 유지
- **Context**: Kakao Maps JS SDK와 앱 도메인 사이의 경계를 명확히 유지하고 네이티브 지도 SDK 의존을 피한다.
- **Decision**: `webview_flutter`가 번들된 `flutter_app/assets/map/kakao_map.html`을 로드한다. Dart ↔ WebView 통신은 버전이 명시된 `KakaoMapBridge` JSON 계약만 사용한다.
- **Consequences**: `https://stampy.local/` base URL과 Kakao JavaScript 도메인 등록이 필요하다. WebView에서 받은 메시지는 도메인 상태로 반영하기 전에 필드와 길이를 검증한다.

## ADR-004 · Feature-Sliced + 3-Tier hybrid

- **Status**: Superseded by ADR-008 (2026-07-13)
- **Context**: 병렬 PR 환경 + 도메인이 명확히 분리됨 (stamp / map / tour). 클래식 Clean Architecture 4-layer 는 1~2인에 과함.
- **Decision**: `src/features/{stamp,map,tour}` (FSD slice) + `src/core` (cross-cutting infra) + `src/shared` (primitives). features 끼리 cross-import 금지.
- **Consequences**: Stage 3 ESLint 경계 룰 (`stampy/no-cross-feature-import`) 으로 강제. 공유 필요 시 무조건 `core/` 또는 `shared/` 로 끌어올린다.

## ADR-005 · TourAPI KorService2

- **Status**: Retained; 호출·정규화 경계는 Supabase Edge Function으로 이동
- **Context**: KorService1 deprecated 예고. KorService2 가 신규 표준.
- **Decision**: `TOUR_API_BASE_URL = "https://apis.data.go.kr/B551011/KorService2"`.
- **Consequences**: 일부 엔드포인트 시그니처가 v1과 다르므로 서버 경계에서 응답을 도메인 JSON으로 정규화한다.

## ADR-006 · STAMP_RADIUS_METERS = 100

- **Context**: GPS 정확도는 도심 5~10m, 음영 30~100m, 실내 100m+. UX 측에서 “관광지 근처” 의 직관은 50~200m.
- **Decision**: 100m 고정. 변동 가능성을 거의 두지 않는다.
- **Consequences**: 너무 작게 잡으면 (50m) 가짜 negative 가, 너무 크게 잡으면 (200m) 가짜 positive 가 폭증. 100m 는 두 오류율의 trade-off 절충. 변경 시 본 ADR 갱신 + 회귀 테스트 필수.

## ADR-007 · 좌표 값 객체

- **Context**: 좌표 swap (lat ↔ lng) 은 위치 앱의 1순위 회귀. TourAPI 는 `mapx`=경도/`mapy`=위도 (OGC 관습), Kakao 는 `LatLng(lat, lng)` 으로 순서가 반대다.
- **Decision**: `flutter_app/lib/core/geo/coordinates.dart`의 `Latitude` / `Longitude` 값 객체로 범위를 검증한다. 외부 값은 repository 또는 플랫폼 adapter 경계에서 생성한다.
- **Consequences**: 도메인 내부에서 위도와 경도를 별도 타입으로 유지하며 Kakao bridge 직렬화 시에만 `lat` / `lng` 숫자로 변환한다.
