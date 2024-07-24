import { JsonPath } from '@stoplight/types';
export declare const BUNDLE_ROOT = "#/__bundled__";
export declare const ERRORS_ROOT = "#/__errors__";
declare type KeyProviderFn = (props: {
    document: unknown;
    path: JsonPath;
}) => string | void | undefined | null;
export declare const bundleTarget: <T = unknown>({ document, path, bundleRoot, errorsRoot, cloneDocument, keyProvider, }: {
    document: T;
    path: string;
    bundleRoot?: string | undefined;
    errorsRoot?: string | undefined;
    cloneDocument?: boolean | undefined;
    keyProvider?: KeyProviderFn | undefined;
}, cur?: unknown) => any;
export {};
