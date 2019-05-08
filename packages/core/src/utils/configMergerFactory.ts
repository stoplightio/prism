import { compact, merge } from 'lodash';
import { PartialPrismConfig, PrismConfig, PrismConfigFactory, resolveConfig } from '..';

/**
 * Merges all passed configs. Each next config wil override each previous config.
 */

export function configMergerFactory<C, I>(
  baseConfig: PrismConfig<C, I>,
  ...configs: Array<PartialPrismConfig<C, I> | undefined>
): PrismConfigFactory<C, I> {
  return (input: I, defaultConfig?: PartialPrismConfig<C, I>): C => {
    const resolvedConfigs =
      // remove any falsy resolved configs
      compact(
        // remove falsy config props
        compact([baseConfig, ...configs])
          // resolve each config (resolveConfig is async)
          .map(c => resolveConfig(input, c, defaultConfig)),
      );

    if (!resolvedConfigs.length) {
      throw new Error('All configurations passed to the factory are undefined.');
    }

    // merge the configs over each other, in order
    return merge({}, ...resolvedConfigs);
  };
}
