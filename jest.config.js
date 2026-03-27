const { pathsToModuleNameMapper } = require('ts-jest');
const path = require('path');
const { mapValues } = require('lodash');
const { compilerOptions } = require('./packages/tsconfig.test');

const tsJestOptions = {
  tsconfig: '<rootDir>/packages/tsconfig.test.json',
};

const projectDefault = {
  moduleNameMapper: {
    ...mapValues(pathsToModuleNameMapper(compilerOptions.paths), v => path.resolve(path.join('packages', v))),
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!@faker-js/faker)'],
};

module.exports = {
  projects: [
    {
      ...projectDefault,
      displayName: 'HTTP-SERVER',
      testMatch: ['<rootDir>/packages/http-server/src/**/__tests__/*.*.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', tsJestOptions],
        '^.+\\.js$': ['ts-jest', { ...tsJestOptions, tsconfig: { allowJs: true } }],
      },
    },
    {
      ...projectDefault,
      displayName: 'HTTP',
      testMatch: ['<rootDir>/packages/http/src/**/__tests__/*.*.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', tsJestOptions],
        '^.+\\.js$': ['ts-jest', { ...tsJestOptions, tsconfig: { allowJs: true } }],
      },
    },
    {
      ...projectDefault,
      displayName: 'CORE',
      testMatch: ['<rootDir>/packages/core/src/**/__tests__/*.*.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', tsJestOptions],
        '^.+\\.js$': ['ts-jest', { ...tsJestOptions, tsconfig: { allowJs: true } }],
      },
    },
    {
      ...projectDefault,
      displayName: 'CLI',
      testMatch: ['<rootDir>/packages/cli/src/**/__tests__/*.*.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', tsJestOptions],
        '^.+\\.js$': ['ts-jest', { ...tsJestOptions, tsconfig: { allowJs: true } }],
      },
    },
  ],
  collectCoverageFrom: ['**/src/**/*.{ts,tsx}', '!**/src/**/__tests__/**/*.{ts,tsx}'],
};
