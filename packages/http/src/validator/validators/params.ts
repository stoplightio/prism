import { DiagnosticSeverity, HttpParamStyles, IHttpParam } from '@stoplight/types';
import { compact, keyBy, mapKeys, mapValues, pickBy, upperFirst } from 'lodash';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { fromArray } from 'fp-ts/lib/NonEmptyArray';
import { pipe } from 'fp-ts/lib/pipeable';
import { JSONSchema4 } from 'json-schema';
import { JSONSchema } from '../../';
import { IHttpParamDeserializerRegistry } from '../deserializers/types';
import { IHttpValidator } from './types';
import { validateAgainstSchema } from './utils';
import { IPrismDiagnostic } from '@stoplight/prism-core';

export class HttpParamsValidator<Target> implements IHttpValidator<Target, IHttpParam> {
  constructor(
    private _registry: IHttpParamDeserializerRegistry<Target>,
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

    const schema = createJsonSchemaFromParams(specs);

    const parameterValues = pickBy(
      mapValues(
        keyBy(specs, s => s.name.toLowerCase()),
        el => {
          const resolvedStyle = el.style || style;
          const deserializer = registry.get(resolvedStyle);
          if (deserializer)
            return deserializer.deserialize(
              el.name.toLowerCase(),
              // This is bad, but unfortunately for the way the parameter validators are done there's
              // no better way at them moment. I hope to fix this in a following PR where we will revisit
              // the validators a bit
              // @ts-ignore
              mapKeys(target, (_value, key) => key.toLowerCase()),
              schema.properties && (schema.properties[el.name] as JSONSchema4),
              el.explode || false
            );

          return undefined;
        }
      )
    );

    return pipe(
      validateAgainstSchema(parameterValues, schema, prefix),
      Option.map(schemaDiagnostic => schemaDiagnostic.concat(deprecatedWarnings)),
      Option.chain(fromArray),
      Option.alt(() => fromArray(deprecatedWarnings)),
      Either.fromOption(() => target),
      Either.swap
    );
  }
}

function createJsonSchemaFromParams(params: IHttpParam[]): JSONSchema {
  return {
    type: 'object',
    properties: pickBy(
      mapValues(
        keyBy(params, p => p.name.toLowerCase()),
        'schema'
      )
    ) as JSONSchema4,
    required: compact(params.map(m => (m.required ? m.name.toLowerCase() : undefined))),
  };
}
