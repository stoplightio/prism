import { FormatCompare, FormatDefinition, FormatValidator } from 'ajv/dist/types';
export declare function fmtDef(validate: RegExp | FormatValidator<string>, compare: FormatCompare<string>): FormatDefinition<string>;
export declare function date_time(str: string): boolean;
export declare function compareDateTime(dt1: string, dt2: string): number | undefined;
