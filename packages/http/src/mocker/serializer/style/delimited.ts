import { partial } from 'lodash';

function serializeAndImplode(separator: string, name: string, value: Array<string | number | boolean>) {
  return (
    encodeURIComponent(name) +
    '=' +
    value
      .map(String)
      .map(encodeURIComponent)
      .join(separator)
  );
}

function serializeAndExplode(name: string, value: Array<string | number | boolean>) {
  return value
    .map(String)
    .map(v => `${encodeURIComponent(name)}=${encodeURIComponent(v)}`)
    .join('&');
}

export function serializeWithDelimitedStyle(
  separator: string,
  name: string,
  value: Array<string | number | boolean>,
  explode?: boolean,
): string {
  return explode ? serializeAndExplode(name, value) : serializeAndImplode(separator, name, value);
}

export const serializeWithCommaDelimitedStyle = partial(serializeWithDelimitedStyle, ',');
export const serializeWithSpaceDelimitedStyle = partial(serializeWithDelimitedStyle, '%20');
export const serializeWithPipeDelimitedStyle = partial(serializeWithDelimitedStyle, '|');
