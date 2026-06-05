---
name: git-workflow
description: 브랜치 생성·commit·push·draft PR 까지 모든 git/gh 명령에 적용되는 절차와 금지 사항. AI 는 draft PR 생성/업데이트까지 기본 수행하되 main 직접 변경 / PR ready 전환 / PR 자체 머지 / hook 우회 어떤 형태로든 하지 않는다.
triggers:
  - git commit / git push / git merge / git rebase / git reset / git revert
  - gh pr create / gh pr merge / gh pr close
  - gh api 로 branches/protection 등 repo 설정 변경
  - 브랜치 생성·전환·삭제
  - commit 메시지 작성 또는 amend
  - main / master 브랜치 관련 작업
owner-paths:
  - '*'
---

## Intent

본 프로젝트는 솔로 + 팀원 1 단계라 branch protection 의 `required_approving_review_count` 가 0 이다. 즉 _기술적으로는_ AI 가 만든 PR 을 AI 토큰으로 그대로 머지할 수 있다. 본 skill 은 그렇게 하지 않도록 절차와 금지 명령을 박제한다. 또 검증된 작은 작업 단위마다 commit + 작업 브랜치 push + draft PR 을 남겨 세션이 끊겨도 GitHub 에서 바로 diff 를 볼 수 있게 한다.

## 허용되는 흐름 (이것만)

```
1. git checkout -b <area>/<slug>        # 브랜치 생성 (네이밍은 아래 표 참조)
2. (변경 작업)
3. git add <specific files>             # git add -A / git add . 지양
4. git commit -m "<type>(<scope>): ..." # hook 자동 적용
5. git push -u origin <area>/<slug>     # 작업 브랜치만 push
6. gh pr create --draft ...             # PR 이 없으면 draft 로 생성
7. PR URL / commit hash / 검증 결과 보고 # ← AI 작성자의 기본 종착점
```

PR 이 이미 있으면 새 commit push 로 PR 을 갱신한다. PR ready 전환 / PR 머지 / 코멘트 응답은 사용자가 지시할 때만 한다. AI 는 기본적으로 검증된 작업 단위를 commit + push + draft PR 로 남기고, PR URL / commit hash / branch / 검증 결과를 보고한다.

## 절대 금지 명령

| 금지 명령                                                                     | 이유                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------- |
| `gh pr merge`, `gh pr merge --auto`, `gh pr merge --squash` 등                | 인간 리뷰 없이 main 진입                 |
| `gh pr ready`, `gh pr ready --undo` 외 ready 상태 변경                        | 최종 리뷰 요청은 사용자 결정             |
| `git push origin main`, `git push origin master`                              | PR 절차 우회 (pre-push hook 도 차단)     |
| `git push --force`, `git push -f`, `git push --force-with-lease`              | 히스토리 파괴, 리뷰 무력화, PR diff 왜곡 |
| `git push --no-verify`, `git commit --no-verify`                              | hook 우회 = 가드레일 무력화              |
| `git commit --amend` 후 force-push                                            | 위와 같은 효과 (commit 추가로 진행)      |
| `git rebase -i` 후 force-push, `git reset --hard <past>`                      | 같은 효과                                |
| `gh api -X PUT/PATCH .../protection`, `gh api -X PATCH .../repos/...` 룰 완화 | 안전망 자체 약화                         |
| `git push origin :<branch>` (원격 브랜치 삭제), `git branch -D <protected>`   | 인간이 머지 후 자동 삭제하도록 둠        |

위 명령은 _어떤 이유로도_ 실행하지 않는다. 우회 필요해 보이는 상황을 만나면 사용자에게 보고하고 결정을 받는다.

## 브랜치 네이밍

`<area>/<short-slug>` — `<area>` 는 commit scope 와 동일.

| 예시                  | 설명                             |
| --------------------- | -------------------------------- |
| `stamp/collect-rule`  | features/stamp 영역 변경         |
| `map/marker-tap`      | features/map 영역                |
| `tour/api-mapper`     | features/tour 영역               |
| `core/haversine`      | core/location 등                 |
| `shared/ui-button`    | shared/ui-kit                    |
| `app/onboarding`      | app/ 라우트                      |
| `harness/eslint-rule` | ESLint/CI/Husky 등 인프라        |
| `docs/glossary`       | README/AGENTS/CLAUDE/docs/skills |
| `deps/expo-bump`      | 의존성 bump                      |

영문 슬러그, kebab-case, 의도 한 줄. 시간/이슈번호 prefix 금지 (히스토리는 git log 가 가짐).

## Commit 메시지 형식 (Conventional Commits + scope)

```
<type>(<scope>): <subject>

<body — WHY 중심, 1~3줄, 한 줄 200자 까지>

<footer — BREAKING CHANGE / Closes #N>
```

### 허용 type

`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `revert`

### 허용 scope (이 외 거부)

`stamp`, `map`, `tour`, `core`, `shared`, `app`, `harness`, `docs`, `deps`

### 헤더 규칙

- subject 소문자 시작 (한글 OK), 명령형 어조
- 헤더 100자 이내
- subject 끝에 마침표 금지

### 예시

✅ 통과:

```
feat(stamp): 100m 반경 도장 인증 use case 추가
fix(map): Kakao SDK autoload=false 누락 race 수정
chore(harness): ESLint stampy/no-raw-latlon 룰 추가
refactor(shared): Coordinates brand 타입 분리
chore(deps): expo SDK 52.0.5 → 52.1.0 bump
```

❌ 거부:

```
도장 추가                       # type 없음
feat: 도장 추가                 # scope 없음
feat(stamps): ...               # scope 'stamps' 미정의 (= 'stamp')
Feat(stamp): ...                # type 대문자
```

## Hook 자동 강제 지점

| Hook         | 시점                           | 동작                                                               |
| ------------ | ------------------------------ | ------------------------------------------------------------------ |
| `pre-commit` | `git commit`                   | `lint-staged` 가 staged 파일에 `eslint --fix` + `prettier --write` |
| `commit-msg` | `git commit`                   | `commitlint` 가 위 형식 검사                                       |
| `pre-push`   | `git push`                     | `refs/heads/main` 또는 `refs/heads/master` 로의 push 거부          |
| CI on PR     | draft PR 생성 / PR branch push | typecheck + lint + format check + commitlint (PR 의 모든 commit)   |

위 hook 의 어떤 실패도 commit/push 가 차단되어야 한다. 우회 (`--no-verify` 등) 는 위 "절대 금지 명령" 표 참조.

## 위반 시 흐름

### Commit hook 실패

1. 에러 메시지의 첫 줄에 룰 ID 또는 항목명이 있다.
2. ESLint / Prettier 위반이면 → [`static-analysis-guide`](../static-analysis-guide/SKILL.md) 의 표에서 룰 ID 검색.
3. commitlint 위반이면 → 본 skill 의 "Commit 메시지 형식" 으로 돌아가 다시 작성. `--amend` 해도 되지만 그 commit 이 아직 push 안 됐을 때만 (push 후 amend 는 force-push 가 필요해져 금지).
4. 자동 수정 가능하면 `npm run lint:fix` / `npm run format`.

### CI 실패

1. `gh run view --log-failed` 로 실패 단계 확인.
2. 로컬에서 `npm run quality:fast` 로 재현.
3. 같은 브랜치에 **새 commit 추가** 로 수정 (force-push 안 함).
4. PR 자동 갱신.

## 가드레일 자체를 만지는 PR 의 예외

ESLint 룰 / Husky hook / branch protection / 본 skill 변경 같은 _가드레일 자체_ PR 도 동일 워크플로우를 따른다. "자체 PR 을 자체 머지" 로 우회하지 않는다. 사용자 손으로 머지한다.

## 관련 문서

- 강제 검사 명세: `AGENTS.md` "Quality gate" 섹션
- 룰 ID 별 의도: `skills/static-analysis-guide/SKILL.md`
- ADR (왜 이 워크플로우): `docs/02-architecture-decisions.md` ADR-008 + 본 PR (`harness/lock-ai-merge`)
