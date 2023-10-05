const projectDefault = {
  moduleNameMapper: {
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
