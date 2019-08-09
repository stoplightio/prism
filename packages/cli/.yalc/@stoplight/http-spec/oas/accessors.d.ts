export declare function getOasParameters<ParamType extends {
    name: string;
    in: string;
}>(operationParameters: ParamType[] | undefined, pathParameters: ParamType[] | undefined): ParamType[];
