import { DiagnosticSeverity, HttpParamStyles, IHttpParam, Dictionary } from '@stoplight/types';
import { compact, keyBy, mapKeys, mapValues, pickBy, upperFirst } from 'lodash';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as NEA from 'fp-ts/NonEmptyArray';
import { pipe } from 'fp-ts/pipeable';
import { JSONSchema4 } from 'json-schema';
import { JSONSchema } from '../../';
import { validateAgainstSchema } from './utils';
import type { deserializeFn } from '../deserializers/types';
import type { IHttpValidator } from './types';
import type { IPrismDiagnostic } from '@stoplight/prism-core';

export class HttpParamsValidator<Target> implements IHttpValidator<Target, IHttpParam> {
  constructor(
    private _registry: Dictionary<deserializeFn<Target>>,
    private _prefix: string,
    private _style: HttpParamStyles
  ) {}

  public validate(target: Target, specs: IHttpParam[]) {
    const { _registry: registry, _prefix: prefix, _style: style } = this;

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
                  // This is bad, but unfortunately for the way the parameter validators are done there's
                  // no better way at them moment. I hope to fix this in a following PR where we will revisit
                  // the validators a bit
                  // @ts-ignore
                  mapKeys(target, (_value, key) => key.toLowerCase()),
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
  }
}

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
