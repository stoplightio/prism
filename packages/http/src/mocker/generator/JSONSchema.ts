import * as faker from 'faker/locale/en_US';
import { cloneDeep } from 'lodash';
import { JSONSchema } from '../../types';

// @ts-ignore
import * as jsf from 'json-schema-faker';
// @ts-ignore
import * as sampler from 'openapi-sampler';
import { Either, tryCatch, toError } from 'fp-ts/lib/Either';

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

export function generateStatic(source: JSONSchema): Either<Error, unknown> {
  return tryCatch(() => sampler.sample(source), toError);
}
