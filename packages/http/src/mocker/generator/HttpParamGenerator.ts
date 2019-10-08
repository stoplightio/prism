import { IHttpOperation, IHttpParam, IHttpPathParam } from '@stoplight/types';
import { INodeExample, INodeExternalExample } from '@stoplight/types';
import * as Array from 'fp-ts/lib/Array';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { JSONSchema } from '../../types';
import { generate as generateDynamicExample } from './JSONSchema';

function improveSchema(schema: JSONSchema) {
  const newSchema = { ...schema };

  if (newSchema.type === 'integer') {
    if (!newSchema.minimum) {
      newSchema.minimum = 1;
    }

    if (!newSchema.maximum) {
      newSchema.maximum = 1000;
    }
  }

  if (newSchema.type === 'string') {
    if (!newSchema.format) {
      newSchema['x-faker'] = 'random.word';
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

function generateStaticExample(examples: Array<INodeExample | INodeExternalExample>): Option.Option<unknown> {
  return pipe(
    Option.fromNullable(examples),
    Option.mapNullable(exs => exs[Math.floor(Math.random() * exs.length)]),
    Option.mapNullable(example => (example as INodeExample).value),
  );
}

export function generate(param: IHttpParam): Option.Option<unknown> {
  return pipe(
    Option.fromNullable(param.examples),
    Option.chain(generateStaticExample),
    Option.alt(() =>
      pipe(
        Option.fromNullable(param.schema),
        Option.map(improveSchema),
        Option.map(generateDynamicExample),
      ),
    ),
  );
}
