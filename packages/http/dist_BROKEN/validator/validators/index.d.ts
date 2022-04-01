declare const obj: {
    validateQuery: (target: import("../..").IHttpNameValues, specs: import("@stoplight/types").IHttpQueryParam[], bundle?: unknown) => import("fp-ts/lib/Either").Either<import("fp-ts/lib/NonEmptyArray").NonEmptyArray<import("../../../../core/src").IPrismDiagnostic>, import("../..").IHttpNameValues>;
    validatePath: (target: import("../..").IHttpNameValue, specs: import("@stoplight/types").IHttpPathParam[], bundle?: unknown) => import("fp-ts/lib/Either").Either<import("fp-ts/lib/NonEmptyArray").NonEmptyArray<import("../../../../core/src").IPrismDiagnostic>, import("../..").IHttpNameValue>;
    validateHeaders: (target: import("../..").IHttpNameValue, specs: import("@stoplight/types").IHttpPathParam[], bundle?: unknown) => import("fp-ts/lib/Either").Either<import("fp-ts/lib/NonEmptyArray").NonEmptyArray<import("../../../../core/src").IPrismDiagnostic>, import("../..").IHttpNameValue>;
    validateBody: import("./types").validateFn<unknown, import("@stoplight/types").IMediaTypeContent>;
};
export = obj;
