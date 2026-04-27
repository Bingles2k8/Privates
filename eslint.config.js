// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const noNetworkRule = {
  'no-restricted-globals': [
    'error',
    {
      name: 'fetch',
      message:
        'Privates is offline-only in v1. Network calls must live under src/net/ (currently empty).',
    },
    {
      name: 'XMLHttpRequest',
      message: 'Privates is offline-only in v1. No XHR allowed.',
    },
    {
      name: 'WebSocket',
      message: 'Privates is offline-only in v1. No WebSockets allowed.',
    },
    {
      name: 'EventSource',
      message: 'Privates is offline-only in v1. No SSE allowed.',
    },
  ],
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'axios',
          message: 'Privates is offline-only. Do not import axios.',
        },
      ],
    },
  ],
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', 'ios/*', 'android/*'],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    ignores: ['src/net/**'],
    rules: noNetworkRule,
  },
]);
