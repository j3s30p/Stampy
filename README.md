# Stampy

> 위치 기반 관광 도장 수집 앱. 사용자가 한국관광공사 TourAPI 관광지에 실제 방문했음을 GPS로 확인하고 디지털 도장을 수집한다.

## 현재 상태

`flutter_app/`이 iOS·Android 앱의 정본이다. 루트의 기존 Expo `app/`·`src/`는 Flutter 전환 중 동작 참고와 회귀 검사 용도로만 남아 있으며 새 제품 코드는 추가하지 않는다.

## Stack

- Flutter stable + Dart
- Riverpod + go_router
- Kakao Maps JS SDK via `webview_flutter`
- geolocator 기반 현재 위치
- Supabase Auth/Postgres/RLS/Edge Functions (백엔드 연결 목표)
- 한국관광공사 TourAPI KorService2

## Layout

```
flutter_app/
  lib/
    app/                   # 앱 셸, 라우터, 테마
    core/                  # 위치, 좌표, 공통 위젯
    features/              # 기능별 domain/data/presentation
  test/                    # 도메인·위젯 테스트
  assets/map/              # Kakao Maps WebView 문서
```

상세 의도는 [`docs/02-architecture-decisions.md`](./docs/02-architecture-decisions.md) 참조.

## Getting started

```sh
cd flutter_app
flutter pub get
flutter run --dart-define=KAKAO_JS_KEY=<카카오 JavaScript 키>
```

Supabase 익명 세션까지 연결하려면 두 설정을 함께 추가한다.

```sh
flutter run \
  --dart-define=KAKAO_JS_KEY=<카카오 JavaScript 키> \
  --dart-define=SUPABASE_URL=<프로젝트 URL> \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

- Supabase 설정을 둘 다 생략하면 개발용 guest 모드로 부팅한다.
- URL과 publishable key 중 하나만 설정하면 비밀값 없는 구성 오류를 기록하고 앱에서는 세션 연결 실패 상태를 표시한다.
- Supabase Dashboard에서 anonymous sign-in을 활성화해야 한다.
- 클라이언트에는 publishable key만 사용한다. secret/service-role key는 넣지 않는다.

Kakao JavaScript 키 없이도 앱 셸까지 실행할 수 있지만 실제 지도 타일은 표시되지 않는다.

## Local Supabase database

Docker를 실행한 뒤 저장소 루트에서 고정된 CLI 버전으로 migration과 RLS를 검증한다.

```sh
npx supabase@2.109.1 db start
npx supabase@2.109.1 db reset
npx supabase@2.109.1 test db
npx supabase@2.109.1 db lint --level error --schema public
npx supabase@2.109.1 stop
```

`stamp_spots`는 서버가 관리하는 도장 대상 정본이다. 로그인한 사용자는 조회만 가능하며, 운영 데이터는 이후 TourAPI 동기화 단계에서 추가한다.

## 검증

```sh
cd flutter_app
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
flutter build ios --simulator
```

지도·GPS·WebView·safe area·하단 탭 변경은 iOS Simulator와 Android Emulator에서 각각 확인한다.

## Work tracking

| 무엇이                        | 어디서                                                    |
| ----------------------------- | --------------------------------------------------------- |
| 큰 단위 진행 상태             | [Milestones](https://github.com/j3s30p/Stampy/milestones) |
| 개별 작업 / TODO / 버그       | [Issues](https://github.com/j3s30p/Stampy/issues)         |
| 진행 중 변경                  | [Pull Requests](https://github.com/j3s30p/Stampy/pulls)   |
| 영역 / 타입 / 우선순위 / 상태 | Labels (`area/*`, `type/*`, `priority/*`, `status/*`)     |

**모든 PR 은 관련 issue 를 닫는다** (`Closes #N` 본문 footer). issue 없는 PR 은 인플라이트 작업 추적 안 됨 → 가급적 먼저 issue 생성.

## Documentation

- [`docs/01-domain-glossary.md`](./docs/01-domain-glossary.md) — 도메인 용어
- [`docs/02-architecture-decisions.md`](./docs/02-architecture-decisions.md) — 아키텍처 결정
- [`docs/03-external-apis.md`](./docs/03-external-apis.md) — TourAPI·Kakao Maps 주의사항
- [`docs/04-team-split-and-mocks.md`](./docs/04-team-split-and-mocks.md) — Mock-first repository 원칙
