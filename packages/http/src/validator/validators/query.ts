import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import { IHttpNameValues } from '../../types';
import type { query } from '../deserializers';
import { HttpParamsValidator } from './params';

export class HttpQueryValidator extends HttpParamsValidator<IHttpNameValues> {
  constructor(registry: typeof query) {
    super(registry, 'query', HttpParamStyles.Form);
  }
  public validate(target: IHttpNameValues, specs: IHttpQueryParam[]) {
    return super.validate(target, specs);
  }
}
