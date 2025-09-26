import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'test/**/*.mjs'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parser: typescriptParser,
      globals: globals.node,
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json'],
        },
      },
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          groups: ['type', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroupsExcludedImportTypes: ['type'],
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  prettierConfig,
];
