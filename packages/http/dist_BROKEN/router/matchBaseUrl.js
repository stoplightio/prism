"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTemplateToRegExp = exports.matchBaseUrl = void 0;
const E = require("fp-ts/Either");
const function_1 = require("fp-ts/function");
const types_1 = require("./types");
const variableRegexp = /{(.*?)}/g;
function matchBaseUrl(server, baseUrl) {
    return function_1.pipe(convertTemplateToRegExp(server.url, server.variables), E.map(regex => regex.exec(baseUrl)), E.map(matches => (matches ? (matches.length > 1 ? types_1.MatchType.TEMPLATED : types_1.MatchType.CONCRETE) : types_1.MatchType.NOMATCH)));
}
exports.matchBaseUrl = matchBaseUrl;
function convertTemplateToRegExp(urlTemplate, variables) {
    return function_1.pipe(variables ? replaceString(variables, urlTemplate) : E.right(urlTemplate), E.map(regexString => new RegExp(`^${regexString}$`)));
    function replaceString(vars, input) {
        return E.tryCatch(() => replaceStringUnsafe(input), E.toError);
        function replaceStringUnsafe(input) {
            return input.replace(variableRegexp, (_match, variableName) => {
                const variable = vars[variableName];
                if (!variable) {
                    throw new Error(`Variable '${variableName}' is not defined, cannot parse input.`);
                }
                let { enum: enums } = variable;
                if (enums) {
                    enums = enums.sort((a, b) => b.length - a.length);
                }
                return `(${enums && enums.length ? enums.join('|') : '.*?'})`;
            });
        }
    }
}
exports.convertTemplateToRegExp = convertTemplateToRegExp;
