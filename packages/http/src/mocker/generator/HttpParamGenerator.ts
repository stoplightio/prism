import { IHttpContent, IHttpParam, INodeExample, INodeExternalExample } from '@stoplight/types';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { JSONSchema } from '../../types';
import { generate as generateDynamicExample } from './JSONSchema';

export function improveSchema(schema: JSONSchema): JSONSchema {
  const newSchema = { ...schema };

  if (newSchema.type === 'integer' || newSchema.type === 'number') {
    if (!newSchema.minimum) {
      newSchema.minimum = 1;
    }

    if (!newSchema.maximum) {
      newSchema.maximum = 1000;
    }
  }

  if (newSchema.type === 'string' && !newSchema.format && !newSchema.enum && !newSchema.pattern) {
    newSchema['x-faker'] = 'lorem.word';
  } else if (newSchema.type === 'object' && newSchema.properties) {
    newSchema.properties = Object.entries(newSchema.properties).reduce((r, [k, v]) => {
      r[k] = typeof v === 'boolean' ? v : improveSchema(v);
      return r;
    }, {});
  } else if (newSchema.type === 'array' && typeof newSchema.items === 'object') {
    newSchema.items = Array.isArray(newSchema.items)
      ? newSchema.items.map(subSchema => (typeof subSchema === 'boolean' ? subSchema : improveSchema(subSchema)))
      : improveSchema(newSchema.items);
  }

  return newSchema;
}

function pickStaticExample(examples: O.Option<Array<INodeExample | INodeExternalExample>>): O.Option<unknown> {
  return pipe(
    examples,
    O.chainNullableK(exs => exs[Math.floor(Math.random() * exs.length)]),
    O.chainNullableK(example => (example as INodeExample).value)
  );
}

export async function generate(param: IHttpParam | IHttpContent): Promise<O.Option<unknown>> {
  const staticExample = pipe(O.fromNullable(param.examples), pickStaticExample);

  if (O.isSome(staticExample)) {
    return staticExample;
  }

  if (param.schema) {
    const schema = improveSchema(param.schema);
    const result = await generateDynamicExample(param, {}, schema)();
    if (result._tag === 'Right') {
      return O.some(result.right);
    }
  }

  return O.none;
}
