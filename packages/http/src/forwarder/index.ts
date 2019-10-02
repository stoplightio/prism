import { IPrismComponents } from '@stoplight/prism-core';
import { IHttpOperation, IServer } from '@stoplight/types';
import axios from 'axios';
import { toError } from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults } from 'lodash';
import { NO_BASE_URL_ERROR } from '../router/errors';
import { IHttpConfig, IHttpRequest, IHttpResponse, ProblemJsonError } from '../types';
const { version: prismVersion } = require('../../package.json');

const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'] = (
  resource: IHttpOperation,
  input: IHttpRequest,
  timeout: number = 0,
): TaskEither.TaskEither<Error, IHttpResponse> => {
  const baseUrl =
    resource.servers && resource.servers.length > 0 ? resolveServerUrl(resource.servers[0]) : input.url.baseUrl;

  if (!baseUrl) {
    return TaskEither.left(ProblemJsonError.fromTemplate(NO_BASE_URL_ERROR));
  }

  return TaskEither.tryCatch<Error, IHttpResponse>(async () => {
    const response = await axios.request<unknown>({
      method: input.method as any,
      baseURL: baseUrl,
      url: input.url.path,
      params: input.url.query,
      data: input.body,
      headers: defaults(input.headers, { 'user-agent': `Prism/${prismVersion}` }),
      validateStatus: () => true,
      timeout: Math.max(timeout, 0),
    });

    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
    };
  }, toError);
};

function resolveServerUrl(server: IServer) {
  if (!server.variables) {
    return server.url;
  }

  return server.url.replace(/{(.*?)}/g, (_match, variableName) => {
    const variable = server.variables![variableName];
    if (!variable) {
      throw new Error(`Variable '${variableName}' is not defined, cannot parse input.`);
    }

    return variable.default || variable.enum![0];
  });
}

export default forward;
