import { HttpMethod } from '@stoplight/types';
import { Chance } from 'chance';
import { defaults } from 'lodash/fp';
import { DeepNonNullable } from 'utility-types';

const chance = new Chance();
const httpMethods: HttpMethod[] = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

export function pickOneHttpMethod(): HttpMethod {
  return chance.pickone(httpMethods);
}

export function pickSetOfHttpMethods(count = 2): HttpMethod[] {
  return chance.unique(pickOneHttpMethod, count);
}

export function randomArray<T>(itemGenerator: () => T, length = 1): T[] {
  return new Array(length).fill(null).map(itemGenerator);
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

  const randomPathFragments = randomArray(
    () => (options.includeTemplates && chance.bool() ? `{${chance.word()}}` : chance.word()),
    options.pathFragments
  );

  const leadingSlash = options.leadingSlash ? '/' : '';
  const trailingSlash = options.trailingSlash ? '/' : '';

  return `${leadingSlash}${randomPathFragments.join('/')}${trailingSlash}`;
}
