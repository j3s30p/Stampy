# AGENTS.md — Stampy 에이전트 공통 계약

> **Scope** — Stampy를 수정하는 모든 AI 에이전트가 먼저 읽는 벤더 중립 계약이다.
> **Current runtime** — 2026-07-13부터 Flutter가 정본이다. 전환 중에는 `flutter_app/`만 새 제품 코드로 취급하고, 기존 Expo `app/`·`src/`는 동작 참고용 레거시로만 읽는다.

## Project mission

한국관광공사 TourAPI와 Kakao Maps를 기반으로, 사용자가 관광지나 행사에 실제 방문했음을 위치로 인증하고 도장을 수집하는 iOS/Android 앱이다.

## Critical invariants

1. **도장 인증 반경은 100m 고정**이다. 발견 반경과 인증 반경을 같은 상수나 UI로 표현하지 않는다.
2. **좌표는 검증된 `Latitude` / `Longitude` 값 객체만 사용**한다. raw `double`은 플랫폼·JSON 경계에서만 허용한다.
3. **Kakao Maps는 WebView 경유 한정**이다. 지도 렌더링과 marker 이벤트만 HTML/JS가 맡고, 권한·GPS·도메인 상태는 Flutter가 소유한다.
4. **TourAPI 응답은 서버 진입 즉시 도메인 JSON으로 정규화**한다. TourAPI secret과 raw DTO를 Flutter 앱에 두지 않는다.
5. **클라이언트의 100m 판정은 UX 안내용**이다. 실제 수집은 Supabase Edge Function/PostGIS가 거리·정확도·중복을 다시 검증한다.
6. **Supabase 공개 schema는 RLS와 최소 grant를 필수 적용**한다. publishable key만 앱에 넣고 secret/service-role key는 넣지 않는다.
7. **추천 근거와 장소 상태를 분리**한다. 카드당 추천 근거는 최대 하나이며 `취향 저격` 같은 추천 chip과 `수집 완료`·`인증 가능` 같은 상태 chip을 혼용하지 않는다.
8. **lint나 analyzer 경고를 blanket suppress하지 않는다.** 불가피한 예외는 대상 규칙과 구체적 이유를 같은 줄에 기록한다.

## Flutter architecture

활성 앱 코드는 `flutter_app/`에 둔다.

```text
flutter_app/lib/
├─ app/                  # MaterialApp, router, theme
├─ core/                 # config, geo, errors, shared widgets
└─ features/
   └─ <feature>/
      ├─ domain/         # immutable model, repository interface
      ├─ data/           # Supabase/platform implementation when needed
      └─ presentation/   # screen, controller, widgets
```

- Feature-first 구조를 사용한다.
- Riverpod provider override로 fake와 real repository를 교체한다.
- 화면 전용 상태는 화면 안에 두고 앱 전체 `AppState` 객체는 만들지 않는다.
- `use_case`, `datasource`, mapper 계층은 실제 중복이나 복잡성이 생기기 전에는 추가하지 않는다.
- feature가 다른 feature의 구현 파일을 직접 import하지 않는다. 공유 계약은 `core/` 또는 해당 domain interface로 올린다.

## Backend boundary

| 책임                       | 구현 위치                                     |
| -------------------------- | --------------------------------------------- |
| 로그인·세션                | Supabase Auth, Kakao OAuth                    |
| 프로필·수집 목록·행동 기록 | Supabase Data API + RLS                       |
| 행동 기반 추천             | Postgres SQL/RPC                              |
| 100m 도장 인증             | Supabase Edge Function + PostGIS              |
| TourAPI 호출·정규화·캐시   | Supabase Edge Function                        |
| 지도 표시                  | Flutter `webview_flutter` + Kakao Maps JS SDK |

LLM과 FastAPI는 현재 범위에 포함하지 않는다. 자연어 추천이나 Python 기반 추천 서비스가 실제 요구사항이 될 때 별도 경계로 추가한다.

## Mock-first contract

Repository interface와 in-memory fake를 먼저 만들고 UI를 외부 서비스와 분리한다. real 구현은 같은 domain type을 반환해야 한다.

필수 repository 경계:

- `AuthRepository`
- `TourRepository`
- `EventRepository`
- `StampRepository`
- `InteractionRepository`
- `RecommendationRepository`
- `RankingRepository`는 랭킹 화면을 유지할 때만 둔다.

## Quality gate

`flutter_app/`에서 실행한다.

| 명령                                                | 검사                 |
| --------------------------------------------------- | -------------------- |
| `dart format --output=none --set-exit-if-changed .` | Dart 포맷            |
| `flutter analyze`                                   | 정적 분석            |
| `flutter test`                                      | 도메인·widget 테스트 |
| `flutter build ios --simulator`                     | iOS 네이티브 빌드    |

지도·GPS·OAuth·WebView·햅틱·safe area·하단 탭은 widget test나 웹 preview만으로 완료 판정하지 않는다. iOS Simulator와 Android Emulator에서 각각 확인한다. 환경 문제로 실행하지 못하면 실패한 명령과 미검증 플랫폼을 명시한다.

## Design source

- Stitch 원본: `design/stitch_stampy_korean_travel_journal/`
- 디자인 정본: `design/stitch_stampy_korean_travel_journal/field_journal/DESIGN.md`
- 성공 화면은 `_10`을 정본으로 사용한다.
- 팔레트 충돌 시 본문 기준인 Canvas `#F4F0E8`, Paper `#FFFCF6`, Ink `#1E211E`, Accent `#D95432`를 사용한다.
- 시안이 100m invariant와 충돌하면 invariant가 우선한다.

## Branch / commit convention

- 브랜치: `<area>/<short-slug>` — 현재 Flutter 전환 브랜치는 `app/flutter-rebuild`.
- 커밋: Conventional Commits — 예: `feat(app): bootstrap Flutter client`.
- main 직접 push, force-push, `--no-verify`, `git reset --hard`를 금지한다.
- 기존 Expo 제거는 Flutter iOS 빌드와 핵심 세로 슬라이스가 통과한 뒤 별도 검증 단계에서 수행한다.

## Work tracking

GitHub Issues, Milestones, Labels가 단일 사실 출처다. `ROADMAP.md`, `STATUS.md`, 날짜별 진행 문서를 만들지 않는다. PR 본문에는 `Closes #N` 또는 `Refs #N`을 명시한다.
