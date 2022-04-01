import { IHttpRequest } from '../../../../types';
export declare const apiKeyInCookie: (input: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => import("fp-ts/lib/Either").Either<import("../../../../../../core/src").IPrismDiagnostic, boolean>;
export declare const apiKeyInHeader: (input: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => import("fp-ts/lib/Either").Either<import("../../../../../../core/src").IPrismDiagnostic, boolean>;
export declare const apiKeyInQuery: (input: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => import("fp-ts/lib/Either").Either<import("../../../../../../core/src").IPrismDiagnostic, boolean>;
