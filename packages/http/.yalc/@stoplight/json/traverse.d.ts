import { JsonPath, Segment } from '@stoplight/types';
declare type Hooks = {
    onEnter(ctx: Readonly<{
        value: object;
        path: JsonPath;
    }>): void;
    onLeave(ctx: Readonly<{
        value: object;
        path: JsonPath;
    }>): void;
    onProperty(ctx: Readonly<{
        parent: object;
        parentPath: JsonPath;
        property: Segment;
        propertyValue: unknown;
    }>): void;
};
export declare const traverse: (obj: unknown, hooks: Partial<Hooks> | Hooks['onProperty']) => void;
export {};
