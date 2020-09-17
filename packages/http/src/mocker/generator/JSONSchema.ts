import * as faker from 'faker/locale/en_US';
import { cloneDeep } from 'lodash';
import { JSONSchema } from '../../types';

import * as jsf from 'json-schema-faker';
import * as sampler from 'openapi-sampler';
import { Either, tryCatch, toError } from 'fp-ts/Either';

jsf.extend('faker', () => faker);

jsf.option({
  failOnInvalidTypes: false,
  failOnInvalidFormat: false,
  alwaysFakeOptionals: true,
  optionalsProbability: 1,
  fixedProbabilities: true,
  ignoreMissingRefs: true,
  maxItems: 20,
  maxLength: 100,
});

export function generate(source: JSONSchema): Either<Error, unknown> {
  return tryCatch(() => jsf.generate(cloneDeep(source)), toError);
}

export function generateStatic(resource: unknown, source: JSONSchema): Either<Error, unknown> {
  return tryCatch(() => sampler.sample(source, {}, resource), toError);
}
