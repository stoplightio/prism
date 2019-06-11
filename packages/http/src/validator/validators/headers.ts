import { HttpParamStyles, IHttpHeaderParam } from '@stoplight/types';

import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { IHttpNameValue } from '../../types';
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

  public validate(target: IHttpNameValue, specs: IHttpHeaderParam[]): IPrismDiagnostic[] {
    return super.validate(target, specs);
  }
}
