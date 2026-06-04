# .ai-skills/ — 호출형 도메인 규칙 인덱스

> **Scope** — 작업 직전에 매칭되는 1개를 읽고 따르는 호출형 규칙 집합. 각 skill 은 _언제 읽는지_(triggers) 와 _어떤 결정을 강제하는지_(rules) 를 함께 담는다.
> **Non-Goals** — 결정 _배경_ 은 `.ai-background/`. 코드 영역 _소유권_ 은 `AGENTS.md`. 인간용 진입점은 `README.md`.

## Index

| Skill                                                      | Triggers (요약)                             | Owner paths                                               | 채움 단계 |
| ---------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- | --------- |
| [`location-verification.md`](./location-verification.md)   | 거리 계산, 도장 인증, GPS 권한              | `src/core/location/`, `src/features/stamp/`               | Stage 2   |
| [`tour-api-normalization.md`](./tour-api-normalization.md) | TourAPI 호출, 응답 DTO → 도메인 매핑        | `src/features/tour/api/`, `src/features/tour/model/`      | Stage 2   |
| [`naming-conventions.md`](./naming-conventions.md)         | 새 파일·심볼·이벤트 명명                    | 전 영역                                                   | Stage 2   |
| [`kakao-webview-bridge.md`](./kakao-webview-bridge.md)     | WebView ↔ RN postMessage 설계               | `src/features/map/`                                       | Stage 2   |
| [`mock-data-strategy.md`](./mock-data-strategy.md)         | Mock fixture 작성, Mock repository, DI swap | `src/shared/mocks/`, `Mock*Repository.ts`, `src/core/di/` | Stage 2   |
| [`static-analysis-guide.md`](./static-analysis-guide.md)   | ESLint/tsc 에러 해석, 룰 ID 추적            | 전 영역                                                   | Stage 3   |

## Skill 파일 형식 (Stage 5 verifier 가 검사)

```yaml
---
name: <kebab-case>
description: <한 줄 요약 — 트리거 판단용>
triggers:
  - <키워드/패턴/작업유형>
owner-paths:
  - <경로>
status: stub | active
filled-in-stage: <number>
---
```
