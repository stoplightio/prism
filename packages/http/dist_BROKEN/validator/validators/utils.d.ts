import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity } from '@stoplight/types';
import * as O from 'fp-ts/Option';
import { NonEmptyArray } from 'fp-ts/NonEmptyArray';
import { ErrorObject } from 'ajv';
import type { JSONSchema } from '../../';
export declare const convertAjvErrors: (errors: NonEmptyArray<ErrorObject>, severity: DiagnosticSeverity, prefix?: string | undefined) => NonEmptyArray<IPrismDiagnostic>;
export declare const validateAgainstSchema: (value: unknown, schema: JSONSchema, coerce: boolean, prefix?: string | undefined, bundle?: unknown) => O.Option<NonEmptyArray<IPrismDiagnostic>>;
