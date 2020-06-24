module.exports = {
  roots: ['<rootDir>'],
  testEnvironment: 'jsdom',
  testRegex: ['.*\\.test\\.[jt]sx?$'],
  transformIgnorePatterns: ['node_modules/(?!(fp-ts/es6)/)'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'ts-jest',
  },
  clearMocks: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
