#!/usr/bin/env node
// PreToolUse(Bash) guard — skills/git-workflow/SKILL.md "절대 금지 명령" 표의 기계적 강제판.
// .claude/settings.json 의 hooks 가 모든 Bash 호출 직전에 실행한다.
// stdin 으로 hook 입력 JSON 을 받아 금지 명령이면 exit 2 (stderr 가 모델에 피드백되고 호출이 차단된다).

import { readFileSync } from 'node:fs';

let command = '';
try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  command = input?.tool_input?.command ?? '';
} catch {
  // 입력 파싱 실패 시 차단하지 않는다 — guard 자체 버그로 모든 Bash 가 막히는 것 방지.
  process.exit(0);
}

// CMD — 단순 명령의 시작 위치(행 시작 / | ; & 뒤 / $( 뒤)에만 앵커링한다.
// gh issue/pr 본문이나 commit 메시지 *텍스트* 가 금지 명령을 언급하는 경우의 오탐 방지.
// [^\n|;&]* — 같은 단순 명령 안에서만 매칭 (파이프/세미콜론 너머의 우연한 토큰 오탐 방지).
// 한계(의도된 보수성): 따옴표 내부는 구분하지 않는다 — git 명령의 인자 문자열에
// 금지 플래그 리터럴이 들어가면 차단된다. 우회 여지를 줄이는 쪽을 택했다.
const CMD = String.raw`(?:^|[\n|;&]\s*|\$\(\s*)`;
const FORBIDDEN = [
  {
    pattern: new RegExp(CMD + String.raw`git\s[^\n|;&]*--no-verify\b`),
    reason: 'hook 우회(--no-verify) 금지',
  },
  {
    pattern: new RegExp(
      CMD + String.raw`git\s[^\n|;&]*\bpush\b[^\n|;&]*(--force(-with-lease)?\b|\s-f\b)`,
    ),
    reason: 'force-push 금지 — 히스토리 파괴/리뷰 무력화',
  },
  {
    pattern: new RegExp(CMD + String.raw`git\s[^\n|;&]*\breset\b[^\n|;&]*--hard\b`),
    reason: 'git reset --hard 금지 — 필요 시 사용자가 직접 실행한다',
  },
  {
    pattern: new RegExp(CMD + String.raw`gh\s+pr\s+merge\b`),
    reason: 'AI 의 PR 머지 금지 — 머지는 사용자가 한다',
  },
  {
    pattern: new RegExp(CMD + String.raw`gh\s+pr\s+ready\b`),
    reason: 'PR ready 전환은 사용자 결정',
  },
  {
    pattern: new RegExp(
      CMD + String.raw`gh\s+api\b[^\n|;&]*-X\s+(PUT|PATCH|DELETE)\b[^\n|;&]*protection`,
      'i',
    ),
    reason: 'branch protection 완화 금지 — 안전망 자체 약화',
  },
];

for (const { pattern, reason } of FORBIDDEN) {
  if (pattern.test(command)) {
    console.error(
      `BLOCKED: ${reason}. skills/git-workflow/SKILL.md "절대 금지 명령" 참조 — 우회하지 말고 사용자에게 보고할 것.`,
    );
    process.exit(2);
  }
}

process.exit(0);
