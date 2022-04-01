import type { Dictionary } from '@stoplight/types';
import type { deserializeFn } from './types';
import type { IHttpNameValue, IHttpNameValues } from '../../';
export declare const header: Dictionary<deserializeFn<IHttpNameValue>, 'simple'>;
export declare const query: Dictionary<deserializeFn<IHttpNameValues>, 'form' | 'spaceDelimited' | 'pipeDelimited' | 'commaDelimited' | 'deepObject'>;
export declare const path: Dictionary<deserializeFn<IHttpNameValue>, 'simple' | 'label' | 'matrix'>;
export declare const body: Dictionary<deserializeFn<IHttpNameValues>, "form" | "spaceDelimited" | "pipeDelimited" | "commaDelimited" | "deepObject">;
