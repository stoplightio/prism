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
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as ROA from 'fp-ts/ReadonlyArray';
import { pipe } from 'fp-ts/function';
import { fromPairs, identity } from 'lodash';
import { URI } from 'uri-template-lite';
import { sequenceSEither } from '../combinators';
import { ValuesTransformer } from './colorizer';

export function createExamplePath(
  operation: IHttpOperation,
  transformValues: ValuesTransformer = identity
): E.Either<Error, string> {
  return pipe(
    E.Do,
    E.bind('pathData', () => generateTemplateAndValuesForPathParams(operation)),
    E.bind('queryData', ({ pathData }) => generateTemplateAndValuesForQueryParams(pathData.template, operation)),
    E.map(({ pathData, queryData }) =>
      URI.expand(queryData.template, transformValues({ ...pathData.values, ...queryData.values }))
    ),
    E.map(path => path.replace(/\?$/, ''))
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
    specs,
    A.map(O.fromNullable),
    A.compact,
    E.traverseArray(spec =>
      pipe(
        generateParamValue(spec),
        E.map(value => [encodeURI(spec.name), value]),
        E.map(O.fromPredicate(([_, value]) => value !== null))
      )
    ),
    E.map(ROA.compact),
    E.map(fromPairs)
  );
}

function generateTemplateAndValuesForPathParams(operation: IHttpOperation) {
  const specs = operation.request?.path || [];

  return sequenceSEither({
    values: generateParamValues(specs),
    template: createPathUriTemplate(operation.path, specs),
  });
}

function generateTemplateAndValuesForQueryParams(template: string, operation: IHttpOperation) {
  const specs = operation.request?.query || [];

  return pipe(
    generateParamValues(specs),
    E.map(values => ({ template: createQueryUriTemplate(template, specs), values }))
  );
}

function createPathUriTemplate(inputPath: string, specs: IHttpPathParam[]): E.Either<Error, string> {
  // defaults for query: style=Simple exploded=false
  return pipe(
    specs.filter(spec => spec.required !== false),
    E.traverseArray(spec =>
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
  // defaults for query: style=Form
  // when query is style == form, default exploded=false
  const formSpecs = specs
    .filter(spec => (spec.style || HttpParamStyles.Form) === HttpParamStyles.Form)
    .map(spec => {
      spec.name = encodeURI(spec.name);
      // default explode for form style query params is true
      if (spec.explode === undefined) {
        spec.explode = true;
      }
      return spec;
    });

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
