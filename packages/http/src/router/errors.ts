import { Omit } from '@stoplight/types';
import { ProblemJson } from '../types';

export const NO_RESOURCE_PROVIDED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route not resolved, no resource provided.',
  name: 'https://stoplight.io/prism/errors#NO_RESOURCE_PROVIDED_ERROR',
  status: 404,
};
export const NO_PATH_MATCHED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route not resolved, no path matched.',
  name: 'https://stoplight.io/prism/errors#NO_PATH_MATCHED_ERROR',
  status: 404,
};
export const NO_SERVER_MATCHED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route not resolved, no server matched.',
  name: 'https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR',
  status: 404,
};
export const NO_METHOD_MATCHED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route resolved, but no path matched.',
  name: 'https://stoplight.io/prism/errors#NO_METHOD_MATCHED_ERROR',
  status: 405,
};
export const NO_SERVER_CONFIGURATION_PROVIDED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route not resolved, no server configuration provided.',
  name: 'https://stoplight.io/prism/errors#NO_SERVER_CONFIGURATION_PROVIDED_ERROR',
  status: 404,
};
