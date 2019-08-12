/// <reference types="urijs" />
export declare function uniqFlatMap<T>(collection?: T[]): string[][];
export declare function URI(url?: string | uri.URI): {
    scheme: (type?: string) => any;
    host: (host?: string) => any;
    port: (port?: string) => any;
    path: (path?: string) => any;
    pointer: (pathOrPointer: string | string[]) => any;
    toString: () => string;
    append: (path?: string) => any;
};
