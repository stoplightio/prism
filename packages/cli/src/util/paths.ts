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
          return serializeWithDeepObjectStyle(spec.name, value);

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
        // @todo: fixme
        Either.tryCatch(() => createPathUriTemplate(operation.path, specs), Either.toError),
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

export function createExamplePath(operation: IHttpOperation): Either.Either<Error, string> {
  return pipe(
    generateTemplateAndValuesForPathParams(operation),
    Either.chain(({ template: pTemplate, values: pValues }) => {
      return pipe(
        generateTemplateAndValuesForQueryParams(pTemplate, operation),
        Either.map(({ template: qTemplate, values: qValues }) => {
          return { template: qTemplate, values: { ...pValues, ...qValues } };
        }),
      );
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
