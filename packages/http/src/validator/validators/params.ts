import { DiagnosticSeverity, HttpParamStyles, IHttpParam } from '@stoplight/types';
import { compact, keyBy, mapValues, pickBy, upperFirst } from 'lodash';

import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';
import { IHttpParamDeserializerRegistry } from '../deserializers/types';
import { IHttpValidator } from './types';
import { validateAgainstSchema } from './utils';

export class HttpParamsValidator<Target, Spec extends IHttpParam> implements IHttpValidator<Target, Spec> {
  constructor(
    private _registry: IHttpParamDeserializerRegistry<Target>,
    private _prefix: string,
    private _style: HttpParamStyles,
  ) {}

  public validate(target: Target, specs: Spec[]): IPrismDiagnostic[] {
    const { _registry: registry, _prefix: prefix, _style: style } = this;

    const deprecatedWarnings = specs.filter(spec => spec.deprecated).map(spec => ({
      path: [prefix, spec.name],
      code: 'deprecated',
      message: `${upperFirst(prefix)} param ${spec.name} is deprecated`,
      severity: DiagnosticSeverity.Warning,
    }));

    const schema = createJsonSchemaFromParams(specs);

    const parameterValues = pickBy(
      mapValues(keyBy(specs, s => s.name.toLowerCase()), el => {
        const resolvedStyle = el.style || style;
        const deserializer = registry.get(resolvedStyle);
        if (deserializer)
          return deserializer.deserialize(
            el.name,
            target,
            schema.properties && (schema.properties[el.name] as JSONSchema4),
            el.explode || false,
          );

        return undefined;
      }),
    );

    return validateAgainstSchema(parameterValues, schema, prefix).concat(deprecatedWarnings);
  }
}

function createJsonSchemaFromParams(params: IHttpParam[]): JSONSchema4 | JSONSchema6 | JSONSchema7 {
  const schema: JSONSchema4 | JSONSchema6 | JSONSchema7 = {
    type: 'object',
    properties: pickBy(mapValues(keyBy(params, p => p.name.toLowerCase()), 'schema')) as JSONSchema4,
    required: compact(params.map(m => (m.required ? m.name : undefined))),
  };

  return schema;
}
