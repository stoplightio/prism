jest.mock('../utils/configMergerFactory');

import { factory } from '../factory';
import { createLogger } from '../logger';
import { configMergerFactory } from '../utils/configMergerFactory';

const logger = createLogger('TEST', { enabled: false });

describe('graph', () => {
  test('component functions pass the default component to user provided overrides', async () => {
    let defaultLoaderId = 0;
    let customLoaderId = 0;

    const createInstance = factory<any, any, any, any, { id: number }>(undefined, {
      // the default loader, what implementations of prism define (prism-http, etc)
      loader: {
        load: async opts => {
          defaultLoaderId = opts && opts.id ? opts.id : 0;
          return [];
        },
      },
    });

    /**
     * the user imports createInstance from an implementation (like prism-http)
     * when creating an instance, the user can override any of the components, and receive the default component
     * as an argument
     */
    const prism = createInstance(undefined, {
      logger,
      loader: {
        load: async (opts, defaultLoader) => {
          /**
           * end user can call, or not call, the parent loader
           * calling it will invoke the default load function above, setting defaultLoaderId
           * this allows one to hook before and after components functions are run,
           * and add their own custom logic, change the options passed through, or skip altogether
           */
          if (defaultLoader) {
            await defaultLoader.load(opts);
          }

          customLoaderId = opts && opts.id ? opts.id : 0;

          return [];
        },
      },
    });

    await prism.load({
      id: 123,
    });

    expect(defaultLoaderId).toEqual(123);
    expect(customLoaderId).toEqual(123);
  });

  test('load calls loader and sets resources', async () => {
    const createInstance = factory<any, any, any, any, { id: number }>(undefined, {
      loader: {
        load: async opts => {
          return [opts ? opts.id : 0];
        },
      },
    });

    const prism = await createInstance();

    await prism.load({
      id: 123,
    });

    const { resources } = prism;
    expect(resources).toEqual([123]);
  });

  describe('process', () => {
    describe('config resolution', () => {
      /**
       * the user imports createInstance from an implementation (like prism-http)
       * when creating an instance, the user can override any of the components, and receive the default component
       * as an argument
       */
      test('custom config function should merge over default config', async () => {
        const mergedConfig = {};
        const configMergerStub = jest.fn().mockResolvedValue(mergedConfig);
        (configMergerFactory as jest.Mock).mockReturnValue(configMergerStub);

        const input = {};
        const defaultConfig = { test: 'default' };
        const customConfig = { test: 'custom' };
        const paramConfig = { test: 'param' };
        const createInstance = factory<any, any, any, any, any>(defaultConfig, {});
        const prism = await createInstance(customConfig);

        await prism.load();
        await prism.process(input, paramConfig);

        expect(configMergerFactory).toHaveBeenCalledTimes(1);
        expect(configMergerFactory).toHaveBeenCalledWith(defaultConfig, customConfig, paramConfig);
        expect(configMergerStub).toHaveBeenCalledTimes(1);
        expect(configMergerStub).toHaveBeenCalledWith(input);
      });
    });
  });
});
