"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const E = require("fp-ts/Either");
const A = require("fp-ts/Array");
const function_1 = require("fp-ts/function");
const types_1 = require("../types");
const errors_1 = require("./errors");
const matchBaseUrl_1 = require("./matchBaseUrl");
const matchPath_1 = require("./matchPath");
const types_2 = require("./types");
const route = ({ resources, input }) => {
    const { path: requestPath, baseUrl: requestBaseUrl } = input.url;
    if (!requestPath.startsWith('/')) {
        return E.left(new Error(`The request path '${requestPath}' must start with a slash.`));
    }
    return function_1.pipe(resources, E.fromPredicate(A.isNonEmpty, () => types_1.ProblemJsonError.fromTemplate(errors_1.NO_RESOURCE_PROVIDED_ERROR, `The current document does not have any resource to match with.`)), E.chain(resources => E.sequenceArray(resources.map(resource => function_1.pipe(matchPath_1.matchPath(requestPath, resource.path), E.chain(pathMatch => {
        if (pathMatch === types_2.MatchType.NOMATCH)
            return E.right({
                pathMatch,
                methodMatch: types_2.MatchType.NOMATCH,
                resource,
            });
        const methodMatch = matchByMethod(input, resource) ? types_2.MatchType.CONCRETE : types_2.MatchType.NOMATCH;
        if (methodMatch === types_2.MatchType.NOMATCH) {
            return E.right({
                pathMatch,
                methodMatch,
                resource,
            });
        }
        const { servers = [] } = resource;
        if (requestBaseUrl && servers.length > 0) {
            const serverMatchEither = matchServer(servers, requestBaseUrl);
            return function_1.pipe(serverMatchEither, E.map(serverMatch => ({ pathMatch, methodMatch, serverMatch, resource })));
        }
        return E.right({
            pathMatch,
            methodMatch,
            resource,
        });
    }))))), E.chain(candidateMatches => {
        const pathMatches = candidateMatches.filter(match => match.pathMatch !== types_2.MatchType.NOMATCH);
        if (!pathMatches.length) {
            return E.left(types_1.ProblemJsonError.fromTemplate(errors_1.NO_PATH_MATCHED_ERROR, `The route ${requestPath} hasn't been found in the specification file`));
        }
        const methodMatches = pathMatches.filter(match => match.methodMatch !== types_2.MatchType.NOMATCH);
        if (!methodMatches.length) {
            return E.left(types_1.ProblemJsonError.fromTemplate(errors_1.NO_METHOD_MATCHED_ERROR, `The route ${requestPath} has been matched, but it does not have "${input.method}" method defined`));
        }
        if (requestBaseUrl) {
            if (resources.every(resource => !resource.servers || resource.servers.length === 0)) {
                return E.left(types_1.ProblemJsonError.fromTemplate(errors_1.NO_SERVER_CONFIGURATION_PROVIDED_ERROR, `No server configuration has been provided, although ${requestBaseUrl} is set as server url`));
            }
            const serverMatches = methodMatches.filter(match => !!match.serverMatch && match.serverMatch !== types_2.MatchType.NOMATCH);
            if (!serverMatches.length) {
                return E.left(types_1.ProblemJsonError.fromTemplate(errors_1.NO_SERVER_MATCHED_ERROR, `The server url ${requestBaseUrl} hasn't been matched with any of the provided servers`));
            }
            return E.right(disambiguateMatches(serverMatches));
        }
        return E.right(disambiguateMatches(methodMatches));
    }));
};
function matchServer(servers, requestBaseUrl) {
    return function_1.pipe(servers.map(server => matchBaseUrl_1.matchBaseUrl(server, requestBaseUrl)), E.sequenceArray, E.map(matches => matches.filter(match => match !== types_2.MatchType.NOMATCH)), E.map(disambiguateServers));
}
function matchByMethod(request, operation) {
    return operation.method.toLowerCase() === request.method.toLowerCase();
}
function disambiguateMatches(matches) {
    const matchResult = matches.find(match => areServerAndPath(match, types_2.MatchType.CONCRETE, types_2.MatchType.CONCRETE)) ||
        matches.find(match => areServerAndPath(match, types_2.MatchType.TEMPLATED, types_2.MatchType.CONCRETE)) ||
        matches.find(match => areServerAndPath(match, types_2.MatchType.CONCRETE, types_2.MatchType.TEMPLATED)) ||
        matches[0];
    return matchResult.resource;
}
function areServerAndPath(match, serverType, pathType) {
    const serverMatch = match.serverMatch;
    if (!serverMatch) {
        return match.pathMatch === pathType;
    }
    return serverMatch === serverType && match.pathMatch === pathType;
}
function disambiguateServers(serverMatches) {
    const concreteMatch = serverMatches.find(serverMatch => serverMatch === types_2.MatchType.CONCRETE);
    return concreteMatch || serverMatches[0] || types_2.MatchType.NOMATCH;
}
exports.default = route;
