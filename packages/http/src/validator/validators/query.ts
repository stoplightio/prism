import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';

import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { IHttpNameValues } from '../../types';
import { IHttpParamDeserializerRegistry } from '../deserializers/types';
import { HttpParamsValidator } from './params';

export class HttpQueryValidator extends HttpParamsValidator<IHttpNameValues, IHttpQueryParam> {
  constructor(
    registry: IHttpParamDeserializerRegistry<IHttpNameValues>,
    prefix: string,
    style: HttpParamStyles = HttpParamStyles.Form,
  ) {
    super(registry, prefix, style);
  }
  public validate(target: IHttpNameValues, specs: IHttpQueryParam[]): IPrismDiagnostic[] {
    return super.validate(target, specs);
  }
}
