import { MatchType } from './types';
import * as E from 'fp-ts/Either';

function fragmentize(path: string): string[] {
  if (path.length === 0 || !path.startsWith('/')) {
    throw new Error(`Malformed path '${path}'`);
  }

  return path.split('/').slice(1).map(decodePathFragment);
}

export function isTemplated(pathFragment: string) {
  return /{(.+)}/.test(pathFragment);
}

// Attempt to decode path fragment. Decode should not do any harm since it is
// decoding only URI sequences which are previously created by encodeURIComponent
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
function decodePathFragment(pathFragment: string) {
  try {
    return pathFragment && decodeURIComponent(pathFragment);
  } catch (_) {
    return pathFragment;
  }
}

function escapeRegExp(string: string) {
  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function matchPath(requestPath: string, operationPath: string): E.Either<Error, MatchType> {
  const operationPathFragments = fragmentize(operationPath);
  const requestPathFragments = fragmentize(requestPath);

  if (operationPathFragments.length != requestPathFragments.length) {
    return E.right(MatchType.NOMATCH);
  }

  let isTemplatedOperationPath = false;

  for (const requestPathFragment of requestPathFragments) {
    const operationPathFragment = operationPathFragments.shift();

    if (operationPathFragment === undefined) {
      return E.right(MatchType.NOMATCH);
    }

    const isTemplatedFragment = isTemplated(operationPathFragment);

    if (!isTemplatedFragment) {
      if (operationPathFragment === requestPathFragment) {
        continue;
      }

      // if concrete fragment and fragments are different return false
      return E.right(MatchType.NOMATCH);
    }

    // Convert the operation path fragment into a capturing RegExp
    // and see if the request path fragment fits it
    const escaped = escapeRegExp(operationPathFragment);
    const captureRegExp = escaped.replace(/\\\{[^\\]+\\\}/g, '(.*)');

    const match = new RegExp(captureRegExp).exec(requestPathFragment);
    if (match == null) {
      return E.right(MatchType.NOMATCH);
    }

    isTemplatedOperationPath ||= true;
  }

  return E.right(isTemplatedOperationPath ? MatchType.TEMPLATED : MatchType.CONCRETE);
}
