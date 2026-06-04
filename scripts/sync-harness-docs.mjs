#!/usr/bin/env node
// 정본 (AGENTS.md / CLAUDE.md / .ai-skills/) 에서 벤더별 미러를 생성한다.
//
// 정본 → 미러:
//   AGENTS.md            → .github/copilot-instructions.md
//                        → .cursor/rules/01-agents.mdc (alwaysApply)
//   .ai-skills/<name>.md → .cursor/rules/skill-<name>.mdc (description-based load)
//
// 사용:
//   node scripts/sync-harness-docs.mjs          # 미러 생성/갱신
//   node scripts/sync-harness-docs.mjs --check  # 미러가 정본과 일치하는지 검사 (CI). 차이 있으면 exit 1.
//
// 미러는 절대 직접 편집하지 않는다. 모든 변경은 정본 → 본 스크립트 → 미러 순서.
//
// 관련: .ai-skills/git-workflow.md, AGENTS.md "Quality gate"

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const isCheckMode = process.argv.includes('--check');

const MIRROR_HEADER = (sources) =>
  [
    '<!--',
    '  ⚠️  AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.',
    '',
    '  본 파일은 다음 정본에서 자동 생성됩니다:',
    ...sources.map((s) => `    - ${s}`),
    '',
    '  수정 흐름:',
    '    1. 위 정본 파일 수정',
    '    2. `npm run sync:docs` 실행',
    '    3. 정본 + 미러를 한 PR 에 함께 commit',
    '',
    '  CI 의 `sync:docs:check` 가 정본과 미러 사이의 drift 를 차단합니다.',
    '-->',
    '',
  ].join('\n');

/**
 * Cursor `.mdc` 프론트매터를 만든다.
 * @param {{description?: string, globs?: string[], alwaysApply?: boolean}} opts
 */
function mdcFrontmatter({ description, globs, alwaysApply }) {
  const lines = ['---'];
  if (description) lines.push(`description: ${JSON.stringify(description)}`);
  if (globs && globs.length) lines.push(`globs: ${JSON.stringify(globs)}`);
  if (typeof alwaysApply === 'boolean') lines.push(`alwaysApply: ${alwaysApply}`);
  lines.push('---');
  return lines.join('\n') + '\n\n';
}

/** YAML 프론트매터에서 description / triggers 만 추출 (간단 파서) */
function extractSkillMeta(markdown) {
  const m = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { description: '', triggers: [] };
  const fm = m[1];
  const descMatch = fm.match(/^description:\s*(.+)$/m);
  const description = descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, '') : '';
  const triggers = [];
  const trigSection = fm.match(/^triggers:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (trigSection) {
    for (const line of trigSection[1].split('\n')) {
      const t = line.match(/^\s+-\s+(.+)$/);
      if (t) triggers.push(t[1].trim());
    }
  }
  return { description, triggers };
}

/** 본 스크립트가 생성할 모든 미러의 (path → contents) 매핑 계산 */
async function buildMirrors() {
  const out = new Map();

  const agentsPath = join(ROOT, 'AGENTS.md');
  const agentsBody = await readFile(agentsPath, 'utf8');
  const sourcesAgents = ['AGENTS.md'];

  // 1. .github/copilot-instructions.md
  out.set(join(ROOT, '.github/copilot-instructions.md'), MIRROR_HEADER(sourcesAgents) + agentsBody);

  // 2. .cursor/rules/01-agents.mdc — alwaysApply, AGENTS 본문 그대로
  out.set(
    join(ROOT, '.cursor/rules/01-agents.mdc'),
    MIRROR_HEADER(sourcesAgents) +
      mdcFrontmatter({
        description: 'Stampy 공통 에이전트 계약 (invariants / file ownership / quality gate)',
        alwaysApply: true,
      }) +
      agentsBody,
  );

  // 3. .cursor/rules/skill-<name>.mdc — 각 skill 1개
  const skillsDir = join(ROOT, '.ai-skills');
  const skillFiles = (await readdir(skillsDir))
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort();

  for (const file of skillFiles) {
    const src = join(skillsDir, file);
    const body = await readFile(src, 'utf8');
    const { description, triggers } = extractSkillMeta(body);
    const name = basename(file, '.md');
    const target = join(ROOT, '.cursor/rules', `skill-${name}.mdc`);

    // Cursor description: triggers 정보를 자연어로 합침 (Cursor 가 컨텍스트 매칭에 사용)
    const cursorDescription =
      description + (triggers.length ? `\n트리거: ${triggers.join(' / ')}` : '');

    out.set(
      target,
      MIRROR_HEADER([`.ai-skills/${file}`]) +
        mdcFrontmatter({
          description: cursorDescription,
          alwaysApply: false,
        }) +
        body,
    );
  }

  return out;
}

async function ensureDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

async function readMaybe(filePath) {
  if (!existsSync(filePath)) return null;
  return readFile(filePath, 'utf8');
}

async function main() {
  const mirrors = await buildMirrors();
  let drift = 0;

  for (const [path, expected] of mirrors) {
    const actual = await readMaybe(path);
    const same = actual !== null && actual === expected;
    const relPath = relative(ROOT, path);

    if (isCheckMode) {
      if (!same) {
        drift += 1;
        console.error(`✖ drift: ${relPath} — 정본과 다름. \`npm run sync:docs\` 후 commit 하세요.`);
      }
    } else {
      if (same) {
        console.log(`= unchanged: ${relPath}`);
      } else {
        await ensureDir(path);
        await writeFile(path, expected);
        console.log(`✔ wrote:     ${relPath}`);
      }
    }
  }

  if (isCheckMode) {
    if (drift === 0) {
      console.log(`✓ all ${mirrors.size} mirror(s) up to date`);
      process.exit(0);
    } else {
      console.error(`\n${drift} mirror(s) out of sync.`);
      process.exit(1);
    }
  } else {
    console.log(`\nDone. ${mirrors.size} mirror(s) processed.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
