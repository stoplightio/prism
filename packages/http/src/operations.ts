import { IHttpOperation, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
import { isSome } from 'fp-ts/lib/Option';
import { createJsonSchemaFromParams, IMediaTypeContentEx, stripReadOnlyProperties, stripWriteOnlyProperties } from '.';
import { IHttpOperationEx, IHttpOperationResponseEx, JSONSchema, JSONSchemaEx } from './types';
import { ValidationContext } from './validator/validators/types';

const EMPTY_SCHEMA: JSONSchema = {};

const bundle = (schema: JSONSchema, bundle?: unknown): JSONSchemaEx => {
  return {
    ...schema,
    __bundled__: bundle,
  };
};

export const enrichAllMediaTypeContentsWithPreGeneratedValidationSchema = (
  mediaTypeContents: IMediaTypeContent[],
  validationContext: ValidationContext,
  bundled?: unknown
): IMediaTypeContentEx[] => {
  mediaTypeContents.forEach(mtc => {
    const mtcEx = mtc as IMediaTypeContentEx;

    mtcEx.contentValidatingSchema = EMPTY_SCHEMA;
    if (mtcEx.schema !== undefined) {
      const newLocal =
        validationContext == ValidationContext.Output
          ? stripWriteOnlyProperties(mtcEx.schema)
          : stripReadOnlyProperties(mtcEx.schema);

      if (isSome(newLocal)) {
        mtcEx.contentValidatingSchema = bundle(newLocal.value, bundled);
      }
    }
  });

  return mediaTypeContents as IMediaTypeContentEx[];
};

export const enrichAllResponsesWithPreGeneratedValidationSchema = (
  responses: IHttpOperationResponse[],
  bundled?: unknown
): IHttpOperationResponseEx[] => {
  responses.forEach(res => {
    const resEx = res as IHttpOperationResponseEx;

    resEx.headersValidatingSchema = EMPTY_SCHEMA;
    if (resEx.headers !== undefined) {
      resEx.headersValidatingSchema = bundle(createJsonSchemaFromParams(resEx.headers), bundled);
    }

    if (resEx.contents !== undefined) {
      enrichAllMediaTypeContentsWithPreGeneratedValidationSchema(resEx.contents, ValidationContext.Output, bundled);
    }
  });

  return responses as IHttpOperationResponseEx[];
};

export const enrichOperationWithPreGeneratedValidationSchema = (op: IHttpOperation): IHttpOperationEx => {
  const opEx = op as IHttpOperationEx;
  const bundled = opEx['__bundled__'];

  if (opEx.request !== undefined) {
    opEx.request.headersValidatingSchema = EMPTY_SCHEMA;
    if (opEx.request.headers !== undefined) {
      opEx.request.headersValidatingSchema = bundle(
        createJsonSchemaFromParams(opEx.request.headers),
        opEx['__bundled__']
      );
    }

    opEx.request.pathValidatingSchema = EMPTY_SCHEMA;
    if (opEx.request.path !== undefined) {
      opEx.request.pathValidatingSchema = bundle(createJsonSchemaFromParams(opEx.request.path), bundled);
    }

    opEx.request.queryValidatingSchema = EMPTY_SCHEMA;
    if (opEx.request.query !== undefined) {
      opEx.request.queryValidatingSchema = bundle(createJsonSchemaFromParams(opEx.request.query), bundled);
    }

    if (opEx.request.body !== undefined) {
      if (opEx.request.body.contents !== undefined) {
        enrichAllMediaTypeContentsWithPreGeneratedValidationSchema(
          opEx.request.body.contents,
          ValidationContext.Input,
          bundled
        );
      }
    }
  }

  enrichAllResponsesWithPreGeneratedValidationSchema(opEx.responses, bundled);

  return opEx;
};

export const enrichAllOperationsWithPreGeneratedValidationSchema = (
  operations: IHttpOperation[]
): IHttpOperationEx[] => {
  operations.forEach(op => enrichOperationWithPreGeneratedValidationSchema(op));

  return operations as IHttpOperationEx[];
};
