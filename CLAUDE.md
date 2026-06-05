# CLAUDE.md — Stampy Claude Code 진입점

> **역할**: Claude Code 세션의 진입점. 본 파일은 _언제 어디를 읽는지_ 만 둔다.
> **Non-Goals**: 벤더 중립 계약(`AGENTS.md`), 도메인 알고리즘(`skills/`), 결정 배경(`docs/`), 인간용(`README.md`).
> 본 파일은 Claude Code 가 자동 로드한다. 다른 벤더(Codex 등)는 `AGENTS.md` 만 본다.

## Inheritance

`AGENTS.md` 가 invariants / file ownership / quality gate / branch / commit 규약의 정본. 본 파일과 충돌 시 `AGENTS.md` 우선.

## 매 세션 시작

```sh
npm run session
```

채팅 히스토리·과거 PR 본문을 길게 다시 읽지 않는다 (토큰 낭비). deep-dive 필요 시 `gh pr view <N>` / `gh issue view <N>`.

## 어디를 언제 읽나

| 트리거                                    | 읽을 파일                                             |
| ----------------------------------------- | ----------------------------------------------------- |
| 새 영역 진입 (`features/<X>`, `core/<X>`) | `docs/<주제>` 1회                                     |
| 작업 직전 (도메인 규칙 필요)              | `skills/<name>/SKILL.md` (인덱스: `skills/README.md`) |
| git/gh 명령 작성 직전                     | `skills/git-workflow/SKILL.md`                        |
| ESLint / tsc 에러 만남                    | `skills/static-analysis-guide/SKILL.md`               |
| 기억 저장 판단 직전                       | `.claude/rules/memory-policy.md`                      |
| Edit/Write/Bash 사용 직전 (세션 첫 회)    | `.claude/rules/tool-usage.md`                         |

작업에 들어가기 **직전** 에 매칭되는 파일 1개만 읽는다. 미리 전체 로드 X.
