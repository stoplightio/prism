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

export function generate(source: JSONSchema): unknown {
  return jsf.generate(cloneDeep(source));
}

export function generateStatic(source: JSONSchema): unknown {
  return sampler.sample(source);
}
