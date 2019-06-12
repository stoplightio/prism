import { JSONSchema } from 'http/src/types';
import { JSONSchema6, JSONSchema7 } from 'json-schema';
// @ts-ignore
import * as jsf from 'json-schema-faker';
import { cloneDeep, mapValues } from 'lodash';
// @ts-ignore
import * as sampler from 'openapi-sampler';

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
  return sampler.sample(transformExampleFromExamples(source));
}

function hasExample(source: JSONSchema): source is JSONSchema6 | JSONSchema7 {
  return 'examples' in source;
}

function transformExampleFromExamples(s: JSONSchema): any {
  if (!s.properties) return s;

  return {
    ...s,
    properties: mapValues(s.properties, prop => {
      if (typeof prop === 'boolean') return prop;

      if (hasExample(prop) && prop.examples) {
        Object.assign(prop, { example: prop.examples[0] });
      }

      if (prop.properties) {
        return transformExampleFromExamples(prop);
      }

      return prop;
    }),
  };
}
