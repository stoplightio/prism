import * as faker from 'faker';
import { cloneDeep } from 'lodash';
import { JSONSchema } from '../../types';

// @ts-ignore
import * as jsf from 'json-schema-faker';
// @ts-ignore
import * as sampler from 'openapi-sampler';

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

// TODO: adjust if https://github.com/json-schema-faker/json-schema-faker/pull/526 is resolved
const uuidNotAsURN = (fake: string) => {
  return fake.replace('urn:uuid:', '');
};

export function generate(source: JSONSchema): unknown {
  const fake = jsf.generate(cloneDeep(source));

  return source.type === 'string' && source.format === 'uuid' ? uuidNotAsURN(fake) : fake;
}

export function generateStatic(source: JSONSchema): unknown {
  return sampler.sample(source);
}
