import { IForwarder, IPrismInput } from '@stoplight/prism-core';
import { IHttpOperation, IServer } from '@stoplight/types';
import axios from 'axios';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';

export class HttpForwarder
  implements IForwarder<IHttpOperation, IHttpRequest, IHttpConfig, IHttpResponse> {
  public async forward(opts: {
    resource?: IHttpOperation;
    input: IPrismInput<IHttpRequest>;
  }): Promise<IHttpResponse> {
    const inputData = opts.input.data;

    const response = await axios({
      method: inputData.method,
      baseURL:
        opts.resource && opts.resource.servers && opts.resource.servers.length > 0
          ? this.resolveServerUrl(opts.resource.servers[0])
          : inputData.url.baseUrl,
      url: inputData.url.path,
      params: inputData.url.query,
      responseType: 'text',
      data: inputData.body,
      headers: inputData.headers,
      validateStatus: () => true,
    });

    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
    };
  }

  private resolveServerUrl(server: IServer) {
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
}
