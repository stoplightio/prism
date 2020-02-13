import { IPrismComponents } from '@stoplight/prism-core';
import { IHttpOperation, IServer } from '@stoplight/types';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
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

const eitherSequence = A.array.sequence(E.either);

const route: IPrismComponents<IHttpOperation, IHttpRequest, unknown, IHttpConfig>['route'] = ({ resources, input }) => {
  const { path: requestPath, baseUrl: requestBaseUrl } = input.url;

  if (!requestPath.startsWith('/')) {
    return E.left(new Error(`The request path '${requestPath}' must start with a slash.`));
  }

  return pipe(
    resources,
    E.fromPredicate(A.isNonEmpty, () =>
      ProblemJsonError.fromTemplate(
        NO_RESOURCE_PROVIDED_ERROR,
        `The current document does not have any resource to match with.`
      )
    ),
    E.chain(resources =>
      eitherSequence(
        resources.map(resource =>
          pipe(
            matchPath(requestPath, resource.path),
            E.chain<
              Error,
              MatchType,
              { pathMatch: MatchType; methodMatch: MatchType; serverMatch?: MatchType; resource: IHttpOperation }
            >(pathMatch => {
              if (pathMatch === MatchType.NOMATCH)
                return E.right({
                  pathMatch,
                  methodMatch: MatchType.NOMATCH,
                  resource,
                });

              const methodMatch = matchByMethod(input, resource) ? MatchType.CONCRETE : MatchType.NOMATCH;

              if (methodMatch === MatchType.NOMATCH) {
                return E.right({
                  pathMatch,
                  methodMatch,
                  resource,
                });
              }

              const { servers = [] } = resource;

              if (requestBaseUrl && servers.length > 0) {
                const serverMatchEither = matchServer(servers, requestBaseUrl);
                return pipe(
                  serverMatchEither,
                  E.map(serverMatch => ({ pathMatch, methodMatch, serverMatch, resource }))
                );
              }

              return E.right({
                pathMatch,
                methodMatch,
                resource,
              });
            })
          )
        )
      )
    ),
    E.chain(candidateMatches => {
      const pathMatches = candidateMatches.filter(match => match.pathMatch !== MatchType.NOMATCH);

      if (!pathMatches.length) {
        return E.left(
          ProblemJsonError.fromTemplate(
            NO_PATH_MATCHED_ERROR,
            `The route ${requestPath} hasn't been found in the specification file`
          )
        );
      }

      const methodMatches = pathMatches.filter(match => match.methodMatch !== MatchType.NOMATCH);

      if (!methodMatches.length) {
        return E.left(
          ProblemJsonError.fromTemplate(
            NO_METHOD_MATCHED_ERROR,
            `The route ${requestPath} has been matched, but it does not have "${input.method}" method defined`
          )
        );
      }

      if (requestBaseUrl) {
        if (resources.every(resource => !resource.servers || resource.servers.length === 0)) {
          return E.left(
            ProblemJsonError.fromTemplate(
              NO_SERVER_CONFIGURATION_PROVIDED_ERROR,
              `No server configuration has been provided, although ${requestBaseUrl} is set as server url`
            )
          );
        }

        const serverMatches = methodMatches.filter(
          match => !!match.serverMatch && match.serverMatch !== MatchType.NOMATCH
        );

        if (!serverMatches.length) {
          return E.left(
            ProblemJsonError.fromTemplate(
              NO_SERVER_MATCHED_ERROR,
              `The server url ${requestBaseUrl} hasn't been matched with any of the provided servers`
            )
          );
        }

        return E.right(disambiguateMatches(serverMatches));
      }

      return E.right(disambiguateMatches(methodMatches));
    })
  );
};

function matchServer(servers: IServer[], requestBaseUrl: string): E.Either<Error, MatchType> {
  return pipe(
    servers.map(server => matchBaseUrl(server, requestBaseUrl)),
    eitherSequence,
    E.map(matches => matches.filter(match => match !== MatchType.NOMATCH)),
    E.map(disambiguateServers)
  );
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
  if (!serverMatch) {
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

export default route;
