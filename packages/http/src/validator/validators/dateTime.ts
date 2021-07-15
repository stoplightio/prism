/* 
  This file contains code copied from the ajv-formats project with a small bug fix.
  This was done because https://github.com/ajv-validator/ajv-formats/pull/33 does not look like it will be accepted soon, if at all.
  We needed this to address the regression in date-time validation when we switch from ajv-oai to ajv-formats.
  Regression initially reported in https://github.com/stoplightio/prism/issues/1830
*/

import { FormatCompare, FormatDefinition, FormatValidator } from 'ajv/dist/types';

export function fmtDef(
  validate: RegExp | FormatValidator<string>,
  compare: FormatCompare<string>
): FormatDefinition<string> {
  return { validate, compare };
}

const DATE_TIME_SEPARATOR = /t|\s/i;
export function date_time(str: string): boolean {
  // http://tools.ietf.org/html/rfc3339#section-5.6
  const dateTime: string[] = str.split(DATE_TIME_SEPARATOR);
  return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1], true);
}

const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapYear(year: number): boolean {
  // https://tools.ietf.org/html/rfc3339#appendix-C
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function date(str: string): boolean {
  // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
  const matches: string[] | null = DATE.exec(str);
  if (!matches) return false;
  const year: number = +matches[1];
  const month: number = +matches[2];
  const day: number = +matches[3];
  return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
}

const TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
const PLUS_MINUS = /^[+-]/;
const TIMEZONE = /^[Zz]$/;
const ISO_8601_TIME = /^[+-](?:[01][0-9]|2[0-4])(?::?[0-5][0-9])?$/;
function time(str: string, withTimeZone?: boolean): boolean {
  const matches: string[] | null = TIME.exec(str);
  if (!matches) return false;

  const hour: number = +matches[1];
  const minute: number = +matches[2];
  const second: number = +matches[3];
  const timeZone: string = matches[5];
  return (
    ((hour <= 23 && minute <= 59 && second <= 59) || (hour === 23 && minute === 59 && second === 60)) &&
    (!withTimeZone ||
      TIMEZONE.test(timeZone) ||
      (PLUS_MINUS.test(timeZone) && time(timeZone.slice(1) + ':00')) ||
      ISO_8601_TIME.test(timeZone))
  );
}

export function compareDateTime(dt1: string, dt2: string): number | undefined {
  if (!(dt1 && dt2)) return undefined;
  const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
  const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
  const res = compareDate(d1, d2);
  if (res === undefined) return undefined;
  return res || compareTime(t1, t2);
}
function compareDate(d1: string, d2: string): number | undefined {
  if (!(d1 && d2)) return undefined;
  if (d1 > d2) return 1;
  if (d1 < d2) return -1;
  return 0;
}
function compareTime(t1: string, t2: string): number | undefined {
  if (!(t1 && t2)) return undefined;
  const a1 = TIME.exec(t1);
  const a2 = TIME.exec(t2);
  if (!(a1 && a2)) return undefined;
  t1 = a1[1] + a1[2] + a1[3] + (a1[4] || '');
  t2 = a2[1] + a2[2] + a2[3] + (a2[4] || '');
  if (t1 > t2) return 1;
  if (t1 < t2) return -1;
  return 0;
}
