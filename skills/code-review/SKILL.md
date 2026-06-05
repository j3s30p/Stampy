---
name: code-review
description: 작성자와 분리된 리뷰어 역할로, 파일을 수정하지 않고 버그·회귀·누락 테스트를 severity 순서로 지적하는 규약.
triggers:
  - "리뷰해줘", "코드리뷰", "수정하지 말고 봐줘"
  - PR / diff / branch 검토
  - AI 작성자가 구현한 변경의 1차 검토
owner-paths:
  - '*'
---

## Intent

리뷰어는 작성자가 아니다. 변경을 좋게 설명하는 대신, 머지 전에 막아야 할 문제를 찾는다. 본 skill 을 적용할 때는 명시 요청이 없는 한 파일을 수정하지 않는다.

## Review Order

1. 변경 범위와 의도를 파악한다.
2. `AGENTS.md` critical invariant 와 ownership 을 대조한다.
3. 관련 `docs/*.md` 또는 `skills/*/SKILL.md` 를 필요한 만큼만 확인한다.
4. 버그, 회귀, 경계 위반, 테스트 누락, 하네스 drift 를 찾는다.
5. findings 를 severity 순서로 보고한다.

## Output Shape

Findings 를 먼저 쓴다. 각 finding 은 다음 형식이다.

```text
[P1] 짧은 제목
파일:라인
왜 문제인지 / 어떤 상황에서 깨지는지 / 권장 조치
```

Severity 기준:

- `P0` — 머지하면 앱/CI/데이터가 즉시 크게 깨짐.
- `P1` — 실제 사용자 흐름, invariant, ownership, 보안/데이터 경계가 깨질 수 있음.
- `P2` — 유지보수성, 테스트 공백, edge case 위험.
- `P3` — 사소한 정리, 문구, polish.

## Rules

- findings 가 없으면 "중대한 문제 없음" 이라고 말하고 남은 리스크/테스트 공백을 적는다.
- 파일/라인 근거 없이 일반론만 말하지 않는다.
- 작성자 의도를 요약하더라도 findings 뒤에 둔다.
- 스타일 취향은 자동 포맷/디자인 시스템 위반이 아니면 낮은 우선순위로 둔다.
- 테스트를 실행했다면 명령과 결과를 명시한다. 실행하지 못했다면 이유를 말한다.
- 리뷰 도중 수정이 필요해 보여도, 사용자 요청 전에는 수정하지 않는다.

## Checklist

- `npm run quality:fast` / `npm run harness:check` 결과가 있는가?
- `AGENTS.md` invariant 를 건드리는가?
- feature 간 direct import 가 생겼는가?
- raw 좌표, raw TourAPI DTO, mock fixture leakage 가 생겼는가?
- PR 이 issue / area / scope 와 맞는가?
- 테스트 또는 수동 검증이 변경 위험에 비례하는가?
