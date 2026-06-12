# Tool usage — Claude Code 전용

> Claude Code 의 도구 (Edit/Write/Bash 등) 사용 규약. **매 세션 자동 로드된다** — 별도로 읽지 않는다. 항상 컨텍스트에 있으므로 본문은 짧게 유지한다.

## 파일 편집

- `Edit` / `Write` 직접 사용
- `sed` / `awk` via Bash **금지** — 변경 추적·되돌리기 어려움
- 새 파일은 `Write`, 기존 파일은 `Edit` 우선 (diff 만 전송)
- 동일 파일 여러 곳 수정은 `Edit` 의 여러 번 호출

## Bash

- 패키지 설치 / 셸 명령 전용
- **`cd <repo>` 금지** — working dir 이 이미 루트
- 절대 경로 사용 (상대 경로보다 안전)
- 한 메시지에 독립 호출은 병렬화

## 병렬화

독립 호출은 한 메시지의 여러 tool call 로 묶는다:

```
read A + read B + grep C   ← 한 번에
```

의존 호출은 순차:

```
read package.json → edit package.json   ← 순차 필수
```

## repo/ 폴더

공모전 기획 자료 (PDF, 목업 HTML). **자동 인덱싱·grep·read 대상에서 제외**. 사용자가 명시적으로 가리킨 경우만 read.

## 금지

- `--no-verify`, `--force` 류 — `skills/git-workflow/SKILL.md` 참조
- `git reset --hard` (사용자 명시 지시 외)
- 백그라운드 데몬 시작 후 미관리

## 권장

- 변경 후 `npm run quality:fast` 한 번
- 큰 변경은 TaskCreate 로 분해
- 사용자 확인이 필요한 액션은 묻고 진행
