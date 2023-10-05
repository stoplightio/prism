const { pathsToModuleNameMapper } = require('ts-jest/utils');
const path = require('path');
const { mapValues } = require('lodash');
const { compilerOptions } = require('./packages/tsconfig.test');

const projectDefault = {
  moduleNameMapper: {
    ...mapValues(pathsToModuleNameMapper(compilerOptions.paths), v => path.resolve(path.join('packages', v))),

    // KLUDGE: What we'd import by default here (and seem to successfully use
    // from outside Jest runs) is `json-schema-faker/dist/index.cjs`, but that
    // file *seems* to export an undefined value
    // (`require('main.cjs').default`).  We still don't know why this works
    // outside of Jest, but "skipping over" the index.cjs file fixes the problem
    // inside Jest.
    'json-schema-faker': 'json-schema-faker/dist/main.cjs',
  },
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
      testMatch: ['<rootDir>/packages/http-server/src/**/__tests__/*.*.ts'],
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/packages/tsconfig.test.json',
        },
      },
    },
    {
      ...projectDefault,
      displayName: 'HTTP',
      testMatch: ['<rootDir>/packages/http/src/**/__tests__/*.*.ts'],
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/packages/tsconfig.test.json',
        },
      },
    },
    {
      ...projectDefault,
      displayName: 'CORE',
      testMatch: ['<rootDir>/packages/core/src/**/__tests__/*.*.ts'],
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/packages/tsconfig.test.json',
        },
      },
    },
    {
      ...projectDefault,
      displayName: 'CLI',
      testMatch: ['<rootDir>/packages/cli/src/**/__tests__/*.*.ts'],
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/packages/tsconfig.test.json',
        },
      },
    },
  ],
  collectCoverageFrom: ['**/src/**/*.{ts,tsx}', '!**/src/**/__tests__/**/*.{ts,tsx}'],
};
