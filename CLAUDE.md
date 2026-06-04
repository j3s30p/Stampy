# CLAUDE.md — Stampy Claude 전용 운영 지침

> **Scope** — Claude Code / Claude Agent SDK 전용 확장. `AGENTS.md` 를 먼저 읽었다는 전제 위에 Claude 고유 도구·skill 호출·기억 사용 패턴만 얹는다.
> **Non-Goals** — 다른 벤더 에이전트 지침, 도메인 알고리즘 자체(`.ai-skills/`), 인간용 진입점(`README.md`).

## Inheritance

`AGENTS.md` 의 invariants / file ownership / branch / quality gate 는 그대로 적용된다. 본 문서와 충돌 시 **`AGENTS.md` 가 우선**한다.

## Skill 호출 우선순위

작업 종류 → 먼저 읽을 skill:

| 작업                   | Skill                                  |
| ---------------------- | -------------------------------------- |
| 거리/반경/도장 인증    | `.ai-skills/location-verification.md`  |
| TourAPI 호출·응답 처리 | `.ai-skills/tour-api-normalization.md` |
| 새 파일·심볼 이름 결정 | `.ai-skills/naming-conventions.md`     |
| WebView ↔ RN 메시지    | `.ai-skills/kakao-webview-bridge.md`   |
| ESLint/tsc 에러 해석   | `.ai-skills/static-analysis-guide.md`  |

해당 작업에 들어가기 **직전** 에 매칭되는 skill 을 읽는다. 미리 전체를 로드하지 않는다.

## Background 읽기 시점

새 영역(`features/stamp`, `features/map`, `features/tour`, `core/*`)을 처음 만질 때 `.ai-background/` 의 해당 주제 문서 1개를 읽고 시작한다. 작업 중에는 재참조하지 않는다.

## Tool usage (Claude Code)

- 파일 편집은 Edit/Write 직접 사용. `sed`/`awk` via Bash 금지.
- 셸은 패키지 설치·실행에만 Bash. `cd <repo>` 금지 (이미 working dir 이 루트).
- 독립 호출은 한 메시지에 묶어 병렬화.
- `repo/` 폴더는 공모전 기획 자료. 코드 작업 중 자동 인덱싱 대상에서 제외.

## 🚫 절대 금지 — 머지 / main 직접 변경

본 프로젝트는 솔로 + 팀원 1 단계라 branch protection 의 `required_approving_review_count` 가 0 이다. 이 의미는 _기술적으로는_ AI 가 만든 PR 을 AI 가 그대로 머지할 수 있다는 뜻이다. **그러나 그렇게 하면 안 된다.**

다음 명령은 어떠한 경우에도 실행하지 않는다:

| 금지 명령                                                                          | 이유                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------ |
| `gh pr merge`, `gh pr merge --auto`                                                | 인간 리뷰 없이 main 진입             |
| `git push origin main`, `git push origin master`                                   | PR 절차 우회 (pre-push hook 도 차단) |
| `git push --force` (어떤 브랜치든)                                                 | 히스토리 파괴, 리뷰 무력화           |
| `git push --no-verify`, `git commit --no-verify`                                   | hook 우회 = 가드레일 무력화          |
| `git merge origin/main` 후 push, `git rebase -i` 후 force-push                     | 같은 효과                            |
| branch protection / repo 설정 변경 (`gh api -X PUT/PATCH .../protection`, 룰 완화) | 안전망 자체를 약화                   |

**허용되는 흐름** (이것만):

1. 작업 브랜치 생성: `git checkout -b <area>/<slug>`
2. 변경·commit (hook 자동 적용)
3. `git push -u origin <area>/<slug>` (작업 브랜치만)
4. `gh pr create` 로 PR 생성 + 본문 작성
5. **PR URL 을 사용자에게 보고하고 멈춘다.** 머지는 사용자가 웹 UI 에서 클릭.

PR 후 CI 결과를 사용자에게 알려주거나, 리뷰 코멘트에 답하는 것은 OK. 머지 트리거만 금지.

### 예외 절차

가드레일 자체를 만지는 PR (예: branch protection 튜닝) 도 위 흐름을 동일하게 따른다. 자체 PR 을 자체 머지로 우회하지 않는다. 사용자 손이 거쳐야 한다.

## Memory hooks

다음을 감지하면 `memory/` 에 즉시 저장:

- 사용자가 "이렇게 하지 마" / "이 방향이 맞다" → `feedback`
- TourAPI / Kakao 에서 문서에 없는 동작 발견 → `reference`
- 공모전 일정·심사 기준·팀 결정 → `project`
- 사용자의 역할·숙련도·선호 → `user`

저장 전 [auto memory 가이드](#) 의 “저장 금지 항목” 체크리스트를 통과해야 한다 (코드 패턴·git 히스토리·일회성 디버깅은 저장하지 않는다).

## Stage 진행 규칙 (하네스 부트스트랩 중)

Stage 0 ~ 6 부트스트랩이 끝나기 전에는 **각 stage 종료 시 사용자 확인을 받고** 다음으로 진행한다. 자율로 다음 stage 로 건너뛰지 않는다.
