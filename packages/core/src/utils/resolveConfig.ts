import { PartialPrismConfig, PartialPrismConfigFactory } from '../types';

function isPrismConfigFactory<C, I>(val: PartialPrismConfig<C, I>): val is PartialPrismConfigFactory<C, I> {
  return typeof val === 'function';
}

export function resolveConfig<Config, Input>(
  input: Input,
  config: PartialPrismConfig<Config, Input>,
  defaultConfig?: PartialPrismConfig<Config, Input>,
): Partial<Config> {
  if (isPrismConfigFactory<Config, Input>(config)) {
    return config(input, defaultConfig);
  }

  return config as Partial<Config>;
}
