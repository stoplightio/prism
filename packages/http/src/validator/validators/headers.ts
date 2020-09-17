import { HttpParamStyles, IHttpHeaderParam, Dictionary } from '@stoplight/types';
import { IHttpNameValue } from '../../types';
import { deserializeFn } from '../deserializers/types';
import { HttpParamsValidator } from './params';

export class HttpHeadersValidator extends HttpParamsValidator<IHttpNameValue> {
  constructor(
    registry: Dictionary<deserializeFn<IHttpNameValue>>,
    prefix: string,
    style: HttpParamStyles = HttpParamStyles.Simple
  ) {
    super(registry, prefix, style);
  }

  public validate(target: IHttpNameValue, specs: IHttpHeaderParam[]) {
    return super.validate(target, specs);
  }
}
