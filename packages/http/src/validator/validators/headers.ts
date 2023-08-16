import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import { IHttpNameValue } from '../../types';
import * as MIMEType from 'whatwg-mimetype';
import { validateParams } from './params';
import { header } from '../deserializers';
import { ValidationContext } from './types';

export function parseMIMEHeader(contentTypeHeader: string) {
  const mimeType = new MIMEType(contentTypeHeader);
  const multipartBoundary = mimeType.parameters.get('boundary'); // exists when media type is multipart/form-data
  const mediaType = mimeType.essence;
  return [multipartBoundary, mediaType] as const;
}

export const validate = (
  target: IHttpNameValue,
  specs: IHttpPathParam[],
  context: ValidationContext,
  bundle?: unknown
) =>
  validateParams(
    target,
    specs,
    context,
    bundle
  )({ deserializers: header, prefix: 'header', defaultStyle: HttpParamStyles.Simple });
