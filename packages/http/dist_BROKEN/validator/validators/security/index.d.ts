import { IHttpOperation } from '@stoplight/types';
import { ValidatorFn } from '@stoplight/prism-core';
import { IHttpRequest } from '../../../types';
declare type HeadersAndUrl = Pick<IHttpRequest, 'headers' | 'url'>;
export declare const validateSecurity: ValidatorFn<Pick<IHttpOperation, 'security'>, HeadersAndUrl>;
export {};
