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
import * as Either from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
// @ts-ignore
import { parse } from 'uri-template';

export function createExamplePath(operation: IHttpOperation): Either.Either<Error, string> {
  return pipe(
    generateTemplateAndValuesForPathParams(operation),
    Either.chain(({ template: pathTemplate, values: pathValues }) => {
      return pipe(
        generateTemplateAndValuesForQueryParams(pathTemplate, operation),
        Either.map(({ template: queryTemplate, values: queryValues }) => {
          return { template: queryTemplate, values: { ...pathValues, ...queryValues } };
        }),
      );
    }),
    Either.map(({ template, values }) => parse(template).expand(values)),
  );
}

function generateParamValue(spec: IHttpParam): Either.Either<Error, unknown> {
  return pipe(
    generate(spec),
    Either.fromOption(() => new Error(`Cannot generate value for: ${spec.name}`)),
    Either.chain(value => {
      switch (spec.style) {
        case HttpParamStyles.DeepObject:
          return Either.right(serializeWithDeepObjectStyle(spec.name, value));

        case HttpParamStyles.PipeDelimited:
          if (Array.isArray(value)) {
            return Either.right(
              serializeWithPipeDelimitedStyle(spec.name, value as Array<string | number | boolean>, spec.explode),
            );
          } else {
            return Either.left(new Error('Pipe delimited style is only applicable to array parameter'));
          }

        case HttpParamStyles.SpaceDelimited:
          if (Array.isArray(value)) {
            return Either.right(
              serializeWithSpaceDelimitedStyle(spec.name, value as Array<string | number | boolean>, spec.explode),
            );
          } else {
            return Either.left(new Error('Space delimited style is only applicable to array parameter'));
          }

        default:
          return Either.right(value);
      }
    }),
  );
}

function generateParamValues(specs: IHttpParam[]) {
  return specs.reduce((valuesOrError: Either.Either<Error, Dictionary<unknown, string>>, spec) => {
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
  }, Either.right({}));
}

function generateTemplateAndValuesForPathParams(operation: IHttpOperation) {
  const specs = get(operation, 'request.path', []);

  return pipe(
    generateParamValues(specs),
    Either.chain(values => {
      return pipe(
        createPathUriTemplate(operation.path, specs),
        Either.map(template => ({ template, values })),
      );
    }),
  );
}

function generateTemplateAndValuesForQueryParams(template: string, operation: IHttpOperation) {
  const specs = get(operation, 'request.query', []);

  return pipe(
    generateParamValues(specs),
    Either.map(values => ({ template: createQueryUriTemplate(template, specs), values })),
  );
}

function createPathUriTemplate(inputPath: string, specs: IHttpPathParam[]): Either.Either<Error, string> {
  // defaults for query: style=Simple exploded=false
  return specs.filter(spec => spec.required !== false).reduce((pathOrError: Either.Either<Error, string>, spec) => {
    return pipe(
      pathOrError,
      Either.chain(path => {
        return pipe(
          createParamUriTemplate(spec.name, spec.style || HttpParamStyles.Simple, spec.explode || false),
          Either.map(template => path.replace(`{${spec.name}}`, template)),
        );
      }),
    );
  }, Either.right(inputPath));
}

function createParamUriTemplate(name: string, style: HttpParamStyles, explode: boolean) {
  const starOrVoid = explode ? '*' : '';
  switch (style) {
    case HttpParamStyles.Simple:
      return Either.right(`{${name}${starOrVoid}}`);

    case HttpParamStyles.Label:
      return Either.right(`{.${name}${starOrVoid}}`);

    case HttpParamStyles.Matrix:
      return Either.right(`{;${name}${starOrVoid}}`);

    default:
      return Either.left(new Error(`Unsupported parameter style: ${style}`));
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
