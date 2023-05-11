import { Dictionary } from '@stoplight/types';

export function serializeWithFormStyle(
  name: string,
  value: string | string[] | Dictionary<unknown> | null,
  explode: boolean
) {
  return serialize(name, value, explode);
}

function serialize(name: string, value: string | string[] | Dictionary<unknown> | null, explode: boolean): string {
  if (value === null) {
    return `${name}=`;
  } else if (typeof value === 'object') {
    // value is either array or object
    if (explode) {
      // for array: color=blue&color=black&color=brown
      // for object: R=100&G=200&B=150
      return Object.keys(value)
        .map(key => (Array.isArray(value) ? `${name}=${value[key]}` : `${key}=${value[key]}`))
        .join('&');
    } else {
      // for array: color=blue,black,brown
      // for object: color=R,100,G,200,B,150
      return Array.isArray(value)
        ? `${name}=${value.join(',')}`
        : `${name}=${Object.entries(value)
            .map(([k, v]) => `${k},${v}`)
            .join(',')}`;
    }
  } else {
    // value is a string
    return `${name}=${value}`;
  }
}
