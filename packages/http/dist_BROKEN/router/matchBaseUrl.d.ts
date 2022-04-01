import * as E from 'fp-ts/Either';
import { INodeVariable, IServer, Dictionary } from '@stoplight/types';
import { MatchType } from './types';
export declare function matchBaseUrl(server: IServer, baseUrl: string): E.Either<Error, MatchType>;
export declare function convertTemplateToRegExp(urlTemplate: string, variables?: Dictionary<INodeVariable>): E.Either<Error, RegExp>;
