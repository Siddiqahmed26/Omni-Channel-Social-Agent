export default {
  preset: "ts-jest/presets/default-esm",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@anthropic-ai/sdk/lib/transform-json-schema$": "<rootDir>/node_modules/@anthropic-ai/sdk/lib/transform-json-schema.js",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  setupFiles: ["dotenv/config", "./jest.setup.cjs"],
  passWithNoTests: true,
  testTimeout: 20_000,
};
