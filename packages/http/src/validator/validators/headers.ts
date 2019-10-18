import { HttpParamStyles, IHttpHeaderParam } from '@stoplight/types';
import { Dictionary } from "@stoplight/types";

import { IHttpNameValue, JSONSchema } from '../../types';
import { IHttpParamDeserializerRegistry } from '../deserializers/types';
import { HttpParamsValidator } from './params';

export class HttpHeadersValidator extends HttpParamsValidator<IHttpNameValue> {
  constructor(
    registry: IHttpParamDeserializerRegistry<IHttpNameValue>,
    prefix: string,
    style: HttpParamStyles = HttpParamStyles.Simple,
  ) {
    super(registry, prefix, style);
  }

  public validate(target: IHttpNameValue, specs: IHttpHeaderParam[], parameterValues: Dictionary<string>, schema: JSONSchema) {

    return super.validate(target, specs, parameterValues, schema);
  }
}
