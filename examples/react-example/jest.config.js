module.exports = {
  testMatch: ['<rootDir>/**/*.spec.(ts)?(x)'],
  transform: {
    '.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};
