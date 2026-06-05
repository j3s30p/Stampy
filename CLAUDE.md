# CLAUDE.md — Stampy Claude 전용 운영 지침

> **Scope** — Claude Code / Claude Agent SDK 전용 확장. `AGENTS.md` 를 먼저 읽었다는 전제 위에 Claude 고유 도구·skill 호출·기억 사용 패턴만 얹는다.
> **Non-Goals** — 다른 벤더 에이전트 지침, 도메인 알고리즘 자체(`.ai-skills/`), 인간용 진입점(`README.md`).
> **이 파일은 정본 + Claude Code 전용**. 다른 벤더용 미러는 만들지 않는다 (Claude Code 가 직접 읽음). 본 파일을 수정하면 변경된 결정·정책이 다른 정본(`AGENTS.md`·`.ai-skills/`)과 충돌하지 않는지 같은 PR 에서 확인.

## Inheritance

`AGENTS.md` 의 invariants / file ownership / branch / quality gate 는 그대로 적용된다. 본 문서와 충돌 시 **`AGENTS.md` 가 우선**한다.

## 세션 시작 절차 (재진입 시 토큰 절약)

`CLAUDE.md` / `AGENTS.md` / memory 는 Claude Code 가 자동 로드한다. 그 위에 **한 줄** 로 현재 진행 상태 스냅샷.

```sh
npm run session
```

출력 형식과 의도는 `scripts/session-state.mjs` 주석 참조. 추가 deep-dive 필요 시 `gh pr view <N>` / `gh issue view <N>`. 채팅 히스토리·과거 PR 본문을 길게 다시 읽지 않는다 — 토큰 낭비.

스크립트는 CI 의 smoke test 로 항상 살아있음이 보장된다 (`.github/workflows/ci.yml`).

## Skill 호출 우선순위

작업 종류 → 먼저 읽을 skill:

| 작업                                                    | Skill                                  |
| ------------------------------------------------------- | -------------------------------------- |
| **git/gh 명령 작성 직전** (commit·push·PR·branch·merge) | `.ai-skills/git-workflow.md`           |
| 거리/반경/도장 인증                                     | `.ai-skills/location-verification.md`  |
| TourAPI 호출·응답 처리                                  | `.ai-skills/tour-api-normalization.md` |
| 새 파일·심볼 이름 결정                                  | `.ai-skills/naming-conventions.md`     |
| WebView ↔ RN 메시지                                     | `.ai-skills/kakao-webview-bridge.md`   |
| Mock fixture / Mock repository / DI swap                | `.ai-skills/mock-data-strategy.md`     |
| ESLint/tsc 에러 해석                                    | `.ai-skills/static-analysis-guide.md`  |

해당 작업에 들어가기 **직전** 에 매칭되는 skill 을 읽는다. 미리 전체를 로드하지 않는다.

## Background 읽기 시점

새 영역(`features/stamp`, `features/map`, `features/tour`, `core/*`)을 처음 만질 때 `.ai-background/` 의 해당 주제 문서 1개를 읽고 시작한다. 작업 중에는 재참조하지 않는다.

## Tool usage (Claude Code)

- 파일 편집은 Edit/Write 직접 사용. `sed`/`awk` via Bash 금지.
- 셸은 패키지 설치·실행에만 Bash. `cd <repo>` 금지 (이미 working dir 이 루트).
- 독립 호출은 한 메시지에 묶어 병렬화.
- `repo/` 폴더는 공모전 기획 자료. 코드 작업 중 자동 인덱싱 대상에서 제외.

## Memory hooks

다음을 감지하면 `memory/` 에 즉시 저장:

- 사용자가 "이렇게 하지 마" / "이 방향이 맞다" → `feedback`
- TourAPI / Kakao 에서 문서에 없는 동작 발견 → `reference`
- 공모전 일정·심사 기준·팀 결정 → `project`
- 사용자의 역할·숙련도·선호 → `user`

저장 전 [auto memory 가이드](#) 의 “저장 금지 항목” 체크리스트를 통과해야 한다 (코드 패턴·git 히스토리·일회성 디버깅은 저장하지 않는다).

## Stage 진행 규칙 (하네스 부트스트랩 중)

Stage 0 ~ 6 부트스트랩이 끝나기 전에는 **각 stage 종료 시 사용자 확인을 받고** 다음으로 진행한다. 자율로 다음 stage 로 건너뛰지 않는다. 현재까지의 Stage 완료 상태는 **GitHub Milestones** (closed = 완료) 가 정본.
