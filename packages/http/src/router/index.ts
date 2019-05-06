import { IRouter } from '@stoplight/prism-core';
import { IHttpOperation, IServer } from '@stoplight/types';

import { IHttpConfig, IHttpRequest } from '../types';
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
      throw new Error(NO_RESOURCE_PROVIDED_ERROR);
    }

    const matches = resources.map<IMatch>(resource => {
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

    if (requestBaseUrl) {
      if (matches.every(match => match.serverMatch === null)) {
        throw new Error(NO_SERVER_CONFIGURATION_PROVIDED_ERROR);
      }

      if (matches.every(match => !!match.serverMatch && match.serverMatch === MatchType.NOMATCH)) {
        throw new Error(NO_SERVER_MATCHED_ERROR);
      }
    }

    if (!matches.some(match => match.pathMatch !== MatchType.NOMATCH)) {
      throw new Error(NO_PATH_MATCHED_ERROR);
    }

    if (
      !matches.some(
        match => match.pathMatch !== MatchType.NOMATCH && match.methodMatch !== MatchType.NOMATCH
      )
    ) {
      throw new Error(NO_METHOD_MATCHED_ERROR);
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
