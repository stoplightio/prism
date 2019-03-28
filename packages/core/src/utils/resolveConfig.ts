import { PartialPrismConfig, PartialPrismConfigFactory } from '../types';

export async function resolveConfig<Config, Input>(
  input: Input,
  config: PartialPrismConfig<Config, Input>,
  defaultConfig?: PartialPrismConfig<Config, Input>
): Promise<Partial<Config>> {
  if (typeof config === 'function') {
    // config factory function
    return await (config as PartialPrismConfigFactory<Config, Input>)(input, defaultConfig);
  }
  return config;
}
