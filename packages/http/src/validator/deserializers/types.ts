import { HttpParamStyles } from '@stoplight/types';
import { IHttpNameValue, IHttpNameValues, JSONSchema } from '../../types';

export type deserializeFn<Parameters> = (
  name: string,
  parameters: Parameters,
  schema?: JSONSchema,
  explode?: boolean
) => unknown;

export interface IHttpParamDeserializerRegistry<Parameters, S = HttpParamStyles> {
  get(style: S): IHttpParamStyleDeserializer<Parameters> | undefined;
}

export interface IHttpParamStyleDeserializer<Parameters, S = HttpParamStyles> {
  supports: (style: S) => boolean;
  deserialize: deserializeFn<Parameters>;
}

export type IHttpHeaderParamStyleDeserializer = IHttpParamStyleDeserializer<IHttpNameValue>;
export type IHttpQueryParamStyleDeserializer = IHttpParamStyleDeserializer<IHttpNameValues>;
