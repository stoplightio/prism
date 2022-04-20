import { IHttpNameValues } from '../types';

export function toURLSearchParams(query: IHttpNameValues | undefined): URLSearchParams {
  const urlSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (typeof value === 'string') {
      urlSearchParams.append(key, value);
    } else if (value instanceof Array) {
      for (const innerValue of value) {
        urlSearchParams.append(key, innerValue);
      }
    }
  }

  return urlSearchParams;
}
