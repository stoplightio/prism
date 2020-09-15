import type { ProblemJson } from '..';

export const UPSTREAM_NOT_IMPLEMENTED: Omit<ProblemJson, 'detail'> = {
  type: 'UPSTREAM_NOT_IMPLEMENTED',
  title: 'The server does not support the functionality required to fulfill the request',
  status: 501,
};
