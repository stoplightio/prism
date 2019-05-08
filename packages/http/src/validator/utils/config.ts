import { IHttpConfig } from '../../types';

const DEFAULT = {
  REQEUST: {
    hijack: false,
    headers: true,
    query: true,
    body: true,
  },
  RESPONSE: {
    headers: true,
    body: true,
  },
};

export function resolveResponseValidationConfig(
  config?: IHttpConfig,
): {
  headers: boolean;
  body: boolean;
} {
  const { RESPONSE: def } = DEFAULT;
  if (!config || !config.validate) {
    return def;
  }

  const response = config.validate.response;

  if (response === true) {
    return def;
  }

  if (response === false) {
    return {
      headers: false,
      body: false,
    };
  }

  if (!response) {
    return def;
  }

  return {
    headers: response.headers === false ? false : def.headers,
    body: response.body === false ? false : def.body,
  };
}

export function resolveRequestValidationConfig(
  config?: IHttpConfig,
): {
  hijack: boolean;
  headers: boolean;
  query: boolean;
  body: boolean;
} {
  const { REQEUST: def } = DEFAULT;
  if (!config || !config.validate) {
    return def;
  }

  const request = config.validate.request;

  if (request === true) {
    return def;
  }

  if (request === false) {
    return {
      hijack: false,
      headers: false,
      query: false,
      body: false,
    };
  }

  if (!request) {
    return def;
  }

  return {
    hijack: request.hijack === false ? false : def.hijack,
    headers: request.headers === false ? false : def.headers,
    query: request.query === false ? false : def.query,
    body: request.body === false ? false : def.body,
  };
}
