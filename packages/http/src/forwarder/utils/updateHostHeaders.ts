import { URL } from 'url';
import { version as prismVersion } from '../../../package.json';
import { IHttpNameValue } from '../../types';

const updateHostHeaders = (baseUrl: string, headers: IHttpNameValue = {}) => {
  const userAgentHeader = { 'user-agent': `Prism/${prismVersion}` };
  const headersWithHost = headers.hasOwnProperty('host')
    ? {
        ...headers,
        host: new URL(baseUrl).host,
        forwarded: `host=${headers.host}`,
      }
    : headers;

  return Object.assign(userAgentHeader, headersWithHost);
};

export default updateHostHeaders;
