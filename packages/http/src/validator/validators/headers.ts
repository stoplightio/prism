import { HttpParamStyles, IHttpHeaderParam } from '@stoplight/types';

import { INoRangeDiagnostic } from '@stoplight/prism-core/src/types';
import { IHttpNameValue } from '../../types';
import { IHttpParamDeserializerRegistry } from '../deserializers/types';
import { HttpParamsValidator } from './params';

export class HttpHeadersValidator extends HttpParamsValidator<IHttpNameValue, IHttpHeaderParam> {
  constructor(
    registry: IHttpParamDeserializerRegistry<IHttpNameValue>,
    prefix: string,
    style: HttpParamStyles = HttpParamStyles.Simple
  ) {
    super(registry, prefix, style);
  }

  public validate(
    target: IHttpNameValue,
    specs: IHttpHeaderParam[],
    mediaType?: string
  ): INoRangeDiagnostic[] {
    return super.validate(target, specs, mediaType);
  }
}
