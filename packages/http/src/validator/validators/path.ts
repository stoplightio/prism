import { HttpParamStyles, IHttpPathParam, Dictionary } from '@stoplight/types';
import { IHttpNameValue } from '../../types';
import type { path } from '../deserializers';
import { HttpParamsValidator } from './params';

export class HttpPathValidator extends HttpParamsValidator<IHttpNameValue> {
  constructor(registry: typeof path) {
    super(registry, 'path', HttpParamStyles.Simple);
  }
  public validate(target: IHttpNameValue, specs: IHttpPathParam[]) {
    return super.validate(target, specs);
  }
}
