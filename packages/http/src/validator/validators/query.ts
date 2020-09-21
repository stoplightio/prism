import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import { IHttpNameValues } from '../../types';
import type { query } from '../deserializers';
import { HttpParamsValidator } from './params';

export class HttpQueryValidator extends HttpParamsValidator<IHttpNameValues> {
  constructor(registry: typeof query, prefix: string, style: HttpParamStyles = HttpParamStyles.Form) {
    super(registry, prefix, style);
  }
  public validate(target: IHttpNameValues, specs: IHttpQueryParam[]) {
    return super.validate(target, specs);
  }
}
