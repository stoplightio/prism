import { IRouter } from '@stoplight/prism-core';
import { IHttpOperation, IServer } from '@stoplight/types';
import { IHttpConfig, IHttpRequest, ProblemJsonError } from '../types';
import {
  NO_METHOD_MATCHED_ERROR,
  NO_PATH_MATCHED_ERROR,
  NO_RESOURCE_PROVIDED_ERROR,
  NO_SERVER_CONFIGURATION_PROVIDED_ERROR,
  NO_SERVER_MATCHED_ERROR,
} from './errors';
import { matchBaseUrl } from './matchBaseUrl';
import { matchPath } from './matchPath';
import { IMatch, MatchType } from './types';

export const router: IRouter<IHttpOperation, IHttpRequest, IHttpConfig> = {
  route: ({ resources, input }): IHttpOperation => {
    const { path: requestPath, baseUrl: requestBaseUrl } = input.url;

    if (!resources.length) {
      throw ProblemJsonError.fromTemplate(
        NO_RESOURCE_PROVIDED_ERROR,
        `The current document does not have any resource to match with.`,
      );
    }

    let matches = resources.map<IMatch>(resource => {
      const pathMatch = matchPath(requestPath, resource.path);
      if (pathMatch === MatchType.NOMATCH)
        return {
          pathMatch,
          methodMatch: MatchType.NOMATCH,
          resource,
        };

      const methodMatch = matchByMethod(input, resource) ? MatchType.CONCRETE : MatchType.NOMATCH;

      if (methodMatch === MatchType.NOMATCH) {
        return {
          pathMatch,
          methodMatch,
          resource,
        };
      }

      const { servers = [] } = resource;

      if (requestBaseUrl && servers.length > 0) {
        const serverMatch = matchServer(servers, requestBaseUrl);

        return {
          pathMatch,
          methodMatch,
          serverMatch,
          resource,
        };
      }

      return {
        pathMatch,
        methodMatch,
        serverMatch: null,
        resource,
      };
    });

    matches = matches.filter(match => match.pathMatch !== MatchType.NOMATCH);

    if (!matches.length) {
      throw ProblemJsonError.fromTemplate(
        NO_PATH_MATCHED_ERROR,
        `The route ${requestPath} hasn't been found in the specification file`,
      );
    }

    matches = matches.filter(match => match.methodMatch !== MatchType.NOMATCH);

    if (!matches.length) {
      throw ProblemJsonError.fromTemplate(
        NO_METHOD_MATCHED_ERROR,
        `The route ${requestPath} has been matched, but it does not have "${input.method}" method defined`,
      );
    }

    if (requestBaseUrl) {
      if (resources.every(resource => !resource.servers || resource.servers.length === 0)) {
        throw ProblemJsonError.fromTemplate(
          NO_SERVER_CONFIGURATION_PROVIDED_ERROR,
          `No server configuration has been provided, although ${requestBaseUrl} is set as base url`,
        );
      }

      matches = matches.filter(match => !!match.serverMatch && match.serverMatch !== MatchType.NOMATCH);

      if (!matches.length) {
        throw ProblemJsonError.fromTemplate(
          NO_SERVER_MATCHED_ERROR,
          `The base url ${requestBaseUrl} hasn't been matched with any of the provided servers`,
        );
      }
    }

    return disambiguateMatches(matches);
  },
};

function matchServer(servers: IServer[], requestBaseUrl: string) {
  const serverMatches = servers
    .map(server => matchBaseUrl(server, requestBaseUrl))
    .filter(match => match !== MatchType.NOMATCH);

  return disambiguateServers(serverMatches);
}

function matchByMethod(request: IHttpRequest, operation: IHttpOperation): boolean {
  return operation.method.toLowerCase() === request.method.toLowerCase();
}

function disambiguateMatches(matches: IMatch[]): IHttpOperation {
  const matchResult =
    // prefer concrete server and concrete path
    matches.find(match => areServerAndPath(match, MatchType.CONCRETE, MatchType.CONCRETE)) ||
    // then prefer templated server and concrete path
    matches.find(match => areServerAndPath(match, MatchType.TEMPLATED, MatchType.CONCRETE)) ||
    // then prefer concrete server and templated path
    matches.find(match => areServerAndPath(match, MatchType.CONCRETE, MatchType.TEMPLATED)) ||
    // then fallback to first
    matches[0];

  return matchResult.resource;
}

function areServerAndPath(match: IMatch, serverType: MatchType, pathType: MatchType) {
  const serverMatch = match.serverMatch;
  if (serverMatch === null) {
    // server match will only be null if server matching is disabled.
    // therefore skip comparison.
    return match.pathMatch === pathType;
  }
  return serverMatch === serverType && match.pathMatch === pathType;
}

/**
 * If a concrete server match exists then return first such match.
 * If no concrete server match exists return first (templated) match.
 */
function disambiguateServers(serverMatches: MatchType[]): MatchType {
  const concreteMatch = serverMatches.find(serverMatch => serverMatch === MatchType.CONCRETE);
  return concreteMatch || serverMatches[0] || MatchType.NOMATCH;
}
