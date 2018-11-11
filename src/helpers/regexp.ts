import { NormalObject } from '@/types';
type Flags = Array<'i' | 'm' | 'g' | 'u' | 'y'>;
const getRandom = (min: number, max: number) => {
  return min + Math.floor(Math.random() * (max - min + 1));
};
const getLastItem = (arr: any[]) => {
  return arr[arr.length - 1];
};
export const symbols: NormalObject = {
  begin: '^',
  end: '$',
  matchAny: '.',
  groupBegin: '(',
  groupEnd: ')',
  uncapture: '?:',
  lookahead: '?=',
  lookaheadNot: '?!',
  groupSplitor: '|',
  setBegin: '[',
  setEnd: ']',
  rangeSplitor: '-',
  multipleBegin: '{',
  multipleEnd: '}',
  multipleSplitor: ',',
  translate: '\\',
  leastOne: '+',
  multiple: '*',
  optional: '?',
  setNotIn: '^',
};
export default class RegexpParser {
  public readonly rule: string = '';
  public readonly context: string = '';
  public readonly flags: Flags = [];
  // tslint:disable-next-line:max-line-length
  public readonly codeSetsSymbols: string[] = ['d', 'D', 's', 'S', 'w', 'W', 't', 'r', 'n', 'f', 'v', 'b', 'B', 'c', 'x', 'u'];
  private unexpectCode: string = '';
  private isRuleComplete: boolean = false;
  constructor(rule: string) {
    if(/^\/(.+)\/([imguy]*)$/.test(rule)) {
      this.rule = rule;
      this.context = RegExp.$1;
      this.flags = RegExp.$2 ? (RegExp.$2.split(',') as Flags) : [];
    } else {
      throw new Error(`wrong regexp:${rule}`);
    }
  }
  public parse() {
    const { context, flags } = this;
    const s = symbols;
    let i: number = 0;
    const j: number = context.length;
    const queues: RegexpPart[] = [new RegexpBegin()];
    const groups: RegexpGroup[] = [];
    const captureGroups: RegexpGroup[] = [];
    const refGroups: {[index: string]: RegexpGroup | null } = {};
    const captureRule = /^(\?(?:<(.+?)>|<=|<!|=|!|:))/;
    let groupCaptureIndex: number = 0;
    let curSet = null;
    let curRange = null;
    // /()/
    while(i < j) {
      // current character
      const char: string = context.charAt(i++);
      // when in set,ignore these special chars
      if((curSet || curRange) && ['[', '(', ')', '|', '*', '?', '+', '{', '.', '}', '^'].indexOf(char) > -1) {
        const newChar = new RegexpChar(char);
        if(curRange) {
          newChar.parent = curRange;
          curRange.add(newChar);
          curRange = null;
        } else {
          newChar.parent = curSet;
          if(char === '^' && (curSet as RegexpSet).isSetStart()) {
            curSet.reverse = true;
          }
          curSet.add(newChar);
        }
        queues.push(newChar);
        continue;
      }
      // match more
      const nextAll: string = context.slice(i);
      const lastGroup = getLastItem(groups);
      const lastQueue = getLastItem(queues);
      let target = null;
      switch(char) {
        // match translate first,match "\*"
        case s.translate:
          // move one char
          const next = context.charAt(i++);
          if(next === 'u' || next === 'x') {
            // unicode
            target = new RegexpUnicode(next);
            const matchedNum: number = target.untilEnd(context.slice(i));
            if(matchedNum === 0) {
              // not regular unicode,"\uzyaa"
              target = new RegexpChar('\\u');
            } else {
              // is unicode,move matchedNum
              i += matchedNum;
            }
          } else if(next === 'c') {
            // control char
            const code = context.charAt(i);
            if(/[a-z]/i.test(code)) {
              target = new RegexpControl(code);
              i++;
            } else {
              target = new RegexpIgnore('\\c');
            }
          } else if(['d', 'D', 'w', 'W', 's', 'S', 'b', 'B'].indexOf(next) > -1) {
            // charsets
            target = new RegexpCharsets(next);
            // do something optimize
            if(curSet) {
              //
            }
          } else if(['t', 'r', 'n', 'f', 'v'].indexOf(next) > -1) {
            // print chars
            target = new RegexpPrint(next);
          } else if(/^(\d+)/.test(nextAll)) {
            const no = RegExp.$1;
            if(curSet) {
              // in set, "\" + \d will parse as octal
              if(/^([0-7]+)/.test(no)) {
                const octal = RegExp.$1;
                target = new RegexpOctal(`\\${octal}`);
                i += octal.length - 1;
              } else {
                target = new RegexpChar(`\\${no.charAt(0)}`);
              }
            } else {
              // refrence
              if(no.charAt(0) === '0') {
                target = new RegexpNull();
              } else {
                i += no.length - 1;
                target = new RegexpReference(no);
                const refGroup = captureGroups[+no];
                refGroups[no] = refGroup;
                if(refGroup) {
                  if(refGroup.isAncestorOf(lastGroup)) {
                    target.setRef(null);
                  } else {
                    target.setRef(refGroup);
                  }
                } else {
                  target.setRef(null);
                }
              }
            }
          } else {
            // charsets
            target = new RegexpTranslateChar(next);
          }
          break;
        // match group begin "("
        case s.groupBegin:
          target = new RegexpGroup();
          if(lastGroup) {
            target.parent = lastGroup;
            lastGroup.add(target);
          }
          groups.push(target);
          // get capture info
          if(captureRule.test(nextAll)) {
            const { $1: all, $2: captureName } = RegExp;
            if(all === '?:') {
              // do nothing, captureIndex = -1 by default
            } else if(captureName) {
              // named group
              target.captureIndex = ++ groupCaptureIndex;
              target.captureName = captureName;
            } else {
              throw new Error(`do not use any lookahead\\lookbehind:${all}`);
            }
            i += all.length;
          } else {
            target.captureIndex = ++groupCaptureIndex;
          }
          if(target.captureIndex > 0) {
            captureGroups.push(target);
          }
          break;
        // match group end ")"
        case s.groupEnd:
          const last = groups.pop();
          if(last) {
            last.isComplete = true;
          } else {
            throw new Error(`unmatched ${char},you mean "\\${char}"?`);
          }
          break;
        // match group splitor "|"
        case s.groupSplitor:
          const group = getLastItem(groups);
          if(!group) {
            target = new RegexpGroup();
            target.isRoot = true;
            target.addNewGroup(queues.slice(0));
            queues.splice(0, queues.length, target);
            groups.push(target);
          } else {
            group.addNewGroup();
          }
          break;
        // match set begin "["
        case s.setBegin:
          if(/^\\b]/.test(nextAll)) {
            target = new RegexpBackspace();
            i += 3;
          } else {
            target = new RegexpSet();
            curSet = target;
          }
          break;
        // match set end "]"
        case s.setEnd:
          if(curSet) {
            curSet.isComplete = true;
            curSet = null;
          } else {
            target = new RegexpChar(char);
          }
          break;
        // match range splitor "-"
        case s.rangeSplitor:
          if(curSet) {
            if(lastQueue.type === 'set') {
              // such as [-aaa]
              target = new RegexpChar(char);
            } else {
              const nextChar = nextAll.charAt(0);
              if(nextChar === s.setEnd ) {
                curSet.isComplete = true;
                curSet = null;
                i += 1;
              } else {
                const first = queues.pop();
                target = new RegexpRange();
                target.add(first);
                curRange = target;
              }
            }
          } else {
            target = new RegexpChar(char);
          }
          break;
        // match times
        case s.multipleBegin:
        case s.optional:
        case s.multiple:
        case s.leastOne:
          target = new RegexpTimes(context.slice(i - 1));
          const num = target.untilEnd();
          if(num > 0) {
            if((lastGroup && lastGroup.isGroupStart()) || lastQueue.type === 'begin' || lastQueue.type === 'times') {
              throw new Error(`nothing to repeat:${context.slice(i - 1, i - 1 + num)}`);
            } else {
              i += num - 1;
            }
          } else {
            target = new RegexpChar(char);
          }
          break;
        // match any .
        case s.matchAny:
          target = new RegexpAny();
          break;
        // default
        default:
          target = new RegexpChar(char);
      }
      // push target to queues
      if(target) {
        const cur = target as RegexpPart;
        queues.push(cur);
        if(curRange && curRange.isComplete === false && curRange !== target) {
          target.parent = curRange;
          curRange.add(target);
          curRange = null;
        } else if(curSet && curSet !== cur) {
          cur.parent = curSet;
          curSet.add(cur);
        } else if(groups.length) {
          const group = getLastItem(groups);
          if(group !== cur) {
            cur.parent = group;
            group.add(cur);
          }
        }
      }
    }
    // if root group,set completed when parse end
    if(queues.length === 1 && queues[0].type === 'group') {
      const group = queues[0] as RegexpGroup;
      if(group.isRoot = true) {
        group.isComplete = true;
      }
    }
  }

  private matchUnexpectCode(code: string) {
    return this.unexpectCode === code;
  }
}

export interface NumberRange {
  min: number;
  max: number;
}

/**
 *
 *
 * @export
 * @abstract
 * @class RegexpPart
 */
// tslint:disable-next-line:max-classes-per-file
export abstract class RegexpPart {
  public readonly queues: Array<string | number | RegexpPart> = [];
  public isComplete: boolean = false;
  public parent: null | RegexpPart = null;
  protected min: number = 1;
  protected max: number = 1;
  protected input: string = '';
  constructor(public readonly type: string, public readonly context?: string) {}
  public setRange(options: NumberRange) {
    Object.keys(options).forEach((key: keyof NumberRange) => {
      this[key] = options[key];
    });
  }
  public add(target: string | RegexpPart, options?: NormalObject): void | boolean | never {
    //
  }
  public prebuild(): string {
    return  (this.queues.reduce((res, cur) => {
      // tslint:disable-next-line:max-line-length
      return res + (typeof cur === 'number' ? String.fromCodePoint(cur) : cur as string);
    }, '')) as string;
  }
  public build(): string | number | never {
    this.checkBuild();
    const { min, max } = this;
    const total =  min + Math.floor(Math.random() * (max - min + 1));
    if(total === 0) {return ''; }
    return this.prebuild().repeat(total);
  }
  public remove(): string | number | RegexpPart {
    return this.queues.pop();
  }
  public toString() {
    return this.build();
  }
  public checkBuild() {
    if(!this.isComplete) {
      throw new Error(`the ${this.type} is not complete correctly,please check.`);
    }
  }
  public isCompleteJudge(char: string | RegexpPart) {
    if(this.isComplete) {
      throw new Error(`the type of ${this.type} is completed,unexpect ${char.toString()}`);
    }
  }
  public untilEnd(context: string) {
    //
  }
  public isAncestorOf(target: RegexpPart) {
    do {
      if(target === this) {
        return true;
      }
    } while(target = target.parent);
    return false;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpReference extends RegexpPart {
  private ref: RegexpGroup | null = null;
  constructor(context: string) {
    super('refrence', context);
  }
  public setRef(ref: RegexpGroup | null) {
    this.ref = ref;
  }
  public build() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpAny extends RegexpPart {
  constructor() {
    super('any');
    this.isComplete = true;
    this.input = '.';
  }
  public build() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpNull extends RegexpPart {
  constructor() {
    super('null');
    this.isComplete = true;
    this.input = '\\0';
  }
  public build() {
    return '\x00';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpBackspace extends RegexpPart {
  constructor() {
    super('backspace');
    this.isComplete = true;
    this.input = '[\\b]';
  }
  public build() {
    return '\u0008';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpBegin extends RegexpPart {
  constructor() {
    super('begin');
    this.input = '';
    this.isComplete = true;
  }
  public prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpControl extends RegexpPart {
  constructor(context: string) {
    super('charsets', context);
    this.isComplete = true;
    this.input = `\\${this.context}`;
  }
  public prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpCharsets extends RegexpPart {
  constructor(context: string) {
    super('charsets', context);
    this.isComplete = true;
    this.input = `\\${this.context}`;
  }
  public prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpPrint extends RegexpPart {
  constructor(context: string) {
    super('print', context);
    this.isComplete = true;
  }
  public prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpIgnore extends RegexpPart {
  constructor(context: string) {
    super('ignore', context);
    this.isComplete = true;
    this.input = context;
  }
  public build() {
    // tslint:disable-next-line:no-console
    console.warn('');
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpChar extends RegexpPart {
  constructor(context: string) {
    super('char', context);
    this.isComplete = true;
    this.input = context;
  }
  public build() {
    return this.context.slice(-1);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpOctal extends RegexpPart {
  constructor(context: string) {
    super('octal', context);
    this.isComplete = true;
    this.input = context;
  }
  public build() {
    return `0o${this.context.slice(1)}`;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpTranslateChar extends RegexpPart {
  constructor(context: string) {
    super('translate', context);
    this.input = context;
  }
  public build() {
    return this.context;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpTimes extends RegexpPart {
  private greedy: boolean = false;
  private readonly maxNum: number = 5;
  constructor(context: string) {
    super('times', context);
    this.min = 0;
    this.max = 0;
  }
  public untilEnd() {
    const { context } = this;
    const start = context.charAt(0);
    if(start === '{') {
      if(/^(\{(\d+)(?:,(\d+))})/.test(context)) {
        const {$1: all, $2: min, $3: max} = RegExp;
        this.input = all;
        this.isComplete = true;
        this.min = parseInt(min, 10);
        this.max = max !== undefined ? parseInt(max, 10) : this.min;
        return all.length;
      } else {
        return 0;
      }
    } else {
      if(/^(\*\?|\+\?|\*|\+|\?)/.test(context)) {
        this.isComplete = true;
        this.input = RegExp.$1;
        const total = this.input.length;
        this.greedy = total === 2;
        switch(this.input.charAt(0)) {
          case '*':
            this.max = this.maxNum;
            break;
          case '+':
            this.min = 1;
            this.max = this.maxNum;
            break;
          case '?':
            this.max = 1;
            break;
        }
        return total;
      } else {
        return 0;
      }
    }
  }
  public build() {
    return '';
  }
}
//
export interface CaptureOptions {
  capture: boolean;
  name: string;
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpCapture extends RegexpPart {
  private options: CaptureOptions = {
    capture: true,
    name: '',
  };
  constructor() {
    super('capture');
  }
  public add(char: string, options: CaptureOptions) {
    this.queues.push(char);
    this.options = options;
  }
  public getOptions() {
    return this.options;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpSet extends RegexpPart {
  public reverse: boolean = false;
  constructor() {
    super('set');
    this.isComplete = false;
  }
  public add(target: RegexpPart) {
    const { queues } = this;
    queues.push(target);
  }
  public isSetStart() {
    return this.queues.length === 0;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpRange extends RegexpPart {
  constructor() {
    super('range');
  }
  /**
   *
   *
   * @param {(string | RegexpUnicode)} target
   * @returns
   * @memberof RegexpRange
   */
  public add(target: RegexpPart) {
    const { queues } = this;
    const total = queues.length;
    if(total === 1) {
      this.isComplete = true;
    }
    this.queues.push(target);
  }
  /**
   *
   *
   * @returns
   * @memberof RegexpRange
   */
  public build() {
    const [minCode, maxCode] = this.queues;
    if(minCode > maxCode) {
      throw new Error(`wrong range:`);
    } else {
      return getRandom(minCode as number, maxCode as number);
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpUnicode extends RegexpPart {
  private codePoint: string = '';
  private isConst: boolean = false;
  private isUcode: boolean = false;
  constructor(context: string) {
    super('unicode', context);
    this.isConst = context === 'x';
  }
  public untilEnd(match: string): number {
    const rule = this.isConst ? /^([0-9a-f]{2})/i : /^([0-9a-f]{4}|{([0-9a-f]{4}|[0-9a-f]{6})})/i;
    if(rule.test(match)) {
      const { $1: all, $2: ucode } = RegExp;
      const { context } = this;
      this.isUcode = !!ucode;
      this.codePoint = ucode || all;
      this.input = `\\${context}${all}`;
      return all.length;
    } else {
      return 0;
    }
  }
  public build() {
    const { codePoint, isUcode } = this;
    if(isUcode) {
      //
    }
    return Number(`0x${codePoint}`);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpGroup extends RegexpPart {
  public captureIndex: number = -1;
  public captureName: string = '';
  public isRoot: boolean = false;
  private groups: RegexpPart[][] = [[]];
  constructor() {
    super('group');
  }
  public addNewGroup(queue?: RegexpPart[]) {
    const { groups } = this;
    if(queue) {
      groups[groups.length - 1] = queue;
    }
    this.groups.push([]);
  }
  public add(target: RegexpPart) {
    const { groups } = this;
    const lastGroup = getLastItem(groups);
    lastGroup.push(target);
  }
  public isGroupStart() {
    return this.groups[this.groups.length - 1].length === 0;
  }
}

const testCase = new RegexpParser(`/\\11([1-9]{3,4}|a*|b|[\\b]\\1)[\\u4e00-\\uffff]/`);
testCase.parse();
