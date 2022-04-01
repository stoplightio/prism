import { IHttpQueryParam } from '@stoplight/types';
import type { IHttpNameValues } from '../../types';
export declare const validate: (target: IHttpNameValues, specs: IHttpQueryParam[], bundle?: unknown) => import("fp-ts/lib/Either").Either<import("fp-ts/lib/NonEmptyArray").NonEmptyArray<import("../../../../core/src").IPrismDiagnostic>, IHttpNameValues>;
