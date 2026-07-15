# 04 · Flutter Repository Contract

> Flutter 화면과 외부 시스템을 분리하는 repository 계약과 Fake 사용 범위를 정의한다.

## 작업 순서

| 계층             | 먼저 정의한다                                      | 연결 구현                                    |
| ---------------- | -------------------------------------------------- | -------------------------------------------- |
| 화면·라우트      | `flutter_app/lib/app/`, `features/*/presentation/` | provider를 통해 repository 상태를 구독       |
| 도메인           | `features/*/domain/`의 모델과 repository interface | 외부 응답 필드를 도메인에 직접 노출하지 않음 |
| 테스트·개발 구현 | `features/*/data/fake_*_repository.dart`           | 결정적인 fixture로 UI와 도메인 흐름 검증     |
| 운영 구현        | 같은 interface의 `supabase_*_repository.dart`      | Supabase RPC 응답을 도메인 값으로 정규화     |
| 인증·위치        | `core/auth/`, `core/location/`의 interface         | Supabase Auth와 geolocator adapter           |
| 조립             | `app/app_dependencies.dart`                        | `main.dart`에서 Riverpod provider override   |

도메인 모델과 repository interface가 앱 내부 계약의 정본이다. Fake와 Supabase 구현은 같은 타입을 반환하며, raw JSON·Postgres 컬럼·플랫폼 예외는 각 data 또는 adapter 경계 밖으로 노출하지 않는다.

## 의존성 조립

`AppConfig`는 `dart-define`의 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `KAKAO_JS_KEY`를 검증한다.

- Supabase 설정이 없으면 Auth는 unavailable 상태로 앱 셸 진입을 차단한다. Fake repository는 테스트에서만 명시적으로 주입한다.
- Supabase URL과 publishable key 중 하나만 있으면 구성 오류다.
- Release는 세 값이 모두 필요하다. 설정 또는 초기화 실패 시 `UnavailableAuthRepository`가 앱 셸 진입을 차단하며, 함께 주입된 나머지 Fake 구현은 오류 상태를 구성하는 placeholder일 뿐 제품 화면에 노출되지 않는다.

별도 환경변수로 Fake와 운영 구현을 강제 전환하지 않는다. 구성의 존재 여부와 빌드 모드가 유일한 선택 기준이다.

## Fake 사용 범위

Fake repository는 단위·위젯 테스트와 로컬 UI 개발을 위한 구현이다. 운영 데이터를 흉내 내는 순위, 방문 수, 계정 연동 상태를 제품 화면에 사실처럼 표시하는 용도로 사용하지 않는다.

새 repository 작업은 다음 순서를 따른다.

1. domain 모델과 interface를 정의한다.
2. Fake 구현으로 도메인·화면 행동을 검증한다.
3. 같은 테스트 가능한 계약에 Supabase 구현을 연결한다.
4. Release 구성에서 실제 구현이 선택되는지 검증한다.

## 서버 경계

- 앱은 publishable key와 카카오로 인증된 회원 JWT만 사용한다.
- service-role key, TourAPI key, 동기화 토큰은 Supabase Edge Function 밖으로 노출하지 않는다.
- 도장 대상은 `stamp_spots`, 사용자 수집 기록은 RLS가 적용된 `collected_stamps`가 정본이다.
- 추천·도장 수집·목록 조회는 migration으로 관리되는 RPC 계약을 사용한다.
- TourAPI raw 응답은 Edge Function에서 검증·정규화한 뒤 DB에 저장한다.

계약을 바꿀 때는 Dart repository 테스트, pgTAP, 로컬 Auth→RPC smoke를 함께 갱신한다.
