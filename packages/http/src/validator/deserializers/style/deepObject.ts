import { HttpParamStyles, ISchema } from '@stoplight/types';
import { IHttpNameValues } from '../../../types';
import { IHttpQueryParamStyleDeserializer } from '../types';

export class DeepObjectStyleDeserializer implements IHttpQueryParamStyleDeserializer {
  public supports(style: HttpParamStyles) {
    return style === HttpParamStyles.DeepObject;
  }

  public deserialize(name: string, parameters: IHttpNameValues, schema: ISchema) {
    function resolve(path: string[]) {
      return name + path.map(el => `[${el}]`).join('');
    }

    function constructArray(currentPath: string[], items: any): object[] {
      const path = resolve(currentPath)
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');

      const regexp = new RegExp(`^${path}\\[([0-9]+)\\]`);

      const indexes = Object.keys(parameters).reduce((list, k) => {
        const matches = k.match(regexp);

        if (!matches) {
          return list;
        }

        return { ...list, [matches[1]]: null };
      }, {});

      return Object.keys(indexes).map(i => construct([...currentPath, String(i)], items));
    }

    function constructObject(currentPath: string[], props: any): object {
      return Object.keys(props).reduce(
        (result, k) => ({ ...result, [k]: construct([...currentPath, k], props[k]) }),
        {},
      );
    }

    function construct(currentPath: string[], def: any): any {
      if (def.type === 'object') {
        return constructObject(currentPath, def.properties || {});
      }

      if (def.type === 'array') {
        return constructArray(currentPath, def.items || {});
      }

      return parameters[resolve(currentPath)];
    }

    return construct([], schema);
  }
}
