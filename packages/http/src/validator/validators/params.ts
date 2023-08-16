import { DiagnosticSeverity, HttpParamStyles, IHttpParam, Dictionary } from '@stoplight/types';
import { compact, keyBy, mapKeys, mapValues, pickBy, upperFirst } from 'lodash';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as RE from 'fp-ts/ReaderEither';
import { pipe } from 'fp-ts/function';
import { JSONSchema4 } from 'json-schema';
import { JSONSchema } from '../../';
import { validateAgainstSchema } from './utils';
import type { deserializeFn } from '../deserializers/types';
import type { IPrismDiagnostic } from '@stoplight/prism-core';
import { ValidationContext } from './types';

export type Deps<Target> = {
  deserializers: Dictionary<deserializeFn<Target>>;
  prefix: string;
  defaultStyle: HttpParamStyles;
};

const schemaCache = new WeakMap<IHttpParam[], JSONSchema>();

export const validateParams =
  <Target>(
    target: Target,
    specs: IHttpParam[],
    context: ValidationContext,
    bundle?: unknown
  ): RE.ReaderEither<Deps<Target>, NEA.NonEmptyArray<IPrismDiagnostic>, Target> =>
  ({ deserializers, prefix, defaultStyle }) => {
    const deprecatedWarnings = specs
      .filter(spec => spec.deprecated && target[spec.name])
      .map<IPrismDiagnostic>(spec => ({
        path: [prefix, spec.name],
        code: 'deprecated',
        message: `${upperFirst(prefix)} param ${spec.name} is deprecated`,
        severity: DiagnosticSeverity.Warning,
      }));

    return pipe(
      NEA.fromArray(specs),
      O.map(specs => {
        const schema = schemaCache.get(specs) ?? createJsonSchemaFromParams(specs);
        if (!schemaCache.has(specs)) {
          schemaCache.set(specs, schema);
        }

        const parameterValues = pickBy(
          mapValues(
            keyBy(specs, s => s.name.toLowerCase()),
            el => {
              const resolvedStyle = el.style || defaultStyle;
              const deserializer = deserializers[resolvedStyle];

              return deserializer
                ? deserializer(
                    el.name.toLowerCase(),
                    // @ts-ignore
                    mapKeys(target, (_value: unknown, key: string) => key.toLowerCase()),
                    schema.properties && (schema.properties[el.name.toLowerCase()] as JSONSchema4),
                    el.explode || false
                  )
                : undefined;
            }
          )
        );
        return { parameterValues, schema };
      }),
      O.chain(({ parameterValues, schema }) =>
        validateAgainstSchema(parameterValues, schema, true, context, prefix, bundle)
      ),
      O.map(schemaDiagnostic => NEA.concat(schemaDiagnostic, deprecatedWarnings)),
      O.alt(() => NEA.fromArray(deprecatedWarnings)),
      E.fromOption(() => target),
      E.swap
    );
  };

function createJsonSchemaFromParams(params: NEA.NonEmptyArray<IHttpParam>): JSONSchema {
  return {
    type: 'object',
    properties: pickBy(
      mapValues(
        keyBy(params, p => p.name.toLocaleLowerCase()),
        'schema'
      )
    ) as JSONSchema4,
    required: compact(params.map(m => (m.required ? m.name.toLowerCase() : undefined))),
  };
}
