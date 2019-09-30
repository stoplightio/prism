import axios from 'axios';
import { toError } from 'fp-ts/lib/Either';
import { tryCatch } from 'fp-ts/lib/TaskEither';

const updateHostHeaders = (baseUrl: string, headers: any = {}) => {
  const userAgentHeader = { 'user-agent': 'Prism' };
  const headersWithHost = headers.host
    ? {
        ...headers,
        host: new URL(baseUrl).host,
        forwarded: `host=${headers.host}`,
      }
    : headers;

  return Object.assign(userAgentHeader, headersWithHost);
};

export const proxy = (inputData: any, upstream: string) => {
  return tryCatch<Error, any>(
    async () => {
      const response = await axios({
        method: inputData.method,
        baseURL: upstream,
        url: inputData.url.path,
        params: inputData.url.query,
        responseType: 'text',
        data: inputData.body,
        headers: updateHostHeaders(upstream || '', inputData.headers),
        validateStatus: () => true,
      });

      return {
        statusCode: response.status,
        headers: response.headers,
        body: response.data,
        responseType: (response.request && response.request.responseType) || '',
      };
    },
    e => {
      return toError(e);
    },
  );
};

export const displayValidationWhenProxying = (inputValidations: any, outputValidations: any) => {
  if (inputValidations.length) {
    console.log('Input validations\n', inputValidations);
  }
  if (outputValidations.length) {
    console.log('Output validations\n', outputValidations);
  }
};

export const constructBaseUrl = (reqInput: any, config: any) => {
  if (config.upstream) {
    const { url, ...rest } = reqInput;
    const upstreamURL = new URL(config.upstream);
    const newUrl = Object.assign({}, url, { baseUrl: upstreamURL.protocol + '//' + upstreamURL.hostname });

    return { ...rest, url: newUrl };
  } else {
    return reqInput;
  }
};
