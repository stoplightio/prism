import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { INodeVariable, IServer, Dictionary } from '@stoplight/types';
import { MatchType } from './types';

const variableRegexp = /{(.*?)}/g;

export function matchBaseUrl(server: IServer, baseUrl: string): E.Either<Error, MatchType> {
  return pipe(
    convertTemplateToRegExp(server.url, server.variables),
    E.map(regex => regex.exec(baseUrl)),
    E.map(matches => (matches ? (matches.length > 1 ? MatchType.TEMPLATED : MatchType.CONCRETE) : MatchType.NOMATCH))
  );
}

export function convertTemplateToRegExp(
  urlTemplate: string,
  variables?: Dictionary<INodeVariable>
): E.Either<Error, RegExp> {
  return pipe(
    variables ? replaceString(variables, urlTemplate) : E.right(urlTemplate),
    E.map(regexString => new RegExp(`^${regexString}$`))
  );

  function replaceString(vars: Dictionary<INodeVariable>, input: string): E.Either<Error, string> {
    return E.tryCatch(() => replaceStringUnsafe(input), E.toError);

    function replaceStringUnsafe(input: string): string {
      return input.replace(variableRegexp, (_match: string, variableName: string) => {
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
