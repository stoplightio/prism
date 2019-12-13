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
import { pipe } from 'fp-ts/lib/pipeable';
import { get, identity } from 'lodash';
// @ts-ignore
import { URI } from 'uri-template-lite';
import { ValuesTransformer } from './colorizer';

export function createExamplePath(
  operation: IHttpOperation,
  transformValues: ValuesTransformer = identity
): E.Either<Error, string> {
  return pipe(
    generateTemplateAndValuesForPathParams(operation),
    E.chain(({ template: pathTemplate, values: pathValues }) =>
      pipe(
        generateTemplateAndValuesForQueryParams(pathTemplate, operation),
        E.map(({ template: queryTemplate, values: queryValues }) => {
          return { template: queryTemplate, values: { ...pathValues, ...queryValues } };
        })
      )
    ),
    E.map(({ template, values }) => URI.expand(template, transformValues(values)))
  );
}

function generateParamValue(spec: IHttpParam): E.Either<Error, unknown> {
  return pipe(
    generateHttpParam(spec),
    E.fromOption(() => new Error(`Cannot generate value for: ${spec.name}`)),
    E.chain(value => {
      switch (spec.style) {
        case HttpParamStyles.DeepObject:
          return E.right(serializeWithDeepObjectStyle(spec.name, value));

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

function generateParamValues(specs: IHttpParam[]) {
  return specs.reduce(
    (valuesOrError: E.Either<Error, Dictionary<unknown, string>>, spec) =>
      pipe(
        valuesOrError,
        E.chain(values =>
          pipe(
            generateParamValue(spec),
            E.map(value => ({
              ...values,
              [spec.name]: value,
            }))
          )
        )
      ),
    E.right({})
  );
}

function generateTemplateAndValuesForPathParams(operation: IHttpOperation) {
  const specs = get(operation, 'request.path', []);

  return pipe(
    generateParamValues(specs),
    E.chain(values =>
      pipe(
        createPathUriTemplate(operation.path, specs),
        E.map(template => ({ template, values }))
      )
    )
  );
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
  return specs
    .filter(spec => spec.required !== false)
    .reduce(
      (pathOrError: E.Either<Error, string>, spec) =>
        pipe(
          pathOrError,
          E.chain(path =>
            pipe(
              createParamUriTemplate(spec.name, spec.style || HttpParamStyles.Simple, spec.explode || false),
              E.map(template => path.replace(`{${spec.name}}`, template))
            )
          )
        ),
      E.right(inputPath)
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
