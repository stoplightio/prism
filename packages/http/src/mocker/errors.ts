import { Omit } from '@stoplight/types';
import { ProblemJson } from '../types';

export const NO_INVALID_RESPONSE_TEMPLATE: Omit<ProblemJson, 'detail'> = {
  name: 'NO_INVALID_RESPONSE_TEMPLATE',
  title: 'Missing invalid response or response example for the current invalid request',
  status: 400,
};
