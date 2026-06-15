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
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { fromPairs, identity } from 'lodash';
import { URI } from 'uri-template-lite';
import { sequenceSEither } from '../combinators';
import { ValuesTransformer } from './colorizer';

export async function createExamplePath(
  operation: IHttpOperation,
  transformValues: ValuesTransformer = identity
): Promise<E.Either<Error, string>> {
  const pathDataResult = await generateTemplateAndValuesForPathParams(operation);
  if (E.isLeft(pathDataResult)) return pathDataResult;
  const pathData = pathDataResult.right;

  const queryDataResult = await generateTemplateAndValuesForQueryParams(pathData.template, operation);
  if (E.isLeft(queryDataResult)) return queryDataResult;
  const queryData = queryDataResult.right;

  const expanded = URI.expand(queryData.template, transformValues({ ...pathData.values, ...queryData.values }));
  return E.right(expanded.replace(/\?$/, ''));
}

async function generateParamValue(spec: IHttpParam): Promise<E.Either<Error, unknown>> {
  const optionResult = await generateHttpParam(spec);

  if (O.isNone(optionResult)) {
    return E.left(new Error(`Cannot generate value for: ${spec.name}`));
  }

  const value = optionResult.value;

  switch (spec.style) {
    case HttpParamStyles.DeepObject:
      if (typeof value === 'string' || typeof value === 'object') {
        return E.right(serializeWithDeepObjectStyle(spec.name, value as string | Dictionary<unknown, string>));
      }
      return E.left(new Error('Expected string parameter'));

    case HttpParamStyles.PipeDelimited:
      if (Array.isArray(value)) {
        return E.right(serializeWithPipeDelimitedStyle(spec.name, value, spec.explode));
      }
      return E.left(new Error('Pipe delimited style is only applicable to array parameter'));

    case HttpParamStyles.SpaceDelimited:
      if (Array.isArray(value)) {
        return E.right(serializeWithSpaceDelimitedStyle(spec.name, value, spec.explode));
      }
      return E.left(new Error('Space delimited style is only applicable to array parameter'));

    default:
      return E.right(value);
  }
}

async function generateParamValues(specs: IHttpParam[]): Promise<E.Either<Error, Dictionary<unknown>>> {
  const results: Array<[string, unknown]> = [];

  for (const spec of specs) {
    if (spec == null) continue;
    const valueResult = await generateParamValue(spec);
    if (E.isLeft(valueResult)) return valueResult;
    const value = valueResult.right;
    if (value !== null) {
      results.push([encodeURI(spec.name), value]);
    }
  }

  return E.right(fromPairs(results));
}

async function generateTemplateAndValuesForPathParams(operation: IHttpOperation) {
  const specs = operation.request?.path || [];
  const values = await generateParamValues(specs);
  const template = createPathUriTemplate(operation.path, specs);

  return sequenceSEither({ values, template });
}

async function generateTemplateAndValuesForQueryParams(template: string, operation: IHttpOperation) {
  const specs = operation.request?.query || [];

  return pipe(
    await generateParamValues(specs),
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
