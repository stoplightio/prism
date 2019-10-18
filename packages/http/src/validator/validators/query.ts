import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import { Dictionary } from "@stoplight/types";
import { IHttpNameValues, JSONSchema } from '../../types';
import { IHttpParamDeserializerRegistry } from '../deserializers/types';
import { HttpParamsValidator } from './params';

export class HttpQueryValidator extends HttpParamsValidator<IHttpNameValues> {
  constructor(
    registry: IHttpParamDeserializerRegistry<IHttpNameValues>,
    prefix: string,
    style: HttpParamStyles = HttpParamStyles.Form,
  ) {
    super(registry, prefix, style);
  }
  public validate(target: IHttpNameValues, specs: IHttpQueryParam[], parameterValues: Dictionary<string>, schema: JSONSchema) {

    return super.validate(target, specs, parameterValues, schema);
  }
}
