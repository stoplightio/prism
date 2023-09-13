import { IHttpResponse } from '../../types';

export function removeDefaultDynamicBody(response: IHttpResponse): IHttpResponse {
  delete response.defaultDynamicBody;
  return response;
}