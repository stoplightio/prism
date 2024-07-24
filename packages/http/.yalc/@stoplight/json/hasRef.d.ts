export declare const hasRef: (obj: unknown) => obj is Record<string, unknown> & {
    $ref: string;
};
