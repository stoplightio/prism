import { DiagnosticSeverity, HttpParamStyles, IHttpParam } from '@stoplight/types';
import { Dictionary } from "@stoplight/types/dist";
import * as Either from "fp-ts/lib/Either";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import * as Option from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { compact, keyBy, mapKeys, mapValues, pickBy, upperFirst } from 'lodash';

import { IPrismDiagnostic } from '@stoplight/prism-core';
import { JSONSchema4 } from 'json-schema';
import { JSONSchema } from '../../';
import { IHttpParamDeserializerRegistry } from '../deserializers/types';
import { validateAgainstSchema } from './utils';

export class HttpParamsValidator<Target> {
  constructor(
    private _registry: IHttpParamDeserializerRegistry<Target>,
    private _prefix: string,
    private _style: HttpParamStyles,
  ) {}

  public validate(target: Target, specs: IHttpParam[], parameterValues: Dictionary<string>, schema: JSONSchema) {
    const { _prefix: prefix } = this;

    const deprecatedWarnings = specs.filter(spec => spec.deprecated).map(spec => ({
      path: [prefix, spec.name],
      code: 'deprecated',
      message: `${upperFirst(prefix)} param ${spec.name} is deprecated`,
      severity: DiagnosticSeverity.Warning,
    }));

    return pipe(
      validateAgainstSchema(parameterValues, schema, prefix).concat(deprecatedWarnings),
      Option.fromNullable,
      Option.fold(() => Either.right([]), x => {
        if (x.length) {
          return Either.left(x as NonEmptyArray<IPrismDiagnostic>)
        } else {
          return Either.right([])
        }
      }),
    );
  }
}

export function createJsonSchemaFromParams(params: IHttpParam[]): JSONSchema {
  const schema: JSONSchema = {
    type: 'object',
    properties: pickBy(mapValues(keyBy(params, p => p.name.toLowerCase()), 'schema')) as JSONSchema4,
    required: compact(params.map(m => (m.required ? m.name.toLowerCase() : undefined))),
  };

  return schema;
}

export function getPV<Target>(specs: IHttpParam[], style: typeof HttpParamStyles, registry: IHttpParamDeserializerRegistry<Target>, schema: JSONSchema, target: Target) {
  return pickBy(
    mapValues(keyBy(specs, s => s.name.toLowerCase()), el => {
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
          el.explode || false,
        );

      return undefined;
    }),
  );
}