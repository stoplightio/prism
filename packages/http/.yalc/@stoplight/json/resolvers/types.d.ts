import { JsonPath } from '@stoplight/types';
export declare type ResolvedRef<Source extends string | null = null> = {
    source: Source;
    location: JsonPath;
    value: unknown;
};
