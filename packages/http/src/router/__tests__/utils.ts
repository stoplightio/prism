import { HttpMethod } from '@stoplight/types';
import * as faker from 'faker/locale/en';
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
};

const defaultRandomPathOptions: DeepNonNullable<IRandomPathOptions> = {
  pathFragments: 3,
  includeTemplates: true,
  leadingSlash: true,
  trailingSlash: false,
};

export function randomPath(opts: IRandomPathOptions = defaultRandomPathOptions): string {
  const options = defaults(defaultRandomPathOptions, opts);

  const randomPathFragments = new Array(options.pathFragments)
    .fill(0)
    .map(() => (options.includeTemplates && faker.random.boolean() ? `{${faker.random.word()}}` : faker.random.word()));

  const leadingSlash = options.leadingSlash ? '/' : '';
  const trailingSlash = options.trailingSlash ? '/' : '';

  return `${leadingSlash}${randomPathFragments.join('/')}${trailingSlash}`;
}
