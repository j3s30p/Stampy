// https://docs.expo.dev/guides/using-eslint/
// 룰 ID → 의도 → 수정 방안 매핑은 `.ai-skills/static-analysis-guide.md` 참조.
// 변경 시 AGENTS.md 의 invariants 와 동기 유지.
module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  ignorePatterns: [
    '/dist/*',
    '/.expo/*',
    '/node_modules/*',
    '/ios/*',
    '/android/*',
    '/web-build/*',
    '/repo/*',
    'expo-env.d.ts',
    // Auto-generated mirror docs (sync-harness-docs.mjs). 정본 수정 후 npm run sync:docs.
    '/.cursor/**',
    '/.github/copilot-instructions.md',
  ],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    },
  },
  rules: {
    'prettier/prettier': 'warn',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [
          { pattern: '@app/**', group: 'internal', position: 'before' },
          { pattern: '@features/**', group: 'internal' },
          { pattern: '@core/**', group: 'internal' },
          { pattern: '@shared/**', group: 'internal' },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    // AGENTS.md invariant: features 간 cross-import 금지 (ADR-004).
    // 위반 시 .ai-skills/static-analysis-guide.md 의 "stampy/no-cross-feature" 섹션 참조.
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          { target: './src/features/stamp', from: './src/features/map' },
          { target: './src/features/stamp', from: './src/features/tour' },
          { target: './src/features/map', from: './src/features/stamp' },
          { target: './src/features/map', from: './src/features/tour' },
          { target: './src/features/tour', from: './src/features/stamp' },
          { target: './src/features/tour', from: './src/features/map' },
        ],
      },
    ],

    // AGENTS.md invariant: shared/mocks 는 Mock*Repository / shared/mocks 내부 에서만 사용.
    // (override 에서 예외 처리)
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@shared/mocks', '@shared/mocks/*', '**/shared/mocks', '**/shared/mocks/*'],
            message:
              '@shared/mocks 는 Mock*Repository 에서만 import 허용. 위반 시 .ai-skills/mock-data-strategy.md 참조.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['*.tsx', '*.ts'],
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'warn',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
      },
    },
    {
      // Mock repository 와 mocks 디렉터리 자체는 mocks import 허용.
      files: ['src/**/Mock*Repository.ts', 'src/shared/mocks/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
