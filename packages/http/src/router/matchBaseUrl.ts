import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';

import { INodeVariable, IServer } from '@stoplight/types';
import { MatchType } from './types';

const variableRegexp = /{(.*?)}/g;

export function matchBaseUrl(server: IServer, baseUrl: string) {
  return pipe(
    convertTemplateToRegExp(server.url, server.variables),
    E.map(regex =>
      pipe(
        O.fromNullable(regex.exec(baseUrl)),
        O.fold(
          () => MatchType.NOMATCH,
          matches => (matches.length > 1 ? MatchType.TEMPLATED : MatchType.CONCRETE)
        )
      )
    ),
    E.fold(
      e => {
        throw e;
      },
      matchType => matchType
    )
  );
}

export function convertTemplateToRegExp(
  urlTemplate: string,
  variables?: { [name: string]: INodeVariable }
): E.Either<Error, RegExp> {
  return pipe(
    O.fromNullable(variables),
    O.fold(
      () => E.right(urlTemplate),
      vars => replaceString(vars, urlTemplate)
    ),
    E.map(regexString => new RegExp(`^${regexString}$`))
  );

  function replaceString(vars: { [name: string]: INodeVariable }, input: string) {
    return E.tryCatch<Error, string>(
      () => replaceStringUnsafe(input),
      e => (e instanceof Error ? e : new Error('unknown error'))
    );

    function replaceStringUnsafe(input: string): string {
      return input.replace(variableRegexp, (_match, variableName) => {
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
