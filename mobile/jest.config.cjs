module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/ui/**/*.test.tsx"],
  clearMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ["<rootDir>/tests/ui/setup.ts"],
};
