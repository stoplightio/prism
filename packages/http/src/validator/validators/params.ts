import { DiagnosticSeverity, HttpParamStyles, IHttpParam } from '@stoplight/types';
import { compact, keyBy, mapValues, pickBy, upperFirst } from 'lodash';

import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { JSONSchema4 } from 'json-schema';
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

    const schema = createJsonSchemaFromParams(specs);

    const deprecatedWarnings = specs.filter(spec => spec.deprecated).map(spec => ({
      path: [prefix, spec.name],
      code: 'deprecated',
      message: `${upperFirst(prefix)} param ${spec.name} is deprecated`,
      severity: DiagnosticSeverity.Warning,
    }));

    const parameterValues = pickBy(
      mapValues(keyBy(specs, 'name'), el => {
        const resolvedStyle = el.style || style;
        const deserializer = registry.get(resolvedStyle);

        return deserializer!.deserialize(el.name, target, schema.properties![el.name], el.explode || false);
      }),
    );

    const schemaErrors = validateAgainstSchema(parameterValues, schema, prefix);

    return schemaErrors.concat(deprecatedWarnings);
  }
}

function createJsonSchemaFromParams(params: IHttpParam[]): JSONSchema4 {
  const schema: JSONSchema4 = {
    type: 'object',
    properties: pickBy(mapValues(keyBy(params, 'name'), 'content.schema')),
    required: compact(params.map(m => (m.required ? m.name : undefined))),
  };

  return schema;
}
