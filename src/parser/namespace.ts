import { ParserConfig } from '@/config';
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
  // 最终获取的信息，参数及开始结束标签
  protected params: string[];
  protected tags: Tags;
  // 是否已转义
  protected isInTrans: boolean;
  // 匹配开始标记相关
  protected startTagOk: boolean;
  protected matchedStartTagList: string[];
  protected startTagMatchedSeg: string;
  // 匹配结束标记相关
  protected hasEndTag: boolean;
  protected endTagOk: boolean;
  protected matchedEndTagList: string[];
  protected endTagMatchedSeg: string;
  // 参数索引
  protected paramIndex: number;
  //
  protected isPrevSeparator: boolean;
  //
  protected isSeparator: boolean;
  // constructor
  constructor() {
    this.init();
  }
  // init
  public init() {
    // 如果没有结束标签，表示不需要界定结束标签
    this.params = [];
    this.tags = {
      start: '',
      end: '',
    };
    this.isInTrans = false;
    // match start tag
    this.startTagMatchedSeg = '';
    this.startTagOk = false;
    this.matchedStartTagList = [];
    // match end tag
    this.hasEndTag = (this.constructor as ParserConstructor).endTag.length > 0;
    this.endTagOk = false;
    this.matchedEndTagList = [];
    this.endTagMatchedSeg = '';
    // param index
    this.paramIndex = 0;
    //
    this.isPrevSeparator = false;
    // 返回this
    return this;
  }
  // 获取参数解析信息
  public info() {
    return {
      tags: this.tags,
      params: this.params,
    };
  }
  //
  public isEndOk() {
    return this.endTagOk;
  }
  //
  public showError(err: string): never {
    throw new Error(err);
  }
  // 往Parser里添加code
  public addCode(code?: string) {
    const forceEnd = code === undefined;
    // 强制结束解析
    if (forceEnd) {
      if (!this.hasEndTag) {
        if (this.isInTrans) {
          return this.showError('wrong translate char at the end');
        } else {
          return this.endTagOk = true;
        }
      } else {
        if (this.endTagOk) {
          return;
        } else {
          return this.showError('标签没有正确结束');
        }
      }
    } else {
      if (this.endTagOk) {
        return this.showError('标签已解析完成，不能添加新的解析字符');
      }
      //
      const constr = this.constructor as ParserConstructor;
      const { startTag, endTag, separator, splitor } = constr;
      // startTag not matched yet
      if (!this.startTagOk) {
        const maybeTags = this.startTagMatchedSeg === '' ? startTag : this.matchedStartTagList;
        const matched = maybeTags.filter((tag) => {
          return tag.charAt(this.startTagMatchedSeg.length) === code;
        });
        if (matched.length) {
          this.matchedStartTagList = matched;
          this.startTagMatchedSeg += code;
        } else {
          if (maybeTags.indexOf(this.startTagMatchedSeg) > -1) {
            this.tags.start = this.startTagMatchedSeg;
            this.startTagOk = true;
          } else {
            return this.showError('解析有误，开始标签不匹配');
          }
        }
      }
      // after matched startTag
      if (this.startTagOk) {
        if (!this.endTagOk) {
          let needAddToParam = true;
          const { isInTrans } = this;
          if (!isInTrans) {
            if (this.hasEndTag) {
              const hasMatchedSeg = this.endTagMatchedSeg !== '';
              const maybeTags = hasMatchedSeg ? this.matchedEndTagList : endTag;
              const nextCode = this.endTagMatchedSeg + code;
              const matched = maybeTags.filter((tag) => {
                return tag.indexOf(nextCode) === 0;
              });
              const totalMatched = matched.length;
              if (totalMatched) {
                if (totalMatched === 1 && maybeTags.indexOf(nextCode) > -1) {
                  this.endTagOk = true;
                  this.tags.end = nextCode;
                  needAddToParam = false;
                  if (nextCode.length > 1) {
                    this.params[this.paramIndex] = this.params[this.paramIndex].slice(0, - (nextCode.length - 1));
                  } else if(this.isPrevSeparator) {
                    this.params[this.paramIndex] = '';
                  }
                } else {
                  this.matchedEndTagList = matched;
                  this.endTagMatchedSeg = nextCode;
                }
              } else {
                this.matchedEndTagList = [];
                this.endTagMatchedSeg = '';
              }
            }
            if (code === separator) {
              needAddToParam = false;
              if(this.paramIndex === 0 && this.params[0] === undefined) {
                this.params[0] = '';
              }
              this.paramIndex++;
              this.isPrevSeparator = true;
            } else {
              this.isPrevSeparator = false;
              if (code === '\\') {
                this.isInTrans = true;
              }
            }
          } else {
            this.isInTrans = false;
          }
          if (needAddToParam) {
            const { params, paramIndex } = this;
            if (params[paramIndex] === undefined) {
              params[paramIndex] = code;
            } else {
              if(isInTrans && (code === splitor || code === separator || endTag.indexOf(code) > -1)) {
                params[paramIndex] = params[paramIndex].slice(0, -1);
              }
              params[paramIndex] += code;
            }
          }
        }
      }
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
  public addParser(name: string, config: ParserConfig, parse: () => void): never | void {
    const {startTag, endTag, separator} = config;
    const { splitor } = this;
    if(separator === splitor) {
      return this.halt(`the parser of ${name} can not set '${splitor}' as separator.`);
    }
    if (this.parsers.hasOwnProperty(name)) {
      return this.halt(`${name}的parser已经存在，请查看命名`);
    }
    if (startTag.length === 0) {
      return this.halt(`${name}的解析器开始标签不能为空`);
    }
    if (/(\\|:|\s)/.test(startTag.concat(endTag).join(''))) {
      const char = RegExp.$1;
      return this.halt(`${name}的解析器开始或者结束标签里不能包含特殊含义字符(${char})`);
    }
    //
    const pairs: string[] = [];
    startTag.map((start) => {
      if (endTag.length > 1) {
        endTag.map((end) => {
          pairs.push(start + splitor + end);
        });
      } else {
        pairs.push([start].concat(endTag).join(splitor));
      }
    });
    for (let i = 0, j = pairs.length; i < j; i++) {
      const cur = pairs[i];
      if (this.tagPairs.indexOf(cur) > -1) {
        const pair = cur.split(splitor);
        return this.halt(`${name}的解析器开始标签(${pair[0]})与结束标签(${pair[1]})的组合已经存在于其它解析器`);
      } else {
        this.pairHash[cur] = name;
      }
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
    const segs: string[] = [];
    const { splitor } = this;
    let isInTrans = false;
    let seg: string = '';
    // 去掉首尾的空格
    for (let i = 0, j = code.length; i < j; i++) {
      const cur = code[i];
      if (!isInTrans) {
        if (cur === splitor) {
          segs.push(seg.trim());
          seg = '';
        } else {
          seg += cur;
          if (cur === '\\') {
            isInTrans = true;
          }
        }
      } else {
        seg += cur;
        isInTrans = false;
      }
    }
    segs.push(seg.trim());
    //
    const result = {};
    console.log('segs', segs);
    segs.map((cur) => {
      Object.assign(result, this.match(cur));
    });
    return result;
  }
  /**
   *
   *
   * @protected
   * @param {string} seg
   * @returns {(never|NormalObject)}
   * @memberof Dispatcher
   */
  protected match(seg: string): never | NormalObject {
    const { splitor } = this;
    let matchedStart = seg.charAt(0);
    let matchedPairs: string[] = getMatchedPairs(this.tagPairs, matchedStart);
    if (matchedPairs.length === 0) {
      return this.halt('没有找到匹配的参数开始标签');
    }
    let maybePairs: string[] = getExactPairs(matchedPairs, matchedStart, seg, splitor);
    for (let i = 1, j = seg.length; i < j; i++) {
      matchedStart += seg.charAt(i);
      const nextPairs = getMatchedPairs(matchedPairs, matchedStart);
      if (nextPairs.length === 0) {
        break;
      } else {
        matchedPairs = nextPairs;
        maybePairs = maybePairs.concat(getExactPairs(matchedPairs, matchedStart, seg, splitor));
      }
    }
    if (maybePairs.length === 0) {
      return this.halt('没有找到匹配的参数解析器');
    }
    const parserNames: string[] = [];
    for (let t = maybePairs.length - 1; t >= 0; t--) {
      const pair = maybePairs[t];
      const name = this.pairHash[pair];
      if (parserNames.indexOf(name) < 0) {
        parserNames.push(name);
      }
    }
    let curName: string;
    while ((curName = parserNames.shift()) !== undefined) {
      let instance: ParserInterface;
      if (this.instances.hasOwnProperty(curName)) {
        instance = this.instances[curName].init();
      } else {
        this.instances[curName] = instance = new this.parsers[curName]();
      }
      try {
        Utils.map(seg, (char, index) => {
          instance.addCode(char);
        });
        instance.addCode();
        if (instance.isEndOk()) {
          return {
            [curName]: instance.parse(),
          };
        } else {
          throw new Error('错误的解析');
        }
      } catch (e) {
        // continue
        if (parserNames.length === 0) {
          return this.halt(e.message);
        }
      }
    }
  }
}
