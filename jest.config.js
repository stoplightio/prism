const moduleNameMapper = {
  '@stoplight/prism-core': '<rootDir>/packages/core/src',
  '@stoplight/prism-core/(.*)': '<rootDir>/packages/core/src/$1',
  '@stoplight/prism-cli': '<rootDir>/packages/cli/src',
  '@stoplight/prism-cli/(.*)': '<rootDir>/packages/cli/src/$1',
  '@stoplight/prism-http': '<rootDir>/packages/http/src',
  '@stoplight/prism-http/(.*)': '<rootDir>/packages/http/src/$1',
  '@stoplight/prism-http-server': '<rootDir>/packages/http-server/src',
  '@stoplight/prism-http-server/(.*)': '<rootDir>/packages/http-server/src/$1',
};

const projectDefault = {
  moduleNameMapper,
  transformIgnorePatterns: ['node_modules', 'lib'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'jsx', 'ts', 'tsx'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  }
};

module.exports = {
  projects: [
    {
      ...projectDefault,
      displayName: 'HTTP-SERVER',
      testMatch: ['<rootDir>/packages/http-server/src/**/__tests__/*.(spec|unit|int|func).(ts)?(x)'],
      globals: {
        'ts-jest': {
          tsConfig: '<rootDir>/packages/http-server/tsconfig.json',
        },
      },
    },
    {
      ...projectDefault,
      displayName: 'HTTP',
      testMatch: ['<rootDir>/packages/http/src/**/__tests__/*.(spec|unit|int|func).(ts)?(x)'],
      globals: {
        'ts-jest': {
          tsConfig: '<rootDir>/packages/http/tsconfig.json',
        },
      },
    },
    {
      ...projectDefault,
      displayName: 'CORE',
      testMatch: ['<rootDir>/packages/core/src/**/__tests__/*.(spec|unit|int|func).(ts)?(x)'],
      globals: {
        'ts-jest': {
          tsConfig: '<rootDir>/packages/core/tsconfig.json',
        },
      },
    },
    {
      ...projectDefault,
      displayName: 'CLI',
      testMatch: ['<rootDir>/packages/cli/src/**/__tests__/*.(spec|unit|int|func).(ts)?(x)'],
      globals: {
        'ts-jest': {
          tsConfig: '<rootDir>/packages/cli/tsconfig.json',
        },
      },
    },
  ],
  collectCoverageFrom: [
    '**/src/**/*.{ts,tsx}',
    '!example/**',
    '!**/lib/**',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/types.ts',
  ],
};
