"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
exports.createOas3SourceMap = () => {
    return [
        {
            match: 'info',
            type: types_1.NodeTypes.Info,
        },
        {
            match: 'paths',
            type: types_1.NodeTypes.Paths,
            children: [
                {
                    notMatch: '^x-',
                    type: types_1.NodeTypes.Path,
                    children: [
                        {
                            match: 'get|post|put|delete|options|head|patch|trace',
                            type: types_1.NodeTypes.Operation,
                        },
                    ],
                },
            ],
        },
        {
            match: 'components',
            type: types_1.NodeTypes.Components,
            children: [
                {
                    match: 'schemas',
                    type: types_1.NodeTypes.Models,
                    children: [
                        {
                            notMatch: '^x-',
                            type: types_1.NodeTypes.Model,
                            subtype: 'json_schema',
                        },
                    ],
                },
                parameters(types_1.NodeTypes.Shared),
                responses(types_1.NodeTypes.Shared),
                headers(types_1.NodeTypes.Shared),
                requestBodies(types_1.NodeTypes.Shared),
                examples(types_1.NodeTypes.Shared),
            ],
        },
    ];
};
const headers = (headerSource) => ({
    type: `${headerSource}_response`,
    match: 'headers',
    children: [
        {
            type: types_1.NodeTypes.Header,
        },
    ],
});
const responses = (responseSource) => ({
    match: 'responses',
    type: 'oas3_responses',
    children: [
        {
            notMatch: '^x-',
            type: responseSource === types_1.NodeTypes.Shared ? types_1.NodeTypes.SharedResponse : types_1.NodeTypes.OperationResponse,
        },
    ],
});
const requestBodies = (responseSource) => ({
    match: 'requestBody',
    type: types_1.NodeTypes.RequestBodies,
    children: [
        {
            notMatch: '^x-',
            type: responseSource === types_1.NodeTypes.Shared ? types_1.NodeTypes.SharedRequestBody : types_1.NodeTypes.OperationRequestBody,
        },
    ],
});
const parameters = (parameterSource) => {
    let type;
    switch (parameterSource) {
        case types_1.NodeTypes.Shared:
            type = types_1.NodeTypes.SharedParameter;
            break;
        case types_1.NodeTypes.Operation:
            type = types_1.NodeTypes.OperationParameter;
            break;
        case types_1.NodeTypes.Path:
            type = types_1.NodeTypes.PathParameter;
            break;
        default:
            type = types_1.NodeTypes.Parameter;
            break;
    }
    return {
        match: 'parameters',
        type: types_1.NodeTypes.Parameters,
        children: [
            {
                field: 'in',
                match: 'path',
                type,
                subtype: 'path',
            },
            {
                field: 'in',
                match: 'header',
                type,
                subtype: 'header',
            },
            {
                field: 'in',
                match: 'query',
                type,
                subtype: 'query',
            },
            {
                field: 'in',
                match: 'body',
                type,
                subtype: 'body',
            },
            {
                type,
            },
        ],
    };
};
const examples = (exampleSource) => ({
    type: exampleSource === types_1.NodeTypes.Shared ? types_1.NodeTypes.SharedExamples : types_1.NodeTypes.ResponseExamples,
    match: 'examples',
    children: [
        {
            type: types_1.NodeTypes.Example,
        },
    ],
});
//# sourceMappingURL=sourceMap.js.map