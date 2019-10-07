import { IHttpOperation, IHttpParam, IHttpPathParam } from '@stoplight/types';
import { INodeExample, INodeExternalExample } from '@stoplight/types';
import * as Array from 'fp-ts/lib/Array';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { generate as generateDynamicExample } from './JSONSchema';

function generateStaticExample(examples: Array<INodeExample | INodeExternalExample>) {
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
        Option.map(generateDynamicExample),
      ),
    ),
  );
}
