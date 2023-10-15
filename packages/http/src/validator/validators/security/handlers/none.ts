import { get } from 'lodash';

import { when } from './utils';
import { Dictionary } from '@stoplight/types';
import { IHttpRequest } from '../../../../types';

// Makes sure there aren't any auth headers
function isNoAuth(inputHeaders: Dictionary<string>) {
  return get(inputHeaders, 'authorization') == undefined;
}

export const none = (input: Pick<IHttpRequest, 'headers' | 'url'>) => when(isNoAuth(input.headers || {}), 'None');
