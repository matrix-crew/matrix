export default {
  '*.{ts,tsx}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `eslint --fix ${filenames.join(' ')}`,
    'pnpm type-check',
  ],
  '*.{json,md,yml,yaml,css}': ['prettier --write'],
};
