import { PrototypeMethodNames } from '../types';
import { capitalize } from './utils';
/*1.形如2016/06/01,2016-06-01,2016.06.01
2.特殊日期
3.形如20160601 201661
4.形如06/01/2016 06/01 06/01/16 月/日/年
5.形如[June 1st] June 1st,2016,June.1,Jun 1st等
6.形如+1 day,-1 week,1 week ago
*/
interface SpecialDayAdd {
  today: number;
  tomorrow: number;
  yesterday: number;
}
interface DateHashInterface<T> {
  year: T;
  month: T;
  day: T;
  week: T;
}
type DateHashInfo = DateHashInterface<string[]>;
type DateHashInfoKey = keyof DateHashInfo;
type DateMethods = PrototypeMethodNames<Date>;
interface DateHashResult extends DateHashInterface<number> {
  date: number;
  fullYear: number;
}
/**
 *
 * @param date
 */
const fixDate = (date?: Date | string | number): Date => {
  if (typeof date === 'undefined') {return new Date(); }
  if (date instanceof Date) {return date; }
  return new Date(date);
};
/**
 *
 * @param year
 * @param month
 * @param day
 */
const makeDate = (year: string | null, month: string | null, day: string | null): Date => {
  const localDate = new Date();
  const fullYear = localDate.getFullYear().toString();
  year = year || fullYear;
  month = month || (localDate.getMonth() + 1).toString();
  day = day || localDate.getDate().toString();
  year = (year.length < 4 ? fullYear.slice(0, fullYear.length - year.length) : '') + year;
  const strDate = [year, month, day].join('/') + ' 00:00:00';
  return new Date(strDate);
};
/**
 *
 * @param dateStr
 * @param baseDate
 */
const strToDate = (dateStr: string, baseDate?: Date | string | number): Date | never => {
  const mS: string[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  // tslint:disable-next-line:max-line-length
  const mL: string[] = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const r1 = /^(\d{4})([-\/.])(\d{1,2})\2(\d{1,2})$/;
  const r2 = /^(today|yesterday|tomorrow)$/;
  const r3 = /^(\d{4})(\d{1,2})(\d{1,2})$/;
  const r4 = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4})?)$/;
  // tslint:disable-next-line:max-line-length
  const r5 = new RegExp('^(' + mS.concat(mL).join('|') + ')(?:\\s+|\\.)(?:(([13]?1)(?:st)?|([12]?2)(?:nd)?|([12]?3)(?:rd)?|([12]0|[12]?[4-9])(?:th)?|(30)th))(?:\\s*,\\s*(\\d{2}|\\d{4}))?$');
  const r6 = /^(([+-]?\d+)\s+(day|month|week|year)s?(\s+(?!$)|))+?(\s+ago)?$/;
  const r6e = /([+-]?\d+)\s+(day|month|week|year)s?/g;
  let match;
  const localDate = new Date();
  dateStr = dateStr.toLowerCase();
  if (dateStr === '') {
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  } else if (match = dateStr.match(r1)) {
    return makeDate(match[1], match[3], match[4]);
  } else if (match = dateStr.match(r2)) {
    const addNum: SpecialDayAdd = {
      today: 0,
      tomorrow: 1,
      yesterday: -1,
    };
    const key: keyof SpecialDayAdd = match[1] as keyof SpecialDayAdd;
    if (baseDate) {
      baseDate = fixDate(baseDate);
      if (addNum[key]) {
        baseDate.setDate(baseDate.getDate() + addNum[key]);
      }
      baseDate.setHours(0, 0, 0, 0);
      return baseDate;
    } else {
      if (addNum[key]) {
        return makeDate(null, null, (localDate.getDate() + addNum[key]).toString());
      }
      return makeDate(null, null, null);
    }
  } else if (match = dateStr.match(r3)) {
    return makeDate.apply(null, match.slice(1, 4));
  } else if (match = dateStr.match(r4)) {
    return makeDate(match[4], match[1], match[2]);
  } else if (match = dateStr.match(r5)) {
    let month = match[1];
    const day = match[3];
    const year = match[8];
    const atMS = mS.indexOf(month);
    const atML = mL.indexOf(month);
    if (atMS > -1) {
      month = (atMS + 1).toString();
    } else {
      month = (atML + 1).toString();
    }
    return makeDate(year, month, day);
  } else if (match = dateStr.match(r6)) {
    const needReverse = match[5] ? '-' : '';
    let group;
    const info: DateHashInfo = {
      year: [],
      month: [],
      day: [],
      week: [],
    };
    const result: DateHashResult = {
      year: 0,
      month: 0,
      day: 0,
      week: 0,
      date: 0,
      fullYear: 0,
    };
    while ((group = r6e.exec(dateStr)) !== undefined) {
      const type = group[2];
      const num = group[1];
      info[type as DateHashInfoKey].push('(' + num + ')');
    }
    Object.keys(info).map((key: DateHashInfoKey) => {
      const arr = info[key];
      if (arr.length) {
        result[key] = new Function('', 'return ' + needReverse + '(' + arr.join('+') + ')')();
      } else {
        result[key] = 0;
      }
    });
    result.date = result.week * 7 + result.day;
    result.fullYear = result.year;
    const setFnQueues: Array<keyof DateHashResult> = ['date', 'month', 'fullYear'];
    const lastDate: Date = fixDate(baseDate);
    for (let i = 0, j = setFnQueues.length; i < j; i++) {
      const key: keyof DateHashResult = setFnQueues[i];
      const num = result[key];
      const method = capitalize(key);
      if (num) {
        const setFn = lastDate[`set${method}` as DateMethods];
        const getFn = lastDate[`get${method}` as DateMethods];
        const orig = getFn() as number;
        try {
          setFn.call(lastDate, orig + num);
        } catch (e) {
          throw e;
        }
      }
    }
    return lastDate;
  } else {
    throw new Error('can not parse the date!');
  }
};
