#!/usr/bin/env node
// Repository harness verifier. Keep this focused on contract drift, not app logic.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';

const root = process.cwd();

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const trackedFiles = sh('git ls-files -z')
  .split('\0')
  .filter(Boolean)
  .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('repo/'));

const textExtensions = new Set([
  '',
  '.cjs',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

const errors = [];
const warn = (message) => errors.push(message);

const stalePrefix = String.fromCharCode(46, 97, 105, 45);
const staleSkillDir = `${stalePrefix}skills`;
const staleBackgroundDir = `${stalePrefix}background`;
const staleSyncScript = ['sync', 'harness', 'docs'].join('-') + '.sh';
const stalePatterns = [staleSkillDir, staleBackgroundDir, staleSyncScript];

const read = (file) => readFileSync(join(root, file), 'utf8');

function checkStaleReferences() {
  for (const file of trackedFiles) {
    if (!textExtensions.has(extname(file))) continue;

    const content = read(file);
    for (const pattern of stalePatterns) {
      if (content.includes(pattern)) {
        warn(`${file}: stale harness reference "${pattern}"`);
      }
    }
  }
}

function checkForbiddenProgressFiles() {
  const forbidden = /(^|\/)(ROADMAP|STATUS|PROGRESS)(\.[^.\/]+)?$/i;
  for (const file of trackedFiles) {
    if (forbidden.test(file)) {
      warn(`${file}: progress-like files are forbidden; use GitHub Issues/Milestones/PRs`);
    }
  }
}

function checkMarkdownLinks() {
  const markdownFiles = trackedFiles.filter((file) => file.endsWith('.md'));
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const file of markdownFiles) {
    const content = read(file);
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const rawTarget = match[1]?.trim();
      if (!rawTarget) continue;
      if (/^(https?:|mailto:|app:\/\/|#)/.test(rawTarget)) continue;

      const targetWithoutAnchor = rawTarget.replace(/^<|>$/g, '').split('#')[0];
      if (!targetWithoutAnchor || targetWithoutAnchor.startsWith('#')) continue;

      const targetPath = normalize(join(root, dirname(file), targetWithoutAnchor));
      if (!targetPath.startsWith(root) || !existsSync(targetPath)) {
        warn(`${file}: broken markdown link "${rawTarget}"`);
      }
    }
  }
}

function checkCodeowners() {
  const file = '.github/CODEOWNERS';
  const content = read(file);
  const requiredPaths = ['/docs/', '/skills/', '/.claude/', '/scripts/'];

  if (content.includes('<') || content.includes('>')) {
    warn(`${file}: placeholder owner syntax remains`);
  }

  for (const requiredPath of requiredPaths) {
    if (!content.includes(requiredPath)) {
      warn(`${file}: missing owner rule for ${requiredPath}`);
    }
  }
}

function checkSkillFrontmatter() {
  const skillFiles = trackedFiles.filter((file) => /^skills\/[^/]+\/SKILL\.md$/.test(file));
  const requiredKeys = ['name:', 'description:', 'triggers:', 'owner-paths:'];
  const removedKeys = ['status:', 'filled-in-stage:'];

  for (const file of skillFiles) {
    const content = read(file);
    const frontmatter = content.startsWith('---') ? (content.split('---')[1] ?? '') : '';

    if (!frontmatter) {
      warn(`${file}: missing YAML frontmatter`);
      continue;
    }

    for (const key of requiredKeys) {
      if (!frontmatter.includes(key)) {
        warn(`${file}: frontmatter missing ${key}`);
      }
    }

    for (const key of removedKeys) {
      if (frontmatter.includes(key)) {
        warn(`${file}: obsolete frontmatter key ${key}`);
      }
    }
  }
}

function checkCriticalInvariants() {
  const constants = read('src/shared/config/constants.ts');
  if (!/STAMP_RADIUS_METERS\s*=\s*100\b/.test(constants)) {
    warn('src/shared/config/constants.ts: STAMP_RADIUS_METERS must be exactly 100');
  }

  const packageJson = JSON.parse(read('package.json'));
  const dependencyNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  const bannedKakaoNativePatterns = [
    /react-native.*kakao/i,
    /@react-native-seoul\/kakao/i,
    /kakao.*maps.*sdk/i,
  ];

  for (const dependencyName of dependencyNames) {
    if (bannedKakaoNativePatterns.some((pattern) => pattern.test(dependencyName))) {
      warn(`package.json: Kakao native SDK dependency is forbidden: ${dependencyName}`);
    }
  }

  const srcFiles = trackedFiles.filter((file) => /^src\/.*\.(ts|tsx)$/.test(file));
  for (const file of srcFiles) {
    const content = read(file);

    if (file !== 'src/shared/types/coordinates.ts') {
      if (/\b(latitude|longitude)\s*:\s*number\b/.test(content)) {
        warn(`${file}: latitude/longitude must use branded Latitude/Longitude types`);
      }
      if (/\b(latitude|longitude)\s*:\s*-?\d+(\.\d+)?\b/.test(content)) {
        warn(`${file}: raw numeric coordinate literal must use asLatitude/asLongitude`);
      }
    }

    if (!file.startsWith('src/features/tour/api/')) {
      if (/\b(mapx|mapy|contenttypeid|contentid|addr1|firstimage)\b/.test(content)) {
        warn(`${file}: raw TourAPI DTO fields must not escape src/features/tour/api`);
      }
    }

    for (const line of content.split('\n')) {
      if (
        line.includes('eslint-disable') &&
        !/eslint-disable-next-line\s+\S+\s+--\s+\S+/.test(line)
      ) {
        warn(`${file}: eslint-disable requires rule id and one-line reason`);
      }
      if (line.includes('@ts-ignore')) {
        warn(`${file}: @ts-ignore is forbidden; use @ts-expect-error with TS code and reason`);
      }
      if (line.includes('@ts-expect-error') && !/@ts-expect-error\s+TS\d+\s+--\s+\S+/.test(line)) {
        warn(`${file}: @ts-expect-error requires TS code and one-line reason`);
      }
    }
  }
}

function main() {
  checkStaleReferences();
  checkForbiddenProgressFiles();
  checkMarkdownLinks();
  checkCodeowners();
  checkSkillFrontmatter();
  checkCriticalInvariants();

  if (errors.length > 0) {
    console.error('Harness check failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Harness check passed.');
}

main();
