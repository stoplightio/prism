import { IHttpPathParam } from '@stoplight/types';
import { IHttpNameValue } from '../../types';
export declare const validate: (target: IHttpNameValue, specs: IHttpPathParam[], bundle?: unknown) => import("fp-ts/lib/Either").Either<import("fp-ts/lib/NonEmptyArray").NonEmptyArray<import("../../../../core/src").IPrismDiagnostic>, IHttpNameValue>;
