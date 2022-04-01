import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { IHttpOperation, IMediaTypeContent } from '@stoplight/types';
import * as E from 'fp-ts/Either';
import { IHttpRequest, IHttpResponse } from '../types';
import { NonEmptyArray } from 'fp-ts/NonEmptyArray';
export { validateSecurity } from './validators/security';
export declare const validateInput: ValidatorFn<IHttpOperation, IHttpRequest>;
export declare const validateMediaType: (contents: NonEmptyArray<IMediaTypeContent>, mediaType: string) => E.Either<NonEmptyArray<IPrismDiagnostic>, IMediaTypeContent>;
export declare const validateOutput: ValidatorFn<IHttpOperation, IHttpResponse>;
