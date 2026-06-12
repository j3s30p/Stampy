# Stampy

> 위치 기반 관광 도장 수집 앱. 사용자가 한국관광공사 TourAPI 관광지에 실제 방문(GPS 100m 이내)했음을 검증하고 디지털 도장을 수집한다.

**이 문서의 역할** — 사람이 처음 보는 진입점.
**Non-Goals** — 에이전트 지침은 [`AGENTS.md`](./AGENTS.md), Claude 전용 운영은 [`CLAUDE.md`](./CLAUDE.md), 도메인 규칙은 [`skills/`](./skills/), 결정 배경은 [`docs/`](./docs/)에 분리되어 있다.

## Stack

- React Native + Expo SDK 52 + TypeScript (strict)
- Expo Router (typed routes, 파일 기반)
- Kakao Maps via `react-native-webview`
- 한국관광공사 TourAPI (KorService2)

## Layout (Feature-Sliced)

```
app/                       # Expo Router 라우트 (엔트리만)
src/
  features/
    stamp/  { ui, model, api }   # 도장 수집
    map/    { ui, model, api }   # Kakao WebView
    tour/   { ui, model, api }   # TourAPI
  core/     { auth, network, location, storage }
  shared/   { ui, types, utils, config }
```

상세 의도는 [`docs/02-architecture-decisions.md`](./docs/02-architecture-decisions.md) 참조.

## Getting started

```sh
nvm use            # 20.18.0
cp .env.example .env   # TourAPI 키, Kakao JS 키 채우기
npm install
npm start
```

## First time on this repo?

처음 클론한 사람·AI 가 "지금 뭐가 돌아가는지" 5분 안에 파악하기 위한 진입점.

### 인간 (처음 보는 날)

1. 이 README — 스택 / 레이아웃 / Documentation map 훑기.
2. [`AGENTS.md`](./AGENTS.md) — invariants + Mock-first 작업 순서 + commit/branch 규약. **여기가 핵심 계약.**
3. [Milestones](https://github.com/j3s30p/Stampy/milestones) — 마일스톤별 진행 상태. closed = 완료, open = 진행/예정.
4. [Issues (open)](https://github.com/j3s30p/Stampy/issues) — 현재 할당된/대기 중인 작업. 본인 영역 라벨 (`area/<slug>`) 로 필터.
5. [Pull Requests (open)](https://github.com/j3s30p/Stampy/pulls) — 머지 대기 중인 변경.
6. 본인이 만질 영역의 [`docs/`](./docs/) 문서 1개 — _결정 배경_.

### AI 에이전트 (세션 시작 시)

1. `CLAUDE.md` (Claude) 또는 `AGENTS.md` (Codex) 자동 로드.
2. `npm run session` 한 줄로 현재 진행 상태 스냅샷.
3. 작업 직전에만 매칭되는 `skills/<name>/SKILL.md` 1개 정독.
4. 처음 영역 진입 시 `docs/<주제>` 1회.

## Work tracking

| 무엇이                        | 어디서                                                    |
| ----------------------------- | --------------------------------------------------------- |
| 큰 단위 진행 상태             | [Milestones](https://github.com/j3s30p/Stampy/milestones) |
| 개별 작업 / TODO / 버그       | [Issues](https://github.com/j3s30p/Stampy/issues)         |
| 진행 중 변경                  | [Pull Requests](https://github.com/j3s30p/Stampy/pulls)   |
| 영역 / 타입 / 우선순위 / 상태 | Labels (`area/*`, `type/*`, `priority/*`, `status/*`)     |

**모든 PR 은 관련 issue 를 닫는다** (`Closes #N` 본문 footer). issue 없는 PR 은 인플라이트 작업 추적 안 됨 → 가급적 먼저 issue 생성.

## Documentation map

| Audience                     | Document                 | Loaded             |
| ---------------------------- | ------------------------ | ------------------ |
| 사람                         | `README.md` (이 문서)    | GitHub front       |
| 모든 AI 에이전트 (공통 계약) | `AGENTS.md`              | 항상               |
| Claude Code 전용 진입점      | `CLAUDE.md`              | 항상 (Claude Code) |
| Claude Code 행동 규약        | `.claude/rules/*.md`     | 트리거 시          |
| 도메인 규칙 (호출형)         | `skills/<name>/SKILL.md` | 필요 시            |
| 결정 배경 (그라운딩)         | `docs/*.md`              | 영역 진입 시 1회   |

사용 도구는 **Claude Code + Codex** 만. Cursor / Copilot 등 다른 벤더용 미러는 두지 않는다 (필요 시 sync 재도입).
