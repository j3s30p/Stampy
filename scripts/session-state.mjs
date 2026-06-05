#!/usr/bin/env node
// AI 가 세션 시작 시 1회 실행. "지금 어디 / 다음 무엇" 의 durable state 만 출력.
//
// 의도적으로 안 넣는 것:
//   - 시계열 history (git log / 머지 시간순)
//   - 일정·마감·우선순위 큐
//   - "다음에 X 해라" 강제 추천
//
// 박제하는 것: branch + open PRs + open issues by milestone + closed milestones + vendor-neutral conventions.
//
// 토큰 효율: 총 ~30줄 출력. 같은 정보를 gh 명령 4번 따로 부르면 200+ 줄 + 4 tool call.
//
// 관련: CLAUDE.md "세션 시작 절차", AGENTS.md "Work tracking", .ai-skills/git-workflow.md.

import { execSync } from 'node:child_process';

const REPO = 'j3s30p/Stampy';

const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    throw new Error(`shell failed: ${cmd}\n${err.stderr || err.message}`);
  }
};
const json = (cmd) => JSON.parse(sh(cmd));

function checkPrereqs() {
  try {
    sh('git rev-parse --git-dir');
  } catch {
    console.error('✖ git 저장소가 아닙니다.');
    process.exit(2);
  }
  try {
    sh('gh --version');
  } catch {
    console.error('✖ gh CLI 가 설치되어 있지 않습니다. https://cli.github.com/');
    process.exit(2);
  }
  try {
    sh('gh auth status');
  } catch {
    console.error('✖ gh CLI 가 인증되지 않았습니다. `gh auth login` 후 다시 실행.');
    process.exit(2);
  }
}

function gather() {
  // branch + working tree
  const branch = sh('git branch --show-current');
  let ahead = 0;
  let behind = 0;
  try {
    sh('git fetch origin main --quiet');
    const counts = sh('git rev-list --left-right --count origin/main...HEAD').split(/\s+/);
    behind = Number(counts[0] || 0);
    ahead = Number(counts[1] || 0);
  } catch {
    // origin/main 없거나 fetch 실패 — 무시
  }
  const dirty = sh('git status --porcelain').length > 0;

  // open PRs
  const prs = json(
    'gh pr list --state open --json number,title,mergeStateStatus,headRefName,milestone,statusCheckRollup --limit 30',
  );

  // milestones — open & closed
  const openMs = json(`gh api repos/${REPO}/milestones?state=open&per_page=50`);
  const closedMs = json(`gh api repos/${REPO}/milestones?state=closed&per_page=50`);

  // labeled issues
  const inProgress = json(
    'gh issue list --state open --label status/in-progress --json number,title --limit 30',
  );
  const blocked = json(
    'gh issue list --state open --label status/blocked --json number,title --limit 30',
  );
  const noMilestone = json(
    'gh issue list --state open --search "no:milestone" --json number,title --limit 30',
  );

  return {
    branch,
    ahead,
    behind,
    dirty,
    prs,
    openMs,
    closedMs,
    inProgress,
    blocked,
    noMilestone,
  };
}

function fmtPr(pr) {
  const ms = pr.milestone ? pr.milestone.title.split(':')[0] : 'no milestone';
  const checks = pr.statusCheckRollup || [];
  const ok = checks.filter((c) => c.conclusion === 'SUCCESS').length;
  const tot = checks.length;
  const checksTxt = tot ? `checks: ${ok}/${tot}` : 'checks: pending';
  return [
    `  #${pr.number}  [${pr.mergeStateStatus}]  ${pr.title}`,
    `         milestone: ${ms} · ${checksTxt} · head: ${pr.headRefName}`,
  ].join('\n');
}

function fmtMs(ms) {
  const short = ms.title.split(':')[0];
  return `  #${ms.number.toString().padStart(2)}  ${short.padEnd(12)}  ${ms.open_issues} open / ${ms.closed_issues} closed   ${ms.title}`;
}

function render(g) {
  const lines = [];
  lines.push('=== Stampy session state ===');
  lines.push('');

  // branch
  const branchSuffix = [
    g.ahead > 0 ? `${g.ahead} ahead` : null,
    g.behind > 0 ? `${g.behind} behind origin/main` : null,
    g.dirty ? 'dirty working tree' : null,
  ]
    .filter(Boolean)
    .join(', ');
  lines.push(`Branch   ${g.branch}${branchSuffix ? ` (${branchSuffix})` : ''}`);
  lines.push('');

  // open PRs
  lines.push(`Open PRs (${g.prs.length})`);
  if (g.prs.length === 0) lines.push('  — none');
  else g.prs.forEach((p) => lines.push(fmtPr(p)));
  lines.push('');

  // open milestones
  lines.push(`Open milestones (${g.openMs.length})`);
  if (g.openMs.length === 0) lines.push('  — none');
  else g.openMs.forEach((m) => lines.push(fmtMs(m)));
  lines.push('');

  // labels
  lines.push(`In-progress (status/in-progress label): ${g.inProgress.length}`);
  g.inProgress.forEach((i) => lines.push(`  #${i.number}  ${i.title}`));
  lines.push(`Blocked     (status/blocked label):     ${g.blocked.length}`);
  g.blocked.forEach((i) => lines.push(`  #${i.number}  ${i.title}`));
  lines.push(`Unmilestoned open issues:               ${g.noMilestone.length}`);
  g.noMilestone.forEach((i) => lines.push(`  #${i.number}  ${i.title}`));
  lines.push('');

  // closed milestones (just titles, no detail)
  lines.push(`Closed milestones (${g.closedMs.length})`);
  if (g.closedMs.length === 0) lines.push('  — none');
  else {
    const titles = g.closedMs.map((m) => `#${m.number} ${m.title.split(':')[0]}`).join(' · ');
    lines.push(`  ${titles}`);
  }
  lines.push('');

  // vendor-neutral conventions (한 묶음)
  lines.push('Conventions (vendor-neutral)');
  lines.push('  • main 직접 push 금지 — branch + PR + 사용자 머지');
  lines.push('  • Commit: Conventional Commits + scope (commitlint.config.js)');
  lines.push('  • PR 본문에 Closes #N (또는 Refs #N)');
  lines.push('  • 시계열 plan / ROADMAP / STATUS 파일 만들지 않음 — GitHub state 가 정본');
  lines.push('');

  lines.push('Read next');
  lines.push('  • .ai-skills/<matching skill>  ← 작업 직전 1개만');
  lines.push('  • .ai-background/<영역>          ← 처음 만지는 영역 1회만');

  return lines.join('\n');
}

function main() {
  checkPrereqs();
  const g = gather();
  console.log(render(g));
}

main();
