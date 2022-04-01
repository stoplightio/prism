import { IHttpRequest } from '../../../../types';
export declare const httpDigest: (input: Pick<IHttpRequest, 'headers' | 'url'>) => import("fp-ts/Either").Right<unknown> | import("fp-ts/Either").Left<import("../../../../../../core/src").IPrismDiagnostic>;
