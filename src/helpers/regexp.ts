import { NormalObject } from '@/types';
type Flag = 'i' | 'm' | 'g' | 'u' | 'y';
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
  public readonly flags: Flag[] = [];
  public readonly lastRule: string = '';
  private queues: RegexpPart[] = [];
  private ruleInput: string = '';
  constructor(rule: string) {
    if(/^\/(.+)\/([imguy]*)$/.test(rule)) {
      this.rule = rule;
      this.context = RegExp.$1;
      this.flags = RegExp.$2 ? (RegExp.$2.split(',') as Flag[]) : [];
      this.parse();
      this.lastRule = this.ruleInput;
    } else {
      throw new Error(`wrong regexp:${rule}`);
    }
  }
  public parse() {
    const { context } = this;
    const s = symbols;
    let i: number = 0;
    const j: number = context.length;
    const queues: RegexpPart[] = [new RegexpBegin()];
    const groups: RegexpGroup[] = [];
    const captureGroups: RegexpGroup[] = [];
    const refGroups: {[index: string]: RegexpGroup | null } = {};
    const captureRule = /^(\?(?:<(.+?)>|<=|<!|=|!|:))/;
    const hasFlagU = this.hasFlag('u');
    let groupCaptureIndex: number = 0;
    let curSet = null;
    let curRange = null;
    // /()/
    while(i < j) {
      // current character
      const char: string = context.charAt(i++);
      // when in set,ignore these special chars
      if((curRange || curSet) && ['[', '(', ')', '|', '*', '?', '+', '{', '.', '}', '^'].indexOf(char) > -1) {
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
      let special: null | RegexpPart = null;
      switch(char) {
        // match translate first,match "\*"
        case s.translate:
          // move one char
          const next = context.charAt(i++);
          const input = char + next;
          if(next === 'u' || next === 'x') {
            // unicode,ascii,if has u flag,can also match ${x{4}|x{6}}
            target = next === 'x' ? new RegexpASCII() : (hasFlagU ? new RegexpUnicodeAll() : new RegexpUnicode());
            const matchedNum: number = target.untilEnd(context.slice(i));
            if(matchedNum === 0) {
              // not regular unicode,"\uzyaa"
              target = new RegexpIgnore(`\\${next}`);
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
            target = new RegexpCharsets(input);
            // do something optimize
            if(curSet) {
              //
            }
          } else if(['t', 'r', 'n', 'f', 'v'].indexOf(next) > -1) {
            // print chars
            target = new RegexpPrint(input);
          } else if(/^(\d+)/.test(nextAll)) {
            const no = RegExp.$1;
            if(curSet) {
              // in set, "\" + \d will parse as octal
              if(/^([0-7]+)/.test(no)) {
                const octal = RegExp.$1;
                target = new RegexpOctal(`\\${octal}`);
                i += octal.length - 1;
              } else {
                target = new RegexpTranslateChar(`\\${no.charAt(0)}`);
              }
            } else {
              // reference
              if(no.charAt(0) === '0') {
                target = new RegexpNull();
              } else {
                i += no.length - 1;
                target = new RegexpReference(`\\${no}`);
                const refGroup = captureGroups[+no];
                refGroups[no] = refGroup;
                if(refGroup) {
                  if(refGroup.isAncestorOf(lastGroup)) {
                    target.ref = null;
                  } else {
                    target.ref = refGroup;
                  }
                } else {
                  target.ref = null;
                }
              }
            }
          } else {
            // charsets
            target = new RegexpTranslateChar(input);
          }
          break;
        // match group begin "("
        case s.groupBegin:
          target = new RegexpGroup();
          if(lastGroup) {
            target.parent = lastGroup;
            lastGroup.add(target);
          }
          special = new RegexpSpecial('groupBegin');
          groups.push(target);
          // get capture info
          if(captureRule.test(nextAll)) {
            const { $1: all, $2: captureName } = RegExp;
            if(all === '?:') {
              // do nothing, captureIndex = 0 by default
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
            special = new RegexpSpecial('groupEnd');
            special.parent = last;
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
            special = new RegexpSpecial('groupSplitor');
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
          special = new RegexpSpecial('setBegin');
          break;
        // match set end "]"
        case s.setEnd:
          if(curSet) {
            curSet.isComplete = true;
            special = new RegexpSpecial('setEnd');
            special.parent = curSet;
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
                const first =  curSet.pop();
                target = new RegexpRange();
                target.add(first);
                lastQueue.parent = target;
                special = queues.pop();
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
          target = char === s.multipleBegin ? new RegexpTimesMulti() : new RegexpTimesQuantifiers();
          const num = target.untilEnd(context.slice(i - 1));
          if(num > 0) {
            const type = lastQueue.special || lastQueue.type;
            const error = `nothing to repeat[index:${i}]:${context.slice(i - 1, i - 1 + num)}`;
            // tslint:disable-next-line:max-line-length
            if(type === 'groupStart' || type === 'groupSplitor' || type === 'multipleEnd' || type === 'times' || type === 'multipleOptional' || type === 'begin') {
              // allow {1,2}?,??,but not allow ?+,{1,2}+,
              if(type === 'multipleEnd' && char === s.optional) {
                target = new RegexpIgnore('\\?');
                special = new RegexpSpecial('multipleOptional');
              } else {
                throw new Error(error);
              }
            } else {
              i += num - 1;
              if(char === s.multipleBegin || char === s.optional) {
                special = new RegexpSpecial('multipleEnd');
              }
              if(type === 'groupEnd' || type === 'setEnd') {
                target.target = lastQueue.parent;
              } else {
                target.target = lastQueue;
              }
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
      // add special
      if(special) {
        if(target) {
          special.parent = target;
        }
        queues.push(special);
      }
    }
    // if root group,set completed when parse end
    if(queues.length === 1 && queues[0].type === 'group') {
      const group = queues[0] as RegexpGroup;
      if(group.isRoot = true) {
        group.isComplete = true;
      }
    }
    // check the queues whether if completed and saved the root queues
    const rootQueues: RegexpPart[] = [];
    let ruleInput = '';
    queues.every((queue) => {
      if(!queue.isComplete) {
        throw new Error(`the regexp segment ${queue.type} is not completed:${queue.input}`);
      }
      if(queue.parent === null) {
        rootQueues.push(queue);
        ruleInput += queue.getRuleInput();
      }
      return true;
    });
    this.ruleInput = ruleInput;
    console.log(queues);
  }
  //
  private hasFlag(flag: Flag) {
    return this.flags.indexOf(flag) > -1;
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
  public readonly queues: RegexpPart[] = [];
  public isComplete: boolean = true;
  public parent: null | RegexpPart = null;
  public abstract readonly type: string;
  protected min: number = 1;
  protected max: number = 1;
  constructor(public input: string = '') {}
  public setRange(options: NumberRange) {
    Object.keys(options).forEach((key: keyof NumberRange) => {
      this[key] = options[key];
    });
  }
  public add(target: string | RegexpPart, options?: NormalObject): void | boolean | never {
    //
  }
  //
  public pop() {
    return this.queues.pop();
  }
  public build(): string | number | never {
    const { min, max } = this;
    if(min === 0 && max === 0) {
      return '';
    } else {
      const total =  min + Math.floor(Math.random() * (max - min + 1));
      if(total === 0) {
        return '';
      }
      return this.prebuild().repeat(total);
    }
  }
  // toString
  public toString() {
    return this.build();
  }
  // parse until end
  public untilEnd(context: string) {
    // will extend by child class
  }
  // check if this is the ancestor of the target
  public isAncestorOf(target: RegexpPart): boolean {
    do {
      if(target === this) {
        return true;
      }
    } while(target = target.parent);
    return false;
  }
  // get last input, remove named group's name.e.g
  public getRuleInput(): string {
    if(this.queues.length) {
      return this.queues.reduce((result: string, next: RegexpPart) => {
        return result + next.getRuleInput();
      }, '');
    } else {
      return this.input;
    }
  }
  // when
  protected prebuild(): string | never {
    if(this.queues.length) {
      return this.queues.reduce((res, cur: RegexpPart) => {
        return res + cur.build();
      }, '');
    } else {
      return '';
    }
  }

}
// tslint:disable-next-line:max-classes-per-file
export class RegexpReference extends RegexpPart {
  public readonly type = 'reference';
  public ref: RegexpGroup | null = null;
  public index: number;
  constructor(input: string) {
    super(input);
    this.index = Number(`${input.slice(1)}`);
  }
  public prebuild() {
    if(this.ref) {
      return '';
    } else {
      return '';
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpSpecial extends RegexpPart {
  public readonly type = 'special';
  constructor(public readonly special: string) {
    super();
    this.min = 0;
    this.max = 0;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpAny extends RegexpPart {
  public readonly type = 'any';
  constructor() {
    super('.');
  }
  protected prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpNull extends RegexpPart {
  public readonly type = 'null';
  constructor() {
    super('\\0');
  }
  public prebuild() {
    return '\x00';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpBackspace extends RegexpPart {
  public readonly type = 'backspace';
  constructor() {
    super('[\\b]');
  }
  public prebuild() {
    return '\u0008';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpBegin extends RegexpPart {
  public readonly type = 'begin';
  public prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpControl extends RegexpPart {
  public readonly type = 'control';
  public prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpCharsets extends RegexpPart {
  public readonly type = 'charsets';
  public prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpPrint extends RegexpPart {
  public readonly type = 'print';
  public prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpIgnore extends RegexpPart {
  public readonly type = 'ignore';
  public prebuild() {
    // tslint:disable-next-line:no-console
    console.warn(`the "${this.input}" will ignore.`);
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpChar extends RegexpPart {
  public readonly type = 'char';
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpTranslateChar extends RegexpPart {
  public readonly type = 'translate';
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpOctal extends RegexpPart {
  public readonly type = 'octal';
  public prebuild() {
    return `0o${this.input.slice(1)}`;
  }
}
// tslint:disable-next-line:max-classes-per-file
export abstract class RegexpTimes extends RegexpPart {
  public readonly type = 'times';
  protected readonly maxNum: number = 5;
  protected greedy: boolean = true;
  protected abstract readonly rule: RegExp;
  constructor() {
    super();
    this.isComplete = false;
    this.min = 0;
    this.max = 0;
  }
  set target(target: RegexpPart) {
    target.setRange({
      min: this.min,
      max: this.max,
    });
  }
  public untilEnd(context: string) {
    if(this.rule.test(context)) {
      const all = RegExp.$1;
      this.isComplete = true;
      this.input = all;
      this.parse();
      return all.length;
    }
    return 0;
  }
  public abstract parse(): void;
  protected prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpTimesMulti extends RegexpTimes {
  protected rule = /^(\{(\d+)(?:,(\d+))})/;
  public parse() {
    const { $2: min, $3: max} = RegExp;
    this.min = parseInt(min, 10);
    this.max = Number(max) ? parseInt(max, 10) : this.min;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpTimesQuantifiers extends RegexpTimes {
  protected rule = /^(\*\?|\+\?|\*|\+|\?)/;
  public parse() {
    const all = RegExp.$1;
    this.greedy = all.length === 1;
    switch(all.charAt(0)) {
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
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpSet extends RegexpPart {
  public readonly type = 'set';
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
  public readonly type = 'range';
  constructor() {
    super();
    this.isComplete = false;
  }
  public add(target: RegexpPart) {
    const { queues } = this;
    const total = queues.length;
    if(total === 1) {
      this.isComplete = true;
    }
    this.queues.push(target);
  }
  protected prebuild() {
    const [minCode, maxCode] = this.queues;
    if(minCode > maxCode) {
      throw new Error(`wrong range:`);
    } else {
      return '';
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export abstract class RegexpHexCode extends RegexpPart {
  public readonly type = 'hexcode';
  public codePoint: number;
  protected abstract rule: RegExp;
  protected abstract codeType: string;
  public untilEnd(context: string): number {
    const { rule, codeType } = this;
    if(rule.test(context)) {
      const { $1: all, $2: codePoint } = RegExp;
      const lastCode = codePoint || all;
      this.codePoint = Number(`0x${lastCode}`);
      this.input = `\\${codeType}${all}`;
    }
    return 0;
  }
  protected prebuild() {
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpUnicode extends RegexpHexCode {
  protected rule = /^([0-9a-f]{4})/i;
  protected codeType = 'u';
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpUnicodeAll extends RegexpHexCode {
  protected rule = /^({([0-9a-f]{4}|[0-9a-f]{6})}|[0-9a-f]{2})/i;
  protected codeType = 'u';
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpASCII extends RegexpHexCode {
  protected rule = /^([0-9a-f]{2})/i;
  protected codeType = 'x';
}

// tslint:disable-next-line:max-classes-per-file
export class RegexpGroup extends RegexpPart {
  public readonly type = 'group';
  public captureIndex: number = 0;
  public captureName: string = '';
  public isRoot: boolean = false;
  private groups: RegexpPart[][] = [[]];
  constructor() {
    super();
    this.isComplete = false;
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
    const last = getLastItem(groups);
    last.push(target);
  }
  public isGroupStart() {
    return this.groups[this.groups.length - 1].length === 0;
  }
}

const testCase = new RegexpParser(`/(a)1{2,3}/`);
