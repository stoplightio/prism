import { faker } from '@faker-js/faker';
import { cloneDeep } from 'lodash';
import { JSONSchema } from '../../types';

import { generate as jsfGenerate, type GenerateOptions } from 'json-schema-faker';
import * as sampler from '@stoplight/json-schema-sampler';
import { Either, toError } from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { IHttpContent, IHttpOperation, IHttpParam } from '@stoplight/types';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import { stripWriteOnlyProperties } from '../../utils/filterRequiredProperties';

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const DEFAULT_OPTIONS: GenerateOptions = {
  failOnInvalidTypes: false,
  alwaysFakeOptionals: true,
  optionalsProbability: 1,
  fixedProbabilities: true,
  fillProperties: true,
  maxDepth: 3,
  extensions: {
    faker,
  },
  propAliases: {
    'x-faker': 'faker',
  },
};

let currentOptions: GenerateOptions = { ...DEFAULT_OPTIONS };

export function resetGenerator() {
  currentOptions = { ...DEFAULT_OPTIONS };
}

export function setGeneratorOption(option: string, value: unknown) {
  (currentOptions as Record<string, unknown>)[option] = value;
}

export function generate(
  resource: IHttpOperation | IHttpParam | IHttpContent,
  bundle: unknown,
  source: JSONSchema,
  seed?: string
): TE.TaskEither<Error, unknown> {
  return pipe(
    stripWriteOnlyProperties(source),
    E.fromOption(() => Error('Cannot strip writeOnly properties')),
    TE.fromEither,
    TE.chain(updatedSource =>
      TE.tryCatch(async () => {
        const options: GenerateOptions = { ...currentOptions };
        if (seed) {
          options.seed = simpleHash(seed);
        }

        const schema = cloneDeep(updatedSource) as Record<string, unknown>;
        if (bundle && typeof bundle === 'object') {
          schema['$defs'] = {
            ...((schema['$defs'] as Record<string, unknown>) || {}),
            ...(bundle as Record<string, unknown>),
          };
        }

        const result = await jsfGenerate(schema, options);
        return sortSchemaAlphabetically(result);
      }, toError)
    )
  );
}

//sort alphabetically by keys
export function sortSchemaAlphabetically(source: any): any {
  if (source && Array.isArray(source)) {
    for (const i of source) {
      if (typeof source[i] === 'object') {
        source[i] = sortSchemaAlphabetically(source[i]);
      }
    }
    return source;
  } else if (source && typeof source === 'object') {
    Object.keys(source).forEach((key: string) => {
      if (typeof source[key] === 'object') {
        source[key] = sortSchemaAlphabetically(source[key]);
      }
    });
    return Object.fromEntries(Object.entries(source).sort());
  }

  //just return if not array or object
  return source;
}

export function generateStatic(operation: IHttpOperation, source: JSONSchema): Either<Error, unknown> {
  return pipe(
    E.tryCatch(() => sampler.sample(source, { ticks: 2500 }, operation), toError),
    E.mapLeft(err => {
      if (err instanceof sampler.SchemaSizeExceededError) {
        return new SchemaTooComplexGeneratorError(operation, err);
      }
      return err;
    })
  );
}

export class GeneratorError extends Error {}

export class SchemaTooComplexGeneratorError extends GeneratorError {
  constructor(
    operation: IHttpOperation,
    public readonly cause: Error
  ) {
    super(
      `The operation ${operation.method.toUpperCase()} ${
        operation.path
      } references a JSON Schema that is too complex to generate.`
    );
  }
}
