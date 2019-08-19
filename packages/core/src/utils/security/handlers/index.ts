import { apiKeyInCookie, apiKeyInHeader, apiKeyInQuery } from './apiKey';
import { httpBasic } from './basicAuth';
import { bearer, oauth2, openIdConnect } from './bearer';
import { httpDigest } from './digestAuth';

export const securitySchemeHandlers = [
  apiKeyInCookie,
  apiKeyInHeader,
  apiKeyInQuery,
  bearer,
  httpBasic,
  httpDigest,
  oauth2,
  openIdConnect,
];
