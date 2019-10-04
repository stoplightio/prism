import { generate } from '@stoplight/prism-http/src/mocker/generator/HttpParamGenerator';
import { serializeWithDeepObjectStyle } from '@stoplight/prism-http/src/mocker/serializer/style/deepObject';
import {
  serializeWithCommaDelimitedStyle,
  serializeWithPipeDelimitedStyle,
  serializeWithSpaceDelimitedStyle,
} from '@stoplight/prism-http/src/mocker/serializer/style/delimited';
import {
  HttpParamStyles,
  IHttpOperation,
  IHttpParam,
  IHttpPathParam,
  IHttpQueryParam,
  INodeExample,
  INodeExternalExample,
} from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
// @ts-ignore
const { parse } = require('uri-template');

function generateParamValues(specs: IHttpParam[]) {
  return specs.reduce((values, spec) => {
    const value = Option.toUndefined(generate(spec));
    switch (spec.style) {
      case HttpParamStyles.DeepObject:
        values[spec.name] = serializeWithDeepObjectStyle(spec.name, value);
        break;

      case HttpParamStyles.PipeDelimited:
        values[spec.name] = serializeWithPipeDelimitedStyle(
          spec.name,
          value as Array<string | number | boolean>,
          spec.explode,
        );
        break;

      case HttpParamStyles.SpaceDelimited:
        values[spec.name] = serializeWithSpaceDelimitedStyle(
          spec.name,
          value as Array<string | number | boolean>,
          spec.explode,
        );
        break;

      default:
        values[spec.name] = value;
    }
    return values;
  }, {});
}

export function createExamplePath(operation: IHttpOperation): Either.Either<Error, string> {
  return pipe(
    Either.tryCatch(() => {
      const specs = get(operation, 'request.path', []);
      return { template: createPathUriTemplate(operation.path, specs), values: generateParamValues(specs) };
    }, Either.toError),
    Either.chain(({ template, values }) => {
      const specs = get(operation, 'request.query', []);
      try {
        return Either.right({
          template: createQueryUriTemplate(template, specs),
          values: { ...values, ...generateParamValues(specs) },
        });
      } catch (e) {
        return Either.left(e);
      }
    }),
    Either.map(({ template, values }) => parse(template).expand(values)),
  );
}

function createPathUriTemplate(path: string, specs: IHttpPathParam[]) {
  // defaults for query: style=Simple exploded=false
  return specs.reduce(
    (p, spec) =>
      path.replace(
        `{${spec.name}}`,
        createParamUriTemplate(spec.name, spec.style || HttpParamStyles.Simple, spec.explode || false),
      ),
    path,
  );
}

function createQueryUriTemplate(path: string, specs: IHttpQueryParam[]) {
  // defaults for query: style=Form exploded=false
  const formSpecs = specs.filter(spec => (spec.style || HttpParamStyles.Form) === HttpParamStyles.Form);
  const formExplodedParams = formSpecs
    .filter(spec => spec.explode)
    .map(spec => spec.name)
    .join(',');
  const formImplodedParams = formSpecs
    .filter(spec => !spec.explode)
    .map(spec => spec.name)
    .join(',');
  const restParams = specs
    .filter(spec =>
      [HttpParamStyles.DeepObject, HttpParamStyles.SpaceDelimited, HttpParamStyles.PipeDelimited].includes(spec.style),
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

function createParamUriTemplate(name: string, style: HttpParamStyles, explode: boolean) {
  const starOrVoid = explode ? '*' : '';
  switch (style) {
    case HttpParamStyles.Simple:
      return `{${name}${starOrVoid}}`;
    case HttpParamStyles.Label:
      return `{.${name}${starOrVoid}}`;
    case HttpParamStyles.Matrix:
      return `{;${name}${starOrVoid}}`;
    default:
      throw new Error(`Unsupported parameter style: ${style}`);
  }
}
