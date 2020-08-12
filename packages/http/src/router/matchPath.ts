import { MatchType } from './types';
import * as E from 'fp-ts/lib/Either';

function fragmentarize(path: string): string[] {
  return path.split('/').slice(1);
}

function getTemplateParamName(pathFragment: string) {
  const match = /{(.*)}/.exec(pathFragment);
  return match && match[1];
}

export function matchPath(requestPath: string, operationPath: string): E.Either<Error, MatchType> {
  const operationPathFragments = fragmentarize(operationPath);
  const requestPathFragments = fragmentarize(requestPath);

  if (
    operationPathFragments.length < requestPathFragments.length ||
    operationPathFragments.length > requestPathFragments.length
  ) {
    return E.right(MatchType.NOMATCH);
  }

  const params = [];
  while (requestPathFragments.length) {
    const requestPathFragment = requestPathFragments.shift();
    const operationPathFragment = operationPathFragments.shift();

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
