import { factory } from '../../../packages/core/lib/index';

const createPrism = factory<any, any, any, any, any>({
  config: {},
});

export function hello(value: string) {
  return createPrism().process(value);
}
