import { PrismConfig, PrismConfigFactory } from '../types';

function isPrismConfigFactory<C, I>(val: PrismConfig<C, I>): val is PrismConfigFactory<C, I> {
  return typeof val === 'function';
}

export function resolveConfig<Config, Input>(
  input: Input,
  config: PrismConfig<Config, Input>,
  defaultConfig?: PrismConfig<Config, Input>
): Config {
  if (isPrismConfigFactory<Config, Input>(config)) {
    return config(input, defaultConfig);
  }

  return config;
}
