import * as faker from 'faker/locale/en_US';
import { cloneDeep } from 'lodash';
import { JSONSchema } from '../../types';

import * as jsf from 'json-schema-faker';
import * as sampler from '@stoplight/json-schema-sampler';
import { Either, toError, tryCatch } from 'fp-ts/Either';
import { IHttpOperation } from '@stoplight/types';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import { stripWriteOnlyProperties } from '../../utils/filterRequiredProperties';

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

export function generate(bundle: unknown, source: JSONSchema): Either<Error, unknown> {
  return pipe(
    stripWriteOnlyProperties(source),
    E.fromOption(() => Error('Cannot strip writeOnly properties')),
    E.chain(updatedSource =>
      tryCatch(() => jsf.generate({ ...cloneDeep(updatedSource), __bundled__: bundle }), toError)
    )
  );
}

export function generateStatic(resource: IHttpOperation, source: JSONSchema): Either<Error, unknown> {
  return tryCatch(() => sampler.sample(source, {}, resource), toError);
}
