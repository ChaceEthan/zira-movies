import tseslint from 'typescript-eslint';

export default tseslint.config(...tseslint.configs.recommended, {
  files: ['src/**/*.{ts,tsx}'],
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-constant-condition': 'error',
    'no-duplicate-imports': 'error',
    'no-unreachable': 'error',
  },
});