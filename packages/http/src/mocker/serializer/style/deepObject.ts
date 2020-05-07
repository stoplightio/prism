import { Dictionary } from '@stoplight/types';

export function serializeWithDeepObjectStyle(name: string, value: string | string[] | Dictionary<unknown>) {
  return serialize(name, [], value);
}

function serialize(name: string, path: string[], value: any): string {
  if (typeof value === 'object') {
    return Object.keys(value)
      .map(key => serialize(name, [...path, isPositiveInteger(key) ? '' : key], value[key]))
      .join('&');
  } else {
    return `${name}${path.map(key => `[${key}]`).join('')}=${value}`;
  }
}

function isPositiveInteger(str: string) {
  return /^\+?\d+$/.test(str) && parseInt(str) >= 0;
}
