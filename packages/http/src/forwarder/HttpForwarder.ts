import { IForwarder, IPrismInput } from '@stoplight/prism-core';
import { IHttpOperation, IServer } from '@stoplight/types';
import axios from 'axios';
import urijs = require('urijs');
import { IHttpConfig, IHttpNameValue, IHttpRequest, IHttpResponse } from '../types';

export class HttpForwarder
  implements IForwarder<IHttpOperation, IHttpRequest, IHttpConfig, IHttpResponse> {
  public async forward(opts: {
    resource?: IHttpOperation;
    input: IPrismInput<IHttpRequest>;
  }): Promise<IHttpResponse> {
    const inputData = opts.input.data;
    // @ts-ignore
    const baseUrl =
      opts.resource && opts.resource.servers && opts.resource.servers.length > 0
        ? this.resolveServerUrl(opts.resource.servers[0])
        : inputData.url.baseUrl;

    const response = await axios({
      method: inputData.method,
      baseURL: baseUrl,
      url: inputData.url.path,
      params: inputData.url.query,
      responseType: 'text',
      data: inputData.body,
      headers: this.updateHostHeaders(inputData.headers, baseUrl),
      validateStatus: () => true,
    });

    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
    };
  }

  private updateHostHeaders(headers?: IHttpNameValue, baseUrl?: string) {
    // no headers? do nothing
    if (!headers) return headers;

    if (!baseUrl) {
      const { host, ...restHeaders } = headers;
      return restHeaders;
    }

    // host header provided? override with actual hostname
    if (headers.hasOwnProperty('host')) {
      return {
        ...headers,
        host: urijs(baseUrl).host(),
        forwarded: `host=${headers.host}`,
      };
    }

    return headers;
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
