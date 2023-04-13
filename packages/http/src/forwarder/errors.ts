import type { ProblemJson } from '..';

export const UPSTREAM_NOT_IMPLEMENTED: Omit<ProblemJson, 'detail'> = {
  type: 'UPSTREAM_NOT_IMPLEMENTED',
  title: 'The server does not support the functionality required to fulfill the request',
  status: 501,
};

export const PROXY_UNSUPPORTED_REQUEST_BODY: Omit<ProblemJson, 'detail'> = {
  type: 'PROXY_UNSUPPORTED_REQUEST_BODY',
  title:
    'The Prism proxy does not support sending a GET/HEAD request with a message body to an upstream server. See: https://github.com/stoplightio/prism/issues/2259',
  status: 501,
};
