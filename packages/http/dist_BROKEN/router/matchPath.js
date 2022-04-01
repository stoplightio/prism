"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchPath = void 0;
const types_1 = require("./types");
const E = require("fp-ts/Either");
function fragmentize(path) {
    if (path.length === 0 || !path.startsWith('/')) {
        throw new Error(`Malformed path '${path}'`);
    }
    return path.split('/').slice(1).map(decodePathFragment);
}
function isTemplated(pathFragment) {
    return /{(.+)}/.test(pathFragment);
}
function decodePathFragment(pathFragment) {
    try {
        return pathFragment && decodeURIComponent(pathFragment);
    }
    catch (_) {
        return pathFragment;
    }
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function matchPath(requestPath, operationPath) {
    const operationPathFragments = fragmentize(operationPath);
    const requestPathFragments = fragmentize(requestPath);
    if (operationPathFragments.length != requestPathFragments.length) {
        return E.right(types_1.MatchType.NOMATCH);
    }
    let isTemplatedOperationPath = false;
    for (const requestPathFragment of requestPathFragments) {
        const operationPathFragment = operationPathFragments.shift();
        if (operationPathFragment === undefined) {
            return E.right(types_1.MatchType.NOMATCH);
        }
        const isTemplatedFragment = isTemplated(operationPathFragment);
        if (!isTemplatedFragment) {
            if (operationPathFragment === requestPathFragment) {
                continue;
            }
            return E.right(types_1.MatchType.NOMATCH);
        }
        const escaped = escapeRegExp(operationPathFragment);
        const captureRegExp = escaped.replace(/\\\{[^\\]+\\\}/g, '(.*)');
        const match = new RegExp(captureRegExp).exec(requestPathFragment);
        if (match == null) {
            return E.right(types_1.MatchType.NOMATCH);
        }
        isTemplatedOperationPath || (isTemplatedOperationPath = true);
    }
    return E.right(isTemplatedOperationPath ? types_1.MatchType.TEMPLATED : types_1.MatchType.CONCRETE);
}
exports.matchPath = matchPath;
