module.exports = {
  root: true,
  env: { es2022: true, node: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: [
    '/design/**',
    '/design_repo/**',
    '/flutter_app/**',
    '/repo/**',
    '/supabase/functions/**',
  ],
};
