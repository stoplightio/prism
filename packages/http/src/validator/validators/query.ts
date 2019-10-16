import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';

import { IPrismDiagnostic } from '@stoplight/prism-core';
import { IHttpNameValues } from '../../types';
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
  public validate(target: IHttpNameValues, specs: IHttpQueryParam[], a: any, b: any) {
    return super.validate(target, specs, a, b);
  }
}
