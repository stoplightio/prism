const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./packages/tsconfig');

const projectDefault = {
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
};

module.exports = {
  projects: [
    {
      ...projectDefault,
      displayName: 'HTTP-SERVER',
      testMatch: ['<rootDir>/packages/http-server/src/**/__tests__/*.ts'],
      globals: {
        'ts-jest': {
          tsConfig: '<rootDir>/packages/http-server/tsconfig.json',
        },
      },
    },
    {
      ...projectDefault,
      displayName: 'HTTP',
      testMatch: ['<rootDir>/packages/http/src/**/__tests__/*.ts'],
      globals: {
        'ts-jest': {
          tsConfig: '<rootDir>/packages/http/tsconfig.json',
        },
      },
    },
    {
      ...projectDefault,
      displayName: 'CORE',
      testMatch: ['<rootDir>/packages/core/src/**/__tests__/*.ts'],
      globals: {
        'ts-jest': {
          tsConfig: '<rootDir>/packages/core/tsconfig.json',
        },
      },
    },
    {
      ...projectDefault,
      displayName: 'CLI',
      testMatch: ['<rootDir>/packages/cli/src/**/__tests__/*.ts'],
      globals: {
        'ts-jest': {
          tsConfig: '<rootDir>/packages/cli/tsconfig.json',
        },
      },
    },
  ],
  collectCoverageFrom: [
    '**/src/**/*.{ts,tsx}',
  ],
};
