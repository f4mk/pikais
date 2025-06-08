import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';

export default [
  {
    ignores: ['node_modules/**', 'build/**', 'dist/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'simple-import-sort': simpleImportSortPlugin,
      'prettier': prettierPlugin,
    },
    rules: {
      // ESLint core rules
      'no-unused-vars': 'off',
      'no-duplicate-imports': 'error',
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/type-annotation-spacing': ['error', {
        before: false,
        after: true,
        overrides: {
          arrow: { before: true, after: true }
        }
      }],
      '@typescript-eslint/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'semi',
          requireLast: true
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        }
      }],

      // Import sorting rules
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^@?\\w'],
            ['^\\u0000'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
  prettierConfig,
]; 