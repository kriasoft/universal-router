module.exports = {
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        optionalDependencies: false,
        peerDependencies: false,
      },
    ],
    'no-console': 'off',
  },
}
