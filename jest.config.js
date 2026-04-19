/** @type {import('jest').Config} **/
export default {
  clearMocks: true,
  testEnvironment: 'jsdom',
  transform: {
    '^.+.tsx?$': ['ts-jest'],
  },
};
