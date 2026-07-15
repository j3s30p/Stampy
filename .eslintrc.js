// https://docs.expo.dev/guides/using-eslint/
// 프로젝트 경계와 mock 격리 규칙을 이 설정에서 직접 관리한다.
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
    '/supabase/functions/*',
    'expo-env.d.ts',
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

    // features 간 cross-import 금지 (ADR-004).
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

    // shared/mocks 는 Mock*Repository / shared/mocks 내부에서만 사용.
    // (override 에서 예외 처리)
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@shared/mocks', '@shared/mocks/*', '**/shared/mocks', '**/shared/mocks/*'],
            message: '@shared/mocks 는 Mock*Repository 에서만 import할 수 있습니다.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['supabase/tests/integration/*.mjs'],
      env: { node: true },
    },
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
