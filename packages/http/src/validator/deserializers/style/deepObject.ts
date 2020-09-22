import { Dictionary } from '@stoplight/types';
import { IHttpNameValues, JSONSchema } from '../../../types';

export function deserializeDeepObjectStyle(name: string, parameters: IHttpNameValues, schema?: JSONSchema) {
  function resolve(path: string[]) {
    return name + path.map(el => `[${el}]`).join('');
  }

  function constructArray(currentPath: string[], items: unknown): object[] {
    const path = resolve(currentPath).replace(/\[/g, '\\[').replace(/\]/g, '\\]');

    const regexp = new RegExp(`^${path}\\[([0-9]+)\\]`);

    const indexes = Object.keys(parameters).reduce((list, k) => {
      const matches = regexp.exec(k);

      if (!matches) {
        return list;
      }

      return { ...list, [matches[1]]: null };
    }, {});

    return Object.keys(indexes).map(i => construct([...currentPath, String(i)], items));
  }

  function constructObject(currentPath: string[], props: Dictionary<unknown>): object {
    return Object.keys(props).reduce((result, k) => ({ ...result, [k]: construct([...currentPath, k], props[k]) }), {});
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
