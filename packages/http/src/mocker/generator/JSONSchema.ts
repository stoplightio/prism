import { JSONSchema } from 'http/src/types';
// @ts-ignore
import * as jsf from 'json-schema-faker';
import { cloneDeep } from 'lodash';
// @ts-ignore
import * as sampler from 'openapi-sampler';

jsf.option({
  failOnInvalidTypes: false,
  failOnInvalidFormat: false,
  alwaysFakeOptionals: true,
  optionalsProbability: 1,
  fixedProbabilities: true,
  ignoreMissingRefs: true,
  useExamplesValue: false,
  useDefaultValue: false,
  maxItems: 20,
  maxLength: 100,
});

export function generate(source: JSONSchema): unknown {
  return jsf.generate(cloneDeep(source));
}

export function generateStatic(source: JSONSchema): unknown {
  return sampler.sample(source);
}
