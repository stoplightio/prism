import { HttpMethod } from '@stoplight/types';
import * as faker from '@faker-js/faker/locale/en';
import { defaults } from 'lodash/fp';
import { DeepNonNullable } from 'utility-types';

const httpMethods: HttpMethod[] = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

export function pickOneHttpMethod(): HttpMethod {
  return faker.random.arrayElement(httpMethods);
}

export function pickSetOfHttpMethods(count = 2): HttpMethod[] {
  return new Array(count).fill(1).map(() => pickOneHttpMethod());
}

type IRandomPathOptions = {
  pathFragments?: number;
  includeTemplates?: boolean;
  trailingSlash?: boolean;
  leadingSlash?: boolean;
  includeSpaces?: boolean;
  includeColon?: boolean;
};

const defaultRandomPathOptions: DeepNonNullable<IRandomPathOptions> = {
  pathFragments: 3,
  includeTemplates: true,
  leadingSlash: true,
  trailingSlash: false,
  includeSpaces: true,
  includeColon: false,
};

export function randomPath(opts: IRandomPathOptions = defaultRandomPathOptions): string {
  const options = defaults(defaultRandomPathOptions, opts);

  // prevents trailing slash from being used with a colon
  if (options.includeColon && (options.trailingSlash || options.pathFragments < 2)) {
    options.includeColon = false;
  }

  const randomPathFragments = new Array(options.pathFragments).fill(0).map(() => {
    const words = faker.random.words(options.includeSpaces ? 3 : 1);
    return options.includeTemplates && faker.datatype.boolean() ? `{${words}}` : words;
  });

  const leadingSlash = options.leadingSlash ? '/' : '';
  const trailingSlash = options.trailingSlash ? '/' : '';

  // pop the last word
  const lastWord = randomPathFragments.pop();

  // add the popped word with colon or return the standard mapping
  return options.includeColon
    ? `${leadingSlash}${randomPathFragments.join('/')}:${lastWord}`
    : `${leadingSlash}${randomPathFragments.join('/')}/${lastWord}${trailingSlash}`;
}
