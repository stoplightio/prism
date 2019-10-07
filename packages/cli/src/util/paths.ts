import { generate } from '@stoplight/prism-http/src/mocker/generator/HttpParamGenerator';
import { serializeWithDeepObjectStyle } from '@stoplight/prism-http/src/mocker/serializer/style/deepObject';
import {
  serializeWithPipeDelimitedStyle,
  serializeWithSpaceDelimitedStyle,
} from '@stoplight/prism-http/src/mocker/serializer/style/delimited';
import {
  Dictionary,
  HttpParamStyles,
  IHttpOperation,
  IHttpParam,
  IHttpPathParam,
  IHttpQueryParam,
  INodeExample,
  INodeExternalExample,
} from '@stoplight/types';
import * as Array from 'fp-ts/lib/Array';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
// @ts-ignore
import { parse } from 'uri-template';

function generateParamValue(spec: IHttpParam): Either.Either<Error, unknown> {
  return pipe(
    generate(spec),
    Either.fromOption(() => new Error(`Cannot generate value for: ${spec.name}`)),
    Either.chain(value => {
      switch (spec.style) {
        case HttpParamStyles.DeepObject:
          return Either.right(serializeWithDeepObjectStyle(spec.name, value));

        case HttpParamStyles.PipeDelimited:
          return serializeWithPipeDelimitedStyle(spec.name, value as Array<string | number | boolean>, spec.explode);

        case HttpParamStyles.SpaceDelimited:
          return serializeWithSpaceDelimitedStyle(spec.name, value as Array<string | number | boolean>, spec.explode);

        default:
          return Either.right(value);
      }
    }),
  );
}

function generateParamValues(specs: IHttpParam[]) {
  return specs.reduce((valuesOrError: Either.Either<Error, Option.Option<Dictionary<unknown, string>>>, spec) => {
    return pipe(
      valuesOrError,
      Either.chain(values =>
        pipe(
          generateParamValue(spec),
          Either.map(value => ({
            ...values,
            [spec.name]: value,
          })),
        ),
      ),
    );
  }, Either.right(Option.some({})));
}

export function createExamplePath(operation: IHttpOperation): Either.Either<Error, string> {
  return pipe(
    Either.tryCatch(() => {
      const specs = get(operation, 'request.path', []);
      return {
        template: createPathUriTemplate(operation.path, specs),
        values: Either.fold(
          e => {
            throw e;
          },
          v => v,
        )(generateParamValues(specs)),
      };
    }, Either.toError),
    Either.chain(({ template, values }) => {
      const specs = get(operation, 'request.query', []);
      try {
        return Either.right({
          template: createQueryUriTemplate(template, specs),
          values: {
            ...values,
            ...Either.fold(
              e => {
                throw e;
              },
              v => v,
            )(generateParamValues(specs)),
          },
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
  return specs
    .filter(spec => spec.required !== false)
    .reduce(
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
