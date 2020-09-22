import { DiagnosticSeverity, HttpParamStyles, IHttpParam, Dictionary } from '@stoplight/types';
import { compact, keyBy, mapKeys, mapValues, pickBy, upperFirst } from 'lodash';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as RE from 'fp-ts/ReaderEither';
import { pipe } from 'fp-ts/pipeable';
import { JSONSchema4 } from 'json-schema';
import { JSONSchema } from '../../';
import { validateAgainstSchema } from './utils';
import type { deserializeFn } from '../deserializers/types';
import type { IPrismDiagnostic } from '@stoplight/prism-core';

export type Deps<Target> = {
  registry: Dictionary<deserializeFn<Target>>;
  prefix: string;
  style: HttpParamStyles;
};

export const validate = <Target>(
  target: Target,
  specs: IHttpParam[]
): RE.ReaderEither<Deps<Target>, NEA.NonEmptyArray<IPrismDiagnostic>, Target> => ({ registry, prefix, style }) => {
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
      const schema = createJsonSchemaFromParams(specs);
      const parameterValues = pickBy(
        mapValues(
          keyBy(specs, s => s.name.toLowerCase()),
          el => {
            const resolvedStyle = el.style || style;
            const deserializer = registry[resolvedStyle];
            if (deserializer)
              return deserializer(
                el.name.toLowerCase(),
                // @ts-ignore
                mapKeys(target, (_value: unknown, key: string) => key.toLowerCase()),
                schema.properties && (schema.properties[el.name.toLowerCase()] as JSONSchema4),
                el.explode || false
              );

            return undefined;
          }
        )
      );
      return { parameterValues, schema };
    }),
    O.chain(({ parameterValues, schema }) => validateAgainstSchema(parameterValues, schema, true, prefix)),
    O.map(schemaDiagnostic => schemaDiagnostic.concat(deprecatedWarnings)),
    O.chain(NEA.fromArray),
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
