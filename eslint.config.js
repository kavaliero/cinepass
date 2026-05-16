import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    // Fichiers/dossiers totalement ignores par ESLint
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.next/**',
      '**/prisma/migrations/**',
      'apps/api/prisma/data/**',
      'pnpm-lock.yaml',
      // Scripts standalone (Node, pas besoin de TS-aware lint)
      'scripts/**/*.mjs',
      'apps/api/scripts/**/*.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: { react: { version: 'detect' } },
  },
  // Fichiers hors tsconfig principal (seed Prisma, tests, configs) :
  // on les lint quand meme mais sans projectService (juste parsing).
  {
    files: [
      '**/*.config.{js,ts,mjs,cjs}',
      '**/vite.config.ts',
      '**/vitest.config.ts',
      '**/tailwind.config.{js,ts}',
      '**/postcss.config.{js,ts}',
      'apps/api/prisma/**/*.ts',
      'apps/api/tests/**/*.ts',
      'apps/web/tests/**/*.{ts,tsx}',
      'e2e/**/*.ts',
    ],
    languageOptions: {
      parserOptions: { projectService: false, project: null },
    },
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
