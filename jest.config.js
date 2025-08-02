module.exports = {
  // Test environment
  testEnvironment: "node",

  // Test file patterns
  testMatch: ["**/tests/**/*.test.js", "**/?(*.)+(spec|test).js"],

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    "src/lib/**/*.js",
    "src/cli/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
  ],

  // Setup and teardown
  setupFilesAfterEnv: [],

  // Module paths
  moduleFileExtensions: ["js", "json"],

  // Test timeout (30 seconds)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Error reporting
  errorOnDeprecated: true,

  // Watch mode settings
  watchPathIgnorePatterns: ["/node_modules/", "/coverage/", "/bin/"],
};
