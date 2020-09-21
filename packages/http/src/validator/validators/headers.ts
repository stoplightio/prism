import { HttpParamStyles, IHttpHeaderParam } from '@stoplight/types';
import { IHttpNameValue } from '../../types';
import type { header } from '../deserializers';
import { HttpParamsValidator } from './params';

export class HttpHeadersValidator extends HttpParamsValidator<IHttpNameValue> {
  constructor(registry: typeof header, prefix: string, style: HttpParamStyles = HttpParamStyles.Simple) {
    super(registry, prefix, style);
  }

  public validate(target: IHttpNameValue, specs: IHttpHeaderParam[]) {
    return super.validate(target, specs);
  }
}
