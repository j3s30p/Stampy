---
name: naming-conventions
description: 파일·심볼·이벤트·테스트의 명명 규칙. FSD segment 별 접미사, 도메인 용어 통일, 영문/한글 사용 경계를 정의한다.
triggers:
  - 새 파일 / 컴포넌트 / 훅 / 유즈케이스 생성
  - 심볼 rename / 도메인 용어 결정
  - 이벤트 / 분석 키 / 스토리지 키 명명
owner-paths:
  - '*'
status: stub
filled-in-stage: 2
---

## Intent

용어가 흔들리면 검색이 안 되고, 검색이 안 되면 중복이 생긴다. 본 skill 은 “스팟 vs 장소 vs 관광지”, “collect vs verify”, “bridge vs webview” 같은 동의어 충돌을 사전에 끊는다.

## To be filled in Stage 2

- 도메인 용어 사전 (스팟=Spot, 도장=Stamp, 인증=Verification 등) — `.ai-background/01-domain-glossary.md` 와 cross-link
- FSD segment 별 접미사: `*Screen.tsx` (app/), `*View.tsx` (features ui/), `use*.ts` (hooks), `*Repository.ts`, `*Mapper.ts`, `*Dto.ts`
- 한글 식별자 금지, UI 문자열은 한글 OK
- 이벤트/스토리지 키 prefix: `stampy:stamp:collected`, `stampy:storage:auth_token`
- 테스트: `*.test.ts` (단위), `*.integration.test.ts` (네트워크 포함)
