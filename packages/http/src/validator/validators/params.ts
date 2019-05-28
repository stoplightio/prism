import { DiagnosticSeverity, HttpParamStyles, IHttpParam } from '@stoplight/types';
import { upperFirst } from 'lodash';

import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
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
    return specs.reduce<IPrismDiagnostic[]>((results, spec) => {
      if (!(spec.name in target) && spec.required === true) {
        results.push({
          path: [prefix, spec.name],
          code: 'required',
          message: `Missing ${spec.name} ${prefix} param`,
          severity: DiagnosticSeverity.Error,
        });

        // stop further checks
        return results;
      }

      const resolvedStyle = spec.style || style;
      if (spec.content && spec.content.schema && target[spec.name]) {
        const deserializer = registry.get(resolvedStyle);

        if (deserializer) {
          Array.prototype.push.apply(
            results,
            validateAgainstSchema(
              deserializer.deserialize(spec.name, target, spec.content.schema, spec.explode || false),
              spec.content.schema,
              prefix,
            ),
          );
        }
      }

      if (spec.deprecated === true) {
        results.push({
          path: [prefix, spec.name],
          code: 'deprecated',
          message: `${upperFirst(prefix)} param ${spec.name} is deprecated`,
          severity: DiagnosticSeverity.Warning,
        });
      }

      return results;
    }, []);
  }
}
