import { MatchType } from './types';
import * as E from 'fp-ts/Either';

function fragmentarize(path: string): string[] {
  return path.split('/').slice(1);
}

function fragmentarizeWithColon(path: string): string[] {
  return path.split(/[/:]/).slice(1);
}

function getTemplateParamName(pathFragment: string) {
  const match = /{(.*)}/.exec(pathFragment);
  return match && match[1];
}

export function matchPath(requestPath: string, operationPath: string): E.Either<Error, MatchType> {
  // a/b/c = a/b/c

  const operationPathFragments = fragmentarize(operationPath);
  const requestPathFragments = fragmentarize(requestPath);

  if (
    operationPathFragments.length < requestPathFragments.length ||
    operationPathFragments.length > requestPathFragments.length
  ) {
    return E.right(MatchType.NOMATCH);
  }

  // a/b:c = a/b:c
  const operationPathColonFragments = fragmentarizeWithColon(operationPath);
  const requestPathColonFragments = fragmentarizeWithColon(requestPath);
  if (
    operationPathColonFragments.length < requestPathColonFragments.length ||
    operationPathColonFragments.length > requestPathColonFragments.length
  ) {
    return E.right(MatchType.NOMATCH);
  }

  const params = [];
  while (requestPathColonFragments.length) {
    const requestPathFragment = requestPathColonFragments.shift();
    const operationPathFragment = operationPathColonFragments.shift();

    const paramName = getTemplateParamName(operationPathFragment as string);

    if (paramName === null && operationPathFragment !== requestPathFragment) {
      // if concrete fragment and fragments are different return false
      return E.right(MatchType.NOMATCH);
    } else if (paramName !== null) {
      params.push({
        name: paramName,
        value: requestPathFragment,
      });
    }
  }

  return E.right(params.length ? MatchType.TEMPLATED : MatchType.CONCRETE);
}
