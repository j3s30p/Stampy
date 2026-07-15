# Stampy

> 위치 기반 관광 도장 수집 앱. 사용자가 한국관광공사 TourAPI 관광지에 실제 방문했음을 GPS로 확인하고 디지털 도장을 수집한다.

## 현재 상태

`flutter_app/`이 iOS·Android 앱의 정본이다. Stampy v1은 행동 기반 추천 한 곳을 지도에서 확인하고 현재 GPS로 100m 이내 방문을 인증해 도장을 수집하는 흐름에 집중한다.

## Stack

- Flutter stable + Dart
- Riverpod + go_router
- Kakao Maps JS SDK via `webview_flutter`
- geolocator 기반 현재 위치
- Supabase Auth/Postgres/RLS/Edge Functions
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
supabase/                  # DB migration, RLS, RPC, Edge Functions
design/                    # Field Journal 디자인 원본
```

루트 Node 프로젝트는 앱 런타임이 아니라 Git 훅, 저장소 포맷, 로컬 Supabase 계약 smoke를 위한 개발 하네스다.

상세 의도는 [`docs/02-architecture-decisions.md`](./docs/02-architecture-decisions.md) 참조.

## Getting started

```sh
cd flutter_app
flutter pub get
flutter run \
  --dart-define=KAKAO_JS_KEY=<카카오 JavaScript 키> \
  --dart-define=SUPABASE_URL=<프로젝트 URL> \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

- 앱 셸은 복원된 회원 세션 또는 카카오 로그인을 통과한 뒤에만 열린다.
- Supabase 설정을 생략하면 서비스 연결 실패 화면을 표시한다.
- URL과 publishable key 중 하나만 설정하면 비밀값 없는 구성 오류를 기록하고 앱에서는 세션 연결 실패 상태를 표시한다.
- Supabase Dashboard에서 Kakao provider를 활성화하고 anonymous sign-in은 비활성화한다.
- 클라이언트에는 publishable key만 사용한다. secret/service-role key는 넣지 않는다.

Kakao JavaScript 키 없이도 로그인과 앱 셸은 실행할 수 있지만 실제 지도 타일은 표시되지 않는다. 로그인 provider에는 지도용 JavaScript 키가 아니라 Kakao REST API 키와 Login Client Secret을 사용하며, 두 값은 Supabase Dashboard에만 저장한다.

### Kakao Auth callback

- Kakao Developers REST API 키 Redirect URI: `https://xnqgyiidnpzviyakfwzn.supabase.co/auth/v1/callback`
- Supabase URL Configuration Redirect URL: `com.stampy.app://login-callback/`
- 앱 OAuth callback: `com.stampy.app://login-callback/`

최초 카카오 인증은 회원가입, 이후 인증은 같은 계정의 로그인으로 처리된다. Kakao 이메일 동의를 사용하지 않으면 Supabase Kakao provider의 `Allow users without an email`을 활성화한다.

## Local Supabase

Docker를 실행한 뒤 저장소 루트에서 고정된 CLI 버전으로 migration, RLS, 실제 회원 Auth/JWT/RPC 연결을 검증한다. 아래 `start`는 테스트에 필요한 Postgres, GoTrue, Kong, PostgREST만 실행한다.

```sh
npx supabase@2.109.1 start -x edge-runtime,imgproxy,logflare,mailpit,postgres-meta,realtime,storage-api,studio,supavisor,vector
npx supabase@2.109.1 db reset
npx supabase@2.109.1 test db
npx supabase@2.109.1 db lint --level error --schema public
npx supabase@2.109.1 status -o json | node supabase/tests/integration/local-contract-smoke.mjs
npx supabase@2.109.1 stop
```

HTTP smoke는 로컬 URL만 허용하며 고유 fixture와 확인된 테스트 회원 2명을 만든 뒤 성공·실패와 관계없이 삭제한다. `stamp_spots`는 서버가 관리하는 도장 대상 정본이다. 로그인한 사용자는 `list_stamp_spots()` RPC로 스칼라 좌표를 조회하며, 운영 데이터는 가짜 seed 없이 아래 TourAPI 동기화 함수로만 추가한다.

## TourAPI catalog sync

Edge Function 코드는 Deno 2.9.2로 별도 검증한다.

```sh
(cd supabase/functions && npx -y deno@2.9.2 task quality)
```

로컬 호출에는 디코딩된 공공데이터포털 키와 32자 이상의 호출 전용 토큰이 필요하다. `SUPABASE_SERVICE_ROLE_KEY`는 로컬 Supabase 런타임이 함수 내부 DB 쓰기에만 제공하며 호출 토큰으로 재사용하지 않는다.

```sh
cp supabase/functions/.env.example supabase/functions/.env.local
npx supabase@2.109.1 start -x vector,logflare
npx supabase@2.109.1 functions serve sync-stamp-spots \
  --env-file supabase/functions/.env.local
```

함수는 운영자가 명시한 TourAPI `contentId` 문자열만 동기화한다. 요청하지 않은 기존 행은 삭제하지 않는다.

```sh
curl --request POST \
  --url http://127.0.0.1:54321/functions/v1/sync-stamp-spots \
  --header 'Authorization: Bearer <STAMP_SPOT_SYNC_TOKEN>' \
  --header 'Content-Type: application/json' \
  --data '{"contentIds":["126508"]}'
```

실제 운영 대상 ID 선정, 원격 secret 등록, 함수 배포는 환경 자격증명이 준비된 활성화 단계에서 수행한다. 앱에는 TourAPI 키, 동기화 토큰, service-role 키를 넣지 않는다.

## 검증

```sh
npm ci
npm run quality

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
- [`docs/04-team-split-and-mocks.md`](./docs/04-team-split-and-mocks.md) — Flutter repository 계약과 Fake 사용 범위
