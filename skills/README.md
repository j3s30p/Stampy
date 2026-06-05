# skills/ — 호출형 도메인 규칙 인덱스

> **Scope** — 작업 직전에 매칭되는 1개를 읽고 따르는 호출형 규칙 집합. 각 skill 폴더 안의 `SKILL.md` 가 본문.
> **Non-Goals** — 결정 _배경_ 은 `docs/`. 코드 영역 _소유권_ 은 `AGENTS.md`. Claude 행동 규약은 `.claude/rules/`. 인간용 진입점은 `README.md`.

## Index

| Skill                                                        | Triggers (요약)                           | Owner paths |
| ------------------------------------------------------------ | ----------------------------------------- | ----------- |
| [`git-workflow/`](./git-workflow/SKILL.md)                   | git/gh 명령 (commit·push·PR·branch·merge) | 전 영역     |
| [`static-analysis-guide/`](./static-analysis-guide/SKILL.md) | ESLint/tsc 에러 해석, 룰 ID 추적          | 전 영역     |

## 새 skill 추가 시

도메인 영역의 작업이 _반복적으로 같은 결정_ 을 요구할 때만 skill 신설. **speculation 으로 frame 만 만들지 않는다** (사용자 피드백 `harness_focus`).

폴더 구조:

```
skills/<kebab-case-name>/
  SKILL.md         (본문, 아래 형식)
  <보조 파일들>    (선택: 스크립트, 픽스처, 예시)
```

SKILL.md 프론트매터:

```yaml
---
name: <kebab-case>
description: <한 줄 — 트리거 판단용>
triggers:
  - <키워드/패턴/작업 유형>
owner-paths:
  - <경로 글롭>
---
```
