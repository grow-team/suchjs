import { ParserConfig, ParserInstance } from '@/config';
import * as Utils from '@/helpers/utils';
import { NormalObject } from '@/types';
export interface Tags {
  start: string;
  end: string;
}
export interface ParserConstructor extends ParserConfig {
  new (): ParserInterface;
}
/**
 * 定义解析器抽象类
 *
 * @interface ParserInterface
 */
export abstract class ParserInterface {
  protected params: string[];
  protected tags: Tags;
  protected code: string = '';
  protected setting: NormalObject = {
    frozen: true,
  };
  // constructor
  constructor() {
    this.init();
  }
  // init
  public init() {
    this.params = [];
    this.tags = {
      start: '',
      end: '',
    };
    return this;
  }
  // get all info
  public info() {
    const { tags, params, code } = this;
    return {
      tags,
      params,
      code,
    };
  }
  //
  public showError(err: string): never {
    throw new Error(err);
  }
  // parse code
  public parseCode(code: string, tags: Tags) {
    this.code = code;
    this.tags = tags;
    const { start, end } = tags;
    const constr = this.constructor as ParserConstructor;
    const { separator } = constr;
    if(!separator && !end) {
      this.params = [code];
    } else {
      const params = [];
      const sliceInfo = [start.length].concat(end ? -end.length : []);
      const res = code.slice(...sliceInfo);
      let seg = '';
      for(let i = 0, j = res.length; i < j; i++) {
        const cur = res.charAt(i);
        if(cur === '\\') {
          seg += '\\' + res.charAt(i++);
        } else {
          if(cur === separator) {
            params.push(seg);
            seg = '';
          } else {
            seg += cur;
          }
        }
      }
      if(params.length || seg) {
        params.push(seg);
      }
      this.params = params;
    }
  }
  /**
   *
   *
   * @abstract
   * @returns {Object|never}
   * @memberof ParserInterface
   */
  public abstract parse(): object | never;
}
//
export interface ParserList {
  [index: string]: ParserConstructor;
}
//
export interface ParserInstances {
  [index: string]: ParserInterface;
}
//
const getMatchedPairs = (pairs: string[], search = '') => {
  return pairs.filter((pair) => {
    return pair.indexOf(search) === 0;
  });
};
const getExactPairs = (pairs: string[], search = '', seg: string, splitor: string) => {
  const len = search.length;
  return pairs.filter((pair) => {
    return pair.length === len || (pair.charAt(len) === splitor && seg.indexOf(pair.split(splitor)[1]) >= len);
  });
};
/**
 * 所有Parser的入口，分配器
 *
 * @export
 * @abstract
 * @class Dispatcher
 */
// tslint:disable-next-line:max-classes-per-file
export class Dispatcher {
  protected parsers: ParserList = {};
  protected tagPairs: string[] = [];
  protected pairHash: NormalObject = {};
  protected readonly splitor: string = ':';
  protected instances: ParserInstances = {};
  //
  public halt(err: string): never {
    throw new Error(err);
  }
  /**
   *
   *
   * @param {string} name
   * @param {ParserConfig} config
   * @param {()=>void} parse
   * @returns {(never|void)}
   * @memberof Dispatcher
   */
  public addParser(name: string, config: ParserConfig, parse: () => void, setting?: NormalObject): never | void {
    const { startTag, endTag, separator } = config;
    const { splitor } = this;
    if(separator === splitor) {
      return this.halt(`the parser of ${name} can not set '${splitor}' as separator.`);
    }
    if (this.parsers.hasOwnProperty(name)) {
      return this.halt(`the parser of "${name}" has existed.`);
    }
    if (startTag.length === 0) {
      return this.halt(`the parser of "${name}"'s startTag can not be empty. `);
    }
    if (/(\\|:|\s)/.test(startTag.concat(endTag).join(''))) {
      const char = RegExp.$1;
      return this.halt(`the parser of "${name}" contains special char (${char})`);
    }
    //
    let rule = config.rule;
    const pairs: string[] = [];
    const hasRule = endTag.length === 0 && rule instanceof RegExp;
    if(!hasRule) {
      const sortFn = (a: string, b: string) => b.length > a.length ? 1 : -1;
      startTag.sort(sortFn);
      endTag.sort(sortFn);
    }
    const startRuleSegs: string[] = [];
    const endRuleSegs: string[] = [];
    const specialRepRule = /([()[{^$.*+?-])/g;
    const specialRepValue = '\\$1';
    startTag.map((start) => {
      if(!hasRule) {
        startRuleSegs.push(start.replace(specialRepRule, specialRepValue));
      }
      if (endTag.length) {
        endTag.map((end) => {
          pairs.push(start + splitor + end);
          if(!hasRule) {
            endRuleSegs.push(end.replace(specialRepRule, specialRepValue));
          }
        });
      } else {
        pairs.push(start);
      }
    });
    // check if exists
    for (let i = 0, j = pairs.length; i < j; i++) {
      const cur = pairs[i];
      if (this.tagPairs.indexOf(cur) > -1) {
        const pair = cur.split(splitor);
        return this.halt(`the parser of "${name}"'s start tag "${pair[0]}" and end tag "${pair[1]}" has existed.`);
      } else {
        this.pairHash[cur] = name;
      }
    }
    // build rule
    if(!hasRule) {
      const hasEnd = endTag.length;
      const endWith = `(?=${splitor.replace(specialRepRule, specialRepValue)}|$)`;
      const startWith = `(?:${startRuleSegs.join('|')})`;
      let context: string;
      if(hasEnd) {
        const endFilter = endRuleSegs.join('|');
        context = `${startWith}(?:\\\\.|[^\\\\](?!${endFilter})|[^\\\\])+?(?:${endFilter}${endWith})`;
      } else {
        context = `${startWith}(?:\\\\.|[^\\\\${splitor}])+?${endWith}`;
      }
      rule = new RegExp(context);
    }
    //
    this.tagPairs = this.tagPairs.concat(pairs);
    // make sure startTag and endTag combine is unique
    // tslint:disable-next-line:max-classes-per-file
    this.parsers[name] = class extends ParserInterface {
      public static readonly startTag: any[] = startTag;
      public static readonly endTag: any[] = endTag;
      public static readonly separator: string = separator || '';
      public static readonly splitor: string = splitor;
      public static readonly rule: RegExp = rule;
      constructor() {
        super();
        if(setting) {
          this.setting = Object.assign(this.setting, setting);
        }
      }
      public parse() {
        return parse.call(this);
      }
    };
  }
  /**
   *
   *
   * @param {string} code
   * @memberof Dispatcher
   */
  public parse(code: string): NormalObject | never {
    const len = code.length;
    const { splitor } = this;
    let index = 0;
    let curCode = code;
    const exists: NormalObject = {};
    const result: NormalObject = {};
    while(index < len) {
      const res: NormalObject | never = this.parseUntilFind(curCode);
      const { data, total } = res as NormalObject;
      console.log(data, total, '匹配到的结果');
      index += total;
      if(index < len) {
        if(splitor !== code.charAt(index)) {
          throw new Error(`unexpect splitor of "${code.slice(index + 1)}",expect to be ${splitor}`);
        } else {
          curCode = curCode.slice(++index);
        }
      }
      const { instance, type } = data;
      if(exists[type] && instance.setting.frozen) {
        console.log('should not go here');
        throw new Error(`the config of "${type}" can not be set again.`);
      } else {
        Object.assign(result, {
          [type]: instance.parse(),
        });
        exists[type] = true;
      }
    }
    return result;
  }
  protected getInstance(name: string) {
    if (this.instances[name]) {
      return this.instances[name].init();
    } else {
      return this.instances[name] = new this.parsers[name]();
    }
  }
  protected parseUntilFind(context: string) {
    const { tagPairs, pairHash, splitor, parsers } = this;
    const exactMatched: string[] = [];
    const error = `no found matched parser type.`;
    let allMatched: string[] = [];
    let startIndex = 0;
    let sub: string = '';
    let result: null | NormalObject = null;
    do {
      const cur = context.charAt(startIndex++);
      sub +=  cur;
      const total = sub.length;
      let isExactFind = false;
      allMatched = tagPairs.filter((pair) => {
        const flag = pair.indexOf(sub) === 0;
        if(flag && (pair === sub || pair.charAt(total) === splitor)) {
          isExactFind = true;
          exactMatched.push(pair);
        }
        return flag;
      });
      if(allMatched.length === 1) {
        if(!isExactFind) {
          const [ pair ] = allMatched;
          const index = pair.indexOf(splitor);
          const find = index > 0 ? pair.slice(0, index) : pair;
          if(context.indexOf(find) === 0) {
            exactMatched.push(pair);
          }
        }
        break;
      }
    } while (allMatched.length);
    let len = exactMatched.length;
    if(len) {
      const everTested: NormalObject = {};
      while(len--) {
        const pair = exactMatched[len];
        const type = pairHash[pair];
        if(everTested[type]) {
          continue;
        }
        let match = null;
        const parser = parsers[type];
        const { rule } = parser;
        if(match = context.match(rule)) {
          const instance = this.getInstance(type);
          const [ start, end ] = pair.split(splitor);
          const [ param ] = match;
          try {
            instance.parseCode(param, {
              start,
              end: end || '',
            });
            result = {
              data: {
                type,
                instance,
              },
              total: param.length,
            };
            break;
          } catch(e) {
            // ignore
            console.log('the wrong is', e.message);
            everTested[type] = true;
          }
        }
      }
      if(result) {
        return result;
      } else {
        throw new Error(error);
      }
    } else {
      throw new Error(error);
    }
  }
}
