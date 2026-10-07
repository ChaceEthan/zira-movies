import tseslint from 'typescript-eslint';

export default tseslint.config(...tseslint.configs.recommended, {
  files: ['**/*.{ts,tsx}'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'no-constant-condition': 'error',
    'no-duplicate-imports': 'error',
    'no-unreachable': 'error',
  },
}, {
  files: ['**/*.cjs'],
  rules: { '@typescript-eslint/no-require-imports': 'off' },
});