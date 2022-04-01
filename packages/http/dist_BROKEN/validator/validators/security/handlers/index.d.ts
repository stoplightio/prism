import { HttpSecurityScheme } from '@stoplight/types';
import { ValidateSecurityFn } from './utils';
import { Either } from 'fp-ts/Either';
import { IPrismDiagnostic } from '@stoplight/prism-core';
export declare function findSecurityHandler(scheme: HttpSecurityScheme): Either<IPrismDiagnostic, ValidateSecurityFn>;
