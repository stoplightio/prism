import { configMergerFactory } from '../index';

describe('configMerger', () => {
  const input = {};
  const defaultConfig = {};

  test('should handle undefined configurations', () => {
    const configMerger = configMergerFactory<any, any>(undefined, undefined);
    return expect(() => configMerger(input, defaultConfig)).toThrowErrorMatchingSnapshot();
  });

  test('given one config object should return that object', () => {
    const configMerger = configMergerFactory<any, any>({
      x: 1,
      y: 2,
    });

    return expect(configMerger(input, defaultConfig)).toMatchSnapshot();
  });

  test('given one config object and some undefined should return that object', () => {
    const configMerger = configMergerFactory<any, any>(
      undefined,
      {
        x: 1,
        y: 2,
      },
      undefined
    );

    return expect(configMerger(input, defaultConfig)).toMatchSnapshot();
  });

  test('given two config objects should return a merged config', () => {
    const configMerger = configMergerFactory<any, any>(
      {
        mock: {
          a: 1,
          b: 2,
        },
        validate: {
          a: 1,
          b: 2,
        },
        alfa: false,
      },
      {
        mock: false,
        validate: {
          a: 3,
          c: 4,
        },
        beta: true,
      }
    );

    return expect(configMerger(input, defaultConfig)).toMatchSnapshot();
  });

  test('given config function and config object should merge', () => {
    const resolvedConfig = {
      mock: false,
      validate: {
        a: 3,
        c: 4,
      },
      beta: true,
    };
    const configFn = jest.fn().mockReturnValue(resolvedConfig);

    const configMerger = configMergerFactory<any, any>(
      {
        mock: {
          a: 1,
          b: 2,
        },
        validate: {
          a: 1,
          b: 2,
        },
        alfa: false,
      },
      configFn
    );

    expect(configMerger(input, defaultConfig)).toMatchSnapshot();
    expect(configFn).toHaveBeenCalledTimes(1);
    expect(configFn).toHaveBeenCalledWith(input, defaultConfig);
  });
});
