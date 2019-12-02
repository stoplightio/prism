import { IHttpContent, IHttpParam, INodeExample, INodeExternalExample } from '@stoplight/types';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
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

  if (newSchema.type === 'string') {
    if (!newSchema.format && !newSchema.enum && !newSchema.pattern) {
      newSchema['x-faker'] = 'lorem.word';
    }
  }

  if (newSchema.type === 'object') {
    if (newSchema.properties) {
      newSchema.properties = Object.entries(newSchema.properties).reduce((r, [k, v]) => {
        r[k] = improveSchema(v);
        return r;
      }, {});
    }
  }

  if (newSchema.type === 'array') {
    if (typeof newSchema.items === 'object') {
      newSchema.items = improveSchema(newSchema.items);
    }
  }

  return newSchema;
}

function pickStaticExample(
  examples: Option.Option<Array<INodeExample | INodeExternalExample>>
): Option.Option<unknown> {
  return pipe(
    examples,
    Option.mapNullable(exs => exs[Math.floor(Math.random() * exs.length)]),
    Option.mapNullable(example => (example as INodeExample).value)
  );
}

export function generate(param: IHttpParam | IHttpContent): Option.Option<unknown> {
  return pipe(
    Option.fromNullable(param.examples),
    pickStaticExample,
    Option.alt(() =>
      pipe(
        Option.fromNullable(param.schema),
        Option.map(improveSchema),
        Option.chain(schema => Option.fromEither(generateDynamicExample(schema)))
      )
    )
  );
}
