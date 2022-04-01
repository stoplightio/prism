"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareDateTime = exports.date_time = exports.fmtDef = void 0;
function fmtDef(validate, compare) {
    return { validate, compare };
}
exports.fmtDef = fmtDef;
const DATE_TIME_SEPARATOR = /t|\s/i;
function date_time(str) {
    const dateTime = str.split(DATE_TIME_SEPARATOR);
    return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1], true);
}
exports.date_time = date_time;
const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function date(str) {
    const matches = DATE.exec(str);
    if (!matches)
        return false;
    const year = +matches[1];
    const month = +matches[2];
    const day = +matches[3];
    return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
}
const TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
const PLUS_MINUS = /^[+-]/;
const TIMEZONE = /^[Zz]$/;
const ISO_8601_TIME = /^[+-](?:[01][0-9]|2[0-4])(?::?[0-5][0-9])?$/;
function time(str, withTimeZone) {
    const matches = TIME.exec(str);
    if (!matches)
        return false;
    const hour = +matches[1];
    const minute = +matches[2];
    const second = +matches[3];
    const timeZone = matches[5];
    return (((hour <= 23 && minute <= 59 && second <= 59) || (hour === 23 && minute === 59 && second === 60)) &&
        (!withTimeZone ||
            TIMEZONE.test(timeZone) ||
            (PLUS_MINUS.test(timeZone) && time(timeZone.slice(1) + ':00')) ||
            ISO_8601_TIME.test(timeZone)));
}
function compareDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
        return undefined;
    const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
    const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
    const res = compareDate(d1, d2);
    if (res === undefined)
        return undefined;
    return res || compareTime(t1, t2);
}
exports.compareDateTime = compareDateTime;
function compareDate(d1, d2) {
    if (!(d1 && d2))
        return undefined;
    if (d1 > d2)
        return 1;
    if (d1 < d2)
        return -1;
    return 0;
}
function compareTime(t1, t2) {
    if (!(t1 && t2))
        return undefined;
    const a1 = TIME.exec(t1);
    const a2 = TIME.exec(t2);
    if (!(a1 && a2))
        return undefined;
    t1 = a1[1] + a1[2] + a1[3] + (a1[4] || '');
    t2 = a2[1] + a2[2] + a2[3] + (a2[4] || '');
    if (t1 > t2)
        return 1;
    if (t1 < t2)
        return -1;
    return 0;
}
