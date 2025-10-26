import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

const combinedRules = {
  ...js.configs.recommended.rules,
  ...react.configs.recommended.rules,
  ...reactHooks.configs['recommended-latest'].rules,
  ...reactRefresh.configs.vite.rules,
  ...prettier.rules,
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react/jsx-props-no-spreading': 'off',
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: combinedRules,
  },
])
