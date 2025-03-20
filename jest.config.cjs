/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = async () => {
  return {
    preset: "ts-jest",
    rootDir: "./",
    verbose: true,
    testEnvironment: "node",
    transformIgnorePatterns: ["node_modules/(?!(sc-common|jest-micro-auto-stub)/)"],
    transform: {
      "^.+\\.(ts|tsx)?$": ["ts-jest"],
      "^.+\\.js?$": "babel-jest",
    },
    preset: "ts-jest",
    coverageReporters: ["clover", "lcov", "text-summary", "cobertura", "text"],
    reporters: ["default", ["jest-junit", { outputDirectory: "coverage" }]],
    testResultsProcessor: "jest-sonar-reporter",
    collectCoverageFrom: ["src/**/*.ts"],
  };
};
