module.exports = {
  extends: ['airbnb-base', 'plugin:jest/recommended', 'plugin:prettier/recommended'],
  rules: {
    'no-nested-ternary': 'off',
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['router', 'error'],
      },
    ],
    'no-plusplus': 'off',
    'no-use-before-define': 'off',
    'default-param-last': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.js'],
      },
    },
  },
  overrides: [
    {
      files: ['**/*.ts'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'import/extensions': [
          'error',
          'ignorePackages',
          {
            ts: 'never',
          },
        ],
      },
    },
    {
      files: ['**/*.test.ts'],
      env: {
        jest: true,
      },
    },
  ],
}
