jest.mock('../utils/configMergerFactory');

import { factory } from '../factory';
import { configMergerFactory } from '../utils/configMergerFactory';

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
      const createInstance = factory<any, any, any, any>(defaultConfig, {});
      const prism = await createInstance(customConfig);

      await prism.process(input, [], paramConfig);

      expect(configMergerFactory).toHaveBeenCalledTimes(1);
      expect(configMergerFactory).toHaveBeenCalledWith(defaultConfig, customConfig, paramConfig);
      expect(configMergerStub).toHaveBeenCalledTimes(1);
      expect(configMergerStub).toHaveBeenCalledWith(input);
    });
  });
});
