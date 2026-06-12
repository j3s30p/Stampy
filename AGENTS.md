# AGENTS.md — Stampy 에이전트 공통 계약

> **Scope** — 어떤 AI 에이전트(Codex, Claude, …)가 와도 가장 먼저 읽어야 할 벤더 중립 계약. 프로젝트의 도메인 invariants·코드 영역 소유권·협업 규약을 정의한다.
> **Non-Goals** — 인간용 진입점([`README.md`](./README.md)), Claude 전용 도구·기억 사용법([`CLAUDE.md`](./CLAUDE.md)), 도메인 알고리즘 자체([`skills/`](./skills/)), 결정 배경([`docs/`](./docs/)).

## Project mission

한국관광공사 TourAPI + Kakao Maps 기반으로, 사용자가 관광지에 실제 방문했음을 위치(GPS)로 인증하면 도장을 수집하는 모바일 앱.

## Critical invariants (모든 에이전트가 지켜야)

1. **도장 인증 반경은 100m 고정** (`@shared/config` → `STAMP_RADIUS_METERS`). 관광지 발견/추천 조회 반경은 별도 상수 (`TOUR_DISCOVERY_RADIUS_METERS`, `TOUR_DISCOVERY_LIMIT`)로 분리해 사용한다.
2. **좌표는 branded `Latitude` / `Longitude` 만 사용**. raw `number` 로 위경도를 다루지 않는다. 변환은 `@shared/types` 의 `asLatitude` / `asLongitude`.
3. **Kakao Maps 는 WebView 경유 한정**. 네이티브 SDK 도입 금지 — Expo Managed 유지.
4. **TourAPI 응답은 진입 즉시 도메인 타입으로 정규화**. raw DTO/snake_case 필드를 `features/tour/api`·`features/event/api` 바깥으로 노출 금지.
5. **ESLint 룰 위반 suppress 금지**. 정당한 예외라도 룰 ID 와 근거 주석 필요 ([`skills/static-analysis-guide/SKILL.md`](./skills/static-analysis-guide/SKILL.md)).

## File ownership (병렬 PR 충돌 회피)

| Area                                                      | Touch when                                                | Phase 1 owner        |
| --------------------------------------------------------- | --------------------------------------------------------- | -------------------- |
| `app/`                                                    | 라우트 추가/수정                                          | **Frontend**         |
| `src/features/stamp/ui/`, `model/`                        | 도장 수집·인증 UI/도메인                                  | **Frontend**         |
| `src/features/stamp/api/`                                 | `StampRepository` interface + `MockStampRepository`       | **Frontend**         |
| `src/features/map/`                                       | Kakao WebView 브리지·마커 표현                            | **Frontend**         |
| `src/features/tour/ui/`, `model/`                         | 관광지 카드·검색 UI/도메인                                | **Frontend**         |
| `src/features/tour/api/` interface + Mock                 | `TourRepository` interface + `MockTourRepository`         | **Frontend**         |
| `src/features/tour/api/Http*Repository.ts` (real impl)    | TourAPI HTTP 호출·DTO 매핑                                | **Backend teammate** |
| `src/features/event/api/`                                 | `EventRepository` + `HttpEventRepository`                 | **Backend teammate** |
| `src/core/network/`                                       | HTTP 클라이언트·재시도                                    | **Backend teammate** |
| `src/core/location/`                                      | GPS·권한·Haversine                                        | **Frontend**         |
| `src/core/storage/` interface + Mock                      | `StorageRepository` interface + Mock                      | **Frontend**         |
| `src/core/storage/AsyncStorage*Repository.ts` (real impl) | AsyncStorage·키 네임스페이스                              | **Backend teammate** |
| `src/core/auth/` interface + Mock                         | `AuthRepository` interface + Mock                         | **Frontend**         |
| `src/core/auth/Http*Repository.ts` (real impl)            | 사용자 식별·세션                                          | **Backend teammate** |
| `src/shared/`                                             | brand 타입, 상수, ui-kit                                  | **Frontend**         |
| `src/shared/mocks/`                                       | 모든 fixture 데이터 (production import 금지, ESLint 강제) | **Frontend**         |
| `app.json`, `package.json`, harness 스크립트              | 단독 PR 권장                                              | **Frontend**         |

**Phase 1 분담 원칙** — 프론트(사용자)는 모든 repository **interface 와 Mock 구현체** 를 정의하고 UI 를 단독 진행. 백엔드(팀원)는 같은 인터페이스에 대해 **real impl** 만 추가하며 도메인 타입(`TourSpot` 등)을 그대로 따른다. 상세는 [`docs/04-team-split-and-mocks.md`](./docs/04-team-split-and-mocks.md).

**크로스-feature 의존 금지**: `features/A` 가 `features/B` 를 import 하지 않는다. 공유가 필요해지면 `core/` 또는 `shared/` 로 끌어올린다 (ESLint 경계 룰로 강제).

## Codex 작업 루프

Codex 전용 5.5 ↔ mini 분업 루프는 [`CODEX.md`](./CODEX.md) 에 있다. **Codex 만 읽는다** — 다른 에이전트(Claude 등)는 무시한다.

## Branch / commit convention

- 브랜치: `<area>/<short-slug>` — 예: `stamp/collect-rule`, `map/marker-tap`, `harness/restructure`.
- 커밋: Conventional Commits — `feat(stamp): …`, `fix(map): …`, `chore(harness): …`.
- `<area>` 는 위 ownership 표 첫 컬럼 슬러그를 따른다.

상세: [`skills/git-workflow/SKILL.md`](./skills/git-workflow/SKILL.md).

## Quality gate (모든 PR 통과 필수)

### 명령

| 명령                    | 검사                                                  | 언제 실행               |
| ----------------------- | ----------------------------------------------------- | ----------------------- |
| `npm run quality:fast`  | `tsc --noEmit` + ESLint + Prettier check              | 커밋 전·PR 올리기 전·CI |
| `npm test`              | jest 단위 테스트 (core/shared 순수 로직 행동 검증)    | PR 올리기 전·CI         |
| `npm run quality`       | `quality:fast` + `test` + `harness:check` 전체        | PR 올리기 직전 1회      |
| `npm run lint:fix`      | ESLint 자동 수정 (import/order, type-imports 등)      | 위반 시 1차 시도        |
| `npm run format`        | Prettier 자동 수정                                    | 포맷 위반 시            |
| `npm run harness:check` | 하네스 문서·링크·CODEOWNERS·핵심 invariant drift 검사 | 하네스 변경 시·CI       |
| `npm run session`       | 현재 진행 상태 스냅샷                                 | 세션 시작 / 막힐 때     |

### 자동 강제 지점

- **pre-commit hook** (Husky) — `lint-staged` 가 변경된 파일만 `eslint --fix` + `prettier --write`. 실패 시 commit 차단.
- **commit-msg hook** — `commitlint` 가 Conventional Commits + scope 강제 (`feat(stamp): …`). 실패 시 commit 차단.
- **pre-push hook** — main / master 로의 직접 push 차단.
- **Claude PreToolUse guard** (`.claude/settings.json` → `scripts/claude-guard.mjs`) — git-workflow 의 절대 금지 명령(`--no-verify`, force-push, `git reset --hard`, `gh pr merge/ready`, branch protection 완화)을 Bash 실행 직전에 차단.
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — PR 단위로 `quality:fast` + `harness:check` + commit 메시지 lint + session smoke. 실패 시 머지 차단.

### 앱 화면 검증 원칙

- Stampy 는 **React Native + Expo 모바일 앱**이다. UI/동작 검증 완료 기준은 **반드시 iOS Simulator 또는 Android Emulator** 실행 결과다.
- `expo start --web`, 브라우저, 인앱 브라우저, localhost web preview 는 빠른 렌더링 참고용일 뿐이다. **웹 preview 만으로 앱 구현/검증 완료라고 보고하지 않는다.**
- UI 변경, Kakao Maps WebView, 위치 권한/GPS, safe area, 탭 전환, long press/haptics 등 모바일 런타임에 의존하는 흐름은 simulator 에서 확인해야 한다.
- simulator 실행이 환경 문제로 불가능하면, “simulator 미검증”이라고 명시하고 어떤 명령이 실패했는지 보고한다. 이 경우 검증 상태를 web 확인과 구분해서 적는다.
- 기본 실행 명령은 `npm run ios` 또는 `npm run android` 이다. 포트/캐시 문제가 있으면 `npm run start -- --clear` 후 Expo CLI 에서 `i` 또는 `a` 로 simulator 를 연다.

### 위반 시 어디서 찾나

ESLint 룰 ID 또는 tsc TS 코드 → [`skills/static-analysis-guide/SKILL.md`](./skills/static-analysis-guide/SKILL.md) 의 표에서 _권장 수정_ 와 _관련 skill_ 확인. suppress 가 정당한 경우 규약(`eslint-disable-next-line <id> -- <근거>`) 따라 작성.

## How to find domain rules

- **호출형 skill** — 작업 직전에 매칭되는 1개만 읽는다. 인덱스: [`skills/README.md`](./skills/README.md).
- **그라운딩 문서** — 새 영역을 처음 만질 때 1회 통독. 위치: [`docs/`](./docs/).

## Work tracking — 진행 상태 / 다음 할 일

세션이 끊겨도 / 다른 모델로 바꿔도 / 팀원이 git pull 해도 같은 컨텍스트로 재진입할 수 있도록 **GitHub 의 Issues + Milestones + Labels** 가 단일 사실 출처다. 별도 ROADMAP/STATUS 파일은 의도적으로 두지 않는다 (drift 방지).

- **세션 시작 시 한 줄**: `npm run session` — branch / open PR / open milestone / labels 스냅샷.
- **Milestones** — 마일스톤 단위. closed = 완료, open = 진행/예정.
- **Issues** — 개별 작업 / 버그 / TODO. 라벨: `area/<slug>` × `type/*` × `priority/*` × `status/*`.
- **Pull Requests** — 진행 중인 변경. **모든 PR 은 본문 footer 에 `Closes #<issue>` 또는 `Refs #<issue>` 명시**. issue 없는 PR 은 사후 추적 불가 → 가급적 issue 부터 만든다 (단, 명백한 작은 chore 는 PR 만 OK).
- 새 PR 의 area 슬러그 (branch / commit scope) 는 issue 의 `area/*` 라벨과 일치해야 한다.

### 의도적으로 만들지 않는 것

- ❌ `ROADMAP.md` / `STATUS.md` / `PROGRESS.md` 류 파일 — GitHub state 와 drift 확정
- ❌ 일자별 plan / 시계열 / 일일 standup 양식 / 스프린트 회고록
- ❌ 마감일 / 우선순위 정렬 / 백로그 큐 — 사용자 의사 결정 영역
- ❌ "다음에 X 해라" 자동 추천 — AI 가 사용자와 논의해서 정한다

이슈가 단일 사실 출처. timeline 의 유혹이 들면 본 섹션을 다시 본다.

## 정본 / 미러

다른 벤더로의 미러는 의도적으로 두지 않는다. 본 프로젝트는 **Claude Code + Codex 만 사용**.

- Claude Code → `CLAUDE.md` + `.claude/rules/*.md` 자동 로드. `AGENTS.md` 는 자동 로드되지 **않으므로** `CLAUDE.md` 의 `@AGENTS.md` import 로 포함한다 (import 존재는 `harness:check` 가 검사).
- Codex → `AGENTS.md` 자동 로드 (본 파일 그대로) + 작업 루프는 [`CODEX.md`](./CODEX.md)

Cursor/Copilot/Continue 등 다른 도구가 필요해지면 그때 sync 스크립트 재도입.
