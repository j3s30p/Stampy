# Memory policy — Claude Code 전용

> Claude Code 의 `memory/` 시스템에 무엇을 어떻게 저장할지 정의. **저장 판단 직전에만 읽으면 된다.**

## 언제 저장하나

다음 패턴을 감지하면 즉시 저장:

- **`feedback`** — 사용자가 "이렇게 하지 마" / "이 방향이 맞다" / 같은 결정을 두 번째로 정정
- **`reference`** — TourAPI / Kakao 같은 외부 시스템에서 _문서에 없는_ 동작 발견
- **`project`** — 공모전 일정·심사 기준·팀 결정 (시간 의존 사실)
- **`user`** — 사용자의 역할·숙련도·선호

## 저장 금지 항목 (체크리스트)

저장 전 다음 중 하나라도 해당하면 **저장하지 않는다**:

- [ ] 코드 패턴·아키텍처·파일 경로 — `git ls-files`, `AGENTS.md` 에 이미 있다
- [ ] git 히스토리·commit 메시지·머지 시점 — `git log` 가 정본
- [ ] 일회성 디버깅·임시 작업 상태 — 세션 안에서만 쓰임
- [ ] CLAUDE.md / AGENTS.md / skills/ 에 이미 박힌 규칙
- [ ] 코드만 봐도 자명한 것 (예: "TypeScript 쓴다")

## 형식

`~/.claude/projects/-Users-j3s30p-playdata-contest-stampy/memory/<topic>.md` 에 단일 파일:

```markdown
---
name: <kebab-case-slug>
description: <한 줄 — 미래 세션에서 트리거 판단용>
metadata:
  type: feedback | reference | project | user
---

**Rule / Fact** — (한 줄)

**Why** — (한 줄 — 근거. 사용자 발화 인용 권장)

**How to apply** — (적용 조건·예외)

관련: [[other-memory-name]]
```

`MEMORY.md` 인덱스에도 한 줄 추가 (150자 이하).

## 핵심 원칙

- **`Why`는 필수** — 단순 규칙만 적으면 미래에 적용 경계 판단 불가
- **두 번 들으면 저장** — 한 번은 우연일 수 있다
- **출처 인용** — 사용자 발화를 일부 포함하면 권한 신뢰도 ↑
- **중복 검사** — 새로 쓰기 전 기존 메모리 검색
