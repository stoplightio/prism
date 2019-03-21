import { PrismConfig, PrismConfigFactory } from '../types';

export function resolveConfig<Config, Input>(
  input: Input,
  config: PrismConfig<Config, Input>,
  defaultConfig?: PrismConfig<Config, Input>
): Config {
  if (typeof config === 'function') {
    // config factory function
    return (config as PrismConfigFactory<Config, Input>)(input, defaultConfig);
  }
  return config;
}
