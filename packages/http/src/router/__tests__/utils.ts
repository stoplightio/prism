import { HttpMethod } from '@stoplight/types';
import { Chance } from 'chance';
import { defaults } from 'lodash';

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

const defaultRandomPathOptions = {
  pathFragments: 3,
  includeTemplates: true,
  leadingSlash: true,
};

interface IRandomPathOptions {
  pathFragments?: number;
  includeTemplates?: boolean;
  trailingSlash?: boolean;
  leadingSlash?: boolean;
}

export function randomPath(opts: IRandomPathOptions = defaultRandomPathOptions): string {
  defaults(opts, defaultRandomPathOptions);

  const randomPathFragments = randomArray(
    () => (opts.includeTemplates && chance.bool() ? `{${chance.word()}}` : chance.word()),
    opts.pathFragments,
  );

  const leadingSlash = opts.leadingSlash ? '/' : '';
  const trailingSlash = opts.trailingSlash ? '/' : '';

  return `${leadingSlash}${randomPathFragments.join('/')}${trailingSlash}`;
}
