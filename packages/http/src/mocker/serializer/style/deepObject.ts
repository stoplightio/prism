import { HttpParamStyles } from '@stoplight/types';

export function serializeWithDeepObjectStyle(name: string, value: any) {
  return serialize(name, [], value);
}

function serialize(name: string, path: string[], value: any): string {
  if (typeof value === 'object') {
    return Object.keys(value)
      .map(key => serialize(name, [...path, isNormalInteger(key) ? '' : key], value[key]))
      .join('&');
  } else {
    return `${name}${path.map(key => `[${key}]`).join('')}=${value}`;
  }
}

function isNormalInteger(str: string) {
  return /^\+?\d+$/.test(str);
}
