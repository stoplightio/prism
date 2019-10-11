import { INodeVariable, IServer } from '@stoplight/types';
import { MatchType } from './types';

const variableRegexp = /{(.*?)}/g;

export function matchBaseUrl(server: IServer, baseUrl: string): MatchType {
  const templateMatchResult = matchRequestUrlToTemplateUrl(baseUrl, server.url, server.variables);

  if (!templateMatchResult) {
    return MatchType.NOMATCH;
  }

  return templateMatchResult.length > 1 ? MatchType.TEMPLATED : MatchType.CONCRETE;
}

export function convertTemplateToRegExp(urlTemplate: string, variables?: { [name: string]: INodeVariable }) {
  const regexp = !variables
    ? urlTemplate
    : urlTemplate.replace(variableRegexp, (_match, variableName) => {
        const variable = variables[variableName];
        if (!variable) {
          throw new Error(`Variable '${variableName}' is not defined, cannot parse input.`);
        }
        let { enum: enums } = variable;
        if (enums) {
          enums = enums.sort((a, b) => b.length - a.length);
        }
        return `(${enums && enums.length ? enums.join('|') : '.*?'})`;
      });

  return new RegExp(`^${regexp}$`);
}

function matchRequestUrlToTemplateUrl(requestUrl: string, templateUrl: string, variables?: any) {
  const regexp = convertTemplateToRegExp(templateUrl, variables);
  return regexp.exec(requestUrl);
}
