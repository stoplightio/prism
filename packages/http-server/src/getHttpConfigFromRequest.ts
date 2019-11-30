import { IHttpOperationConfig, IHttpRequest } from '@stoplight/prism-http';

export const getHttpConfigFromRequest = (req: IHttpRequest): Partial<IHttpOperationConfig> => {
  const httpOperationConfig: Partial<IHttpOperationConfig> = {};
  const query = req.url.query;

  if (!query) {
    return {};
  }

  const { __code, __dynamic, __example } = query;

  if (__code) {
    httpOperationConfig.code = typeof __code === 'string' ? __code : __code[0];
  }

  if (__dynamic) {
    httpOperationConfig.dynamic = __dynamic === 'true';
  }

  if (__example) {
    httpOperationConfig.exampleKey = typeof __example === 'string' ? __example : __example[0];
  }

  return httpOperationConfig;
};
