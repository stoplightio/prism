import {
  generateHttpParam,
  serializeWithDeepObjectStyle,
  serializeWithPipeDelimitedStyle,
  serializeWithSpaceDelimitedStyle,
} from '@stoplight/prism-http';
import {
  Dictionary,
  HttpParamStyles,
  IHttpOperation,
  IHttpParam,
  IHttpPathParam,
  IHttpQueryParam,
} from '@stoplight/types';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import { Do } from 'fp-ts-contrib/lib/Do';
import { get, identity, fromPairs } from 'lodash';
import { URI } from 'uri-template-lite';
import { ValuesTransformer } from './colorizer';
import { sequenceS } from 'fp-ts/lib/Apply';

const traverseEither = A.array.traverse(E.either);
const sequenceSEither = sequenceS(E.either);
const DoEither = Do(E.either);

export function createExamplePath(
  operation: IHttpOperation,
  transformValues: ValuesTransformer = identity
): E.Either<Error, string> {
  return DoEither.bind('pathData', generateTemplateAndValuesForPathParams(operation))
    .bindL('queryData', ({ pathData }) => generateTemplateAndValuesForQueryParams(pathData.template, operation))
    .return(({ pathData, queryData }) =>
      URI.expand(queryData.template, transformValues({ ...pathData.values, ...queryData.values }))
    );
}

function generateParamValue(spec: IHttpParam): E.Either<Error, unknown> {
  return pipe(
    generateHttpParam(spec),
    E.fromOption(() => new Error(`Cannot generate value for: ${spec.name}`)),
    E.chain(value => {
      switch (spec.style) {
        case HttpParamStyles.DeepObject:
          return pipe(
            value,
            E.fromPredicate(
              (value: unknown): value is string | Dictionary<unknown, string> =>
                typeof value === 'string' || typeof value === 'object',
              () => new Error('Expected string parameter')
            ),
            E.map(value => serializeWithDeepObjectStyle(spec.name, value))
          );

        case HttpParamStyles.PipeDelimited:
          return pipe(
            value,
            E.fromPredicate(
              Array.isArray,
              () => new Error('Pipe delimited style is only applicable to array parameter')
            ),
            E.map(v => serializeWithPipeDelimitedStyle(spec.name, v, spec.explode))
          );

        case HttpParamStyles.SpaceDelimited:
          return pipe(
            value,
            E.fromPredicate(
              Array.isArray,
              () => new Error('Space delimited style is only applicable to array parameter')
            ),
            E.map(v => serializeWithSpaceDelimitedStyle(spec.name, v, spec.explode))
          );

        default:
          return E.right(value);
      }
    })
  );
}

function generateParamValues(specs: IHttpParam[]): E.Either<Error, Dictionary<unknown>> {
  return pipe(
    traverseEither(specs, spec =>
      pipe(
        generateParamValue(spec),
        E.map(value => [spec.name, value])
      )
    ),
    E.map(fromPairs)
  );
}

function generateTemplateAndValuesForPathParams(operation: IHttpOperation) {
  const specs = get(operation, 'request.path', []);

  return sequenceSEither({
    values: generateParamValues(specs),
    template: createPathUriTemplate(operation.path, specs),
  });
}

function generateTemplateAndValuesForQueryParams(template: string, operation: IHttpOperation) {
  const specs = get(operation, 'request.query', []);

  return pipe(
    generateParamValues(specs),
    E.map(values => ({ template: createQueryUriTemplate(template, specs), values }))
  );
}

function createPathUriTemplate(inputPath: string, specs: IHttpPathParam[]): E.Either<Error, string> {
  // defaults for query: style=Simple exploded=false
  return pipe(
    traverseEither(
      specs.filter(spec => spec.required !== false),
      spec =>
        pipe(
          createParamUriTemplate(spec.name, spec.style || HttpParamStyles.Simple, spec.explode || false),
          E.map(param => ({ param, name: spec.name }))
        )
    ),
    E.map(values => values.reduce((acc, current) => acc.replace(`{${current.name}}`, current.param), inputPath))
  );
}

function createParamUriTemplate(name: string, style: HttpParamStyles, explode: boolean) {
  const starOrVoid = explode ? '*' : '';
  switch (style) {
    case HttpParamStyles.Simple:
      return E.right(`{${name}${starOrVoid}}`);

    case HttpParamStyles.Label:
      return E.right(`{.${name}${starOrVoid}}`);

    case HttpParamStyles.Matrix:
      return E.right(`{;${name}${starOrVoid}}`);

    default:
      return E.left(new Error(`Unsupported parameter style: ${style}`));
  }
}

function createQueryUriTemplate(path: string, specs: IHttpQueryParam[]) {
  // defaults for query: style=Form exploded=false
  const formSpecs = specs.filter(spec => (spec.style || HttpParamStyles.Form) === HttpParamStyles.Form);

  const formExplodedParams = formSpecs
    .filter(spec => spec.required !== false)
    .filter(spec => spec.explode)
    .map(spec => spec.name)
    .join(',');

  const formImplodedParams = formSpecs
    .filter(spec => spec.required !== false)
    .filter(spec => !spec.explode)
    .map(spec => spec.name)
    .join(',');

  const restParams = specs
    .filter(spec => spec.required !== false)
    .filter(spec =>
      [HttpParamStyles.DeepObject, HttpParamStyles.SpaceDelimited, HttpParamStyles.PipeDelimited].includes(spec.style)
    )
    .map(spec => spec.name)
    .map(name => `{+${name}}`)
    .join('&');

  if (formExplodedParams) {
    path += `{?${formExplodedParams}*}`;
  }

  if (formImplodedParams) {
    path += `{${formExplodedParams ? '&' : '?'}${formImplodedParams}}`;
  }

  if (restParams) {
    path += `${formExplodedParams || formImplodedParams ? '&' : '?'}${restParams}`;
  }

  return path;
}
