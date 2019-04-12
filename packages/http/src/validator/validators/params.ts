import { DiagnosticSeverity, HttpParamStyles, IHttpContent, IHttpParam } from '@stoplight/types';
import { upperFirst } from 'lodash';

import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { IHttpParamDeserializerRegistry } from '../deserializers/types';
import { resolveContent } from '../utils/http';
import { IHttpValidator } from './types';
import { validateAgainstSchema } from './utils';

export class HttpParamsValidator<Target, Spec extends IHttpParam>
  implements IHttpValidator<Target, Spec> {
  constructor(
    private _registry: IHttpParamDeserializerRegistry<Target>,
    private _prefix: string,
    private _style: HttpParamStyles
  ) {}

  public validate(target: Target, specs: Spec[], mediaType?: string): IPrismDiagnostic[] {
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

      // turn contents into format expected
      const contentMap: { [mediaType: string]: IHttpContent } = {};
      spec.contents.forEach(cont => (contentMap[cont.mediaType] = cont));
      const content = resolveContent(contentMap, mediaType);

      const resolvedStyle = spec.style || style;
      if (content && content.schema) {
        const deserializer = registry.get(resolvedStyle);

        if (deserializer) {
          Array.prototype.push.apply(
            results,
            validateAgainstSchema(
              deserializer.deserialize(spec.name, target, content.schema, spec.explode || false),
              content.schema,
              prefix
            )
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
