module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: [ 'react' ],
  rules: {
    'no-console': 'off',
    'react/prop-types': 'off'
  },
  settings: {
    react: { version: 'detect' }
  }
};

// Allow jest globals in test files and ignore unused args starting with _
module.exports.overrides = [
  {
    files: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    env: { jest: true },
  },
  {
    files: ['**/*.js'],
    rules: {
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
    }
  }
];
