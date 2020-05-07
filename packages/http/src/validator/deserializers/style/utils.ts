import { Dictionary } from '@stoplight/types';

export function createObjectFromKeyValList(items: string[]) {
  return items.reduce((obj: Dictionary<unknown>, item, i) => {
    if (i % 2 === 0) {
      obj[item] = undefined;
    } else {
      obj[items[i - 1]] = item;
    }

    return obj;
  }, {});
}
