import { IRouter } from '@stoplight/prism-core';
import { IHttpOperation, IServer } from '@stoplight/types';

import { IHttpConfig, IHttpRequest } from '../types';
import {
  NO_RESOURCE_PROVIDED_ERROR,
  NO_SERVER_CONFIGURATION_PROVIDED_ERROR,
  NONE_METHOD_MATCHED_ERROR,
  NONE_PATH_MATCHED_ERROR,
  NONE_SERVER_MATCHED_ERROR,
} from './errors';
import { matchBaseUrl } from './matchBaseUrl';
import { matchPath } from './matchPath';
import { IMatch, MatchType } from './types';

export const router: IRouter<IHttpOperation, IHttpRequest, IHttpConfig> = {
  route: ({ resources, input }) => {
    const matches = [];
    const { path: requestPath, baseUrl: requestBaseUrl } = input.url;
    const serverValidationEnabled = !!requestBaseUrl;

    if (!resources.length) {
      throw NO_RESOURCE_PROVIDED_ERROR;
    }

    let anyMethodMatched = false;
    let anyPathMatched = false;
    let anyServerMatched = false;
    let anyServerProvided = false;

    for (const resource of resources) {
      if (!matchByMethod(input, resource)) continue;
      anyMethodMatched = true;

      const pathMatch = matchPath(requestPath, resource.path);
      if (pathMatch !== MatchType.NOMATCH) anyPathMatched = true;

      const { servers = [] } = resource;
      let serverMatch: MatchType | null = null;

      if (serverValidationEnabled) {
        if (servers.length === 0) continue;

        anyServerProvided = true;
        serverMatch = matchServer(servers, requestBaseUrl as string);
        if (serverMatch) anyServerMatched = true;
      } else {
        anyServerMatched = true;
        anyServerProvided = true;
      }

      if (pathMatch !== MatchType.NOMATCH) {
        matches.push({
          pathMatch,
          serverMatch,
          resource,
        });
      }
    }

    if (!anyMethodMatched) {
      throw NONE_METHOD_MATCHED_ERROR;
    }

    if (!anyPathMatched) {
      throw NONE_PATH_MATCHED_ERROR;
    }

    if (!anyServerProvided) {
      throw NO_SERVER_CONFIGURATION_PROVIDED_ERROR;
    }

    if (!anyServerMatched) {
      throw NONE_SERVER_MATCHED_ERROR;
    }

    return disambiguateMatches(matches);
  },
};

function matchServer(servers: IServer[], requestBaseUrl: string) {
  const serverMatches = [];
  for (const server of servers) {
    const tempServerMatch = matchBaseUrl(server, requestBaseUrl);
    if (tempServerMatch !== MatchType.NOMATCH) {
      serverMatches.push(tempServerMatch);
    }
  }

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
  return concreteMatch || serverMatches[0];
}
