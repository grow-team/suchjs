
import {NormalObject} from './config';
import {typeOf,deepLoop, valueof, map} from './utils';
import * as mockitList from './mockit';
import parser from './parser';


interface SuchConfig{
  instance?: boolean;
  config?: KeyRuleInterface;
}
interface KeyRuleInterface{
  min?:number;
  max?:number;
  optional:boolean;
  oneOf?:boolean;
  alwaysArray?:boolean;
}
interface MockitInstances{
  [index:string]: any;
}
interface MockerOptions{
  target:any;
  xpath:Array<string|number>;
  config?: KeyRuleInterface;
  instances: ArrKeyMap<Mocker>;
  datas:ArrKeyMap<any>;
}

const makeRandom = (min:number,max:number):number => {
  if(min === max){
    return min;
  }else{
    return min + Math.floor(Math.random() * (max + 1 - min));
  }
};

const isOptional = () => {
  return Math.round(Math.random()) === 0
};

type Xpath = (string|number)[];
/**
 *
 *
 * @class ArrKeyMap
 * @template T
 */
class ArrKeyMap<T>{
  private hashs:{[index:string]:T} = {};
  private buildKey(key:Xpath){
    return key.reduce((prev,next) => {
      return prev + '["' + ('' + next).replace(/"/g,'\\"') + '"]';
    },key.shift());
  }
  set(key:Xpath,value:T){
    this.hashs[this.buildKey(key)] = value;
    return this;
  }
  get(key:Xpath):T{
    return this.hashs[this.buildKey(key)];
  }
}

/**
 * 
 * 
 * @class Mocker
 */
class Mocker{
  readonly target:any;
  readonly parent:Mocker = null;
  readonly config:NormalObject = {};
  readonly required:boolean = true;
  readonly xpath:Xpath;
  readonly type:string;
  readonly isRoot:boolean;
  readonly mockFn:(dpath:Xpath)=>any;
  constructor(options:MockerOptions){
    const {target,xpath,config,instances,datas} = options;
    this.target = target;
    this.xpath = xpath;
    this.config = config || {};
    this.isRoot = xpath.length === 0;
    const dataType = typeOf(this.target).toLowerCase();
    let {min,max,oneOf,alwaysArray} = this.config;
    const hasLength = !isNaN(min);
    if(dataType === 'array'){
      // e.g {"a":["b","c"]}
      if(!hasLength){
        const mockers = target.map((item:any,index:number) => {
          const nowXpath = xpath.concat(index);
          let instance;
          instance = new Mocker({
            target: item,
            xpath: nowXpath,
            instances: instances.set(nowXpath,instance),
            datas: datas
          });
          return instance;
        });
        this.mockFn = (dpath) => {
          let result:any[] = [];
          mockers.map((instance:Mocker,index:number) => {
            const nowDpath = xpath.concat(index);
            const value = instance.mock(nowDpath);
            result[index] = value;
            datas.set(nowDpath,value);
          });
          return result;
        };
      }else{
        if(oneOf){
          // e.g {"a:[0,1]":[{b:1},{"c":1},{"d":1}]}
          if(alwaysArray){
            this.mockFn = (dpath) => {
              const result:any[] = [];
              const mIndex = makeRandom(0,target.length);
              const nowXpath = xpath.concat(mIndex);
              let instance = instances.get(nowXpath);
              if(!(instance instanceof Mocker)){
                instance = new Mocker({
                  target: target[mIndex],
                  xpath: nowXpath,
                  instances: instances.set(nowXpath,instance),
                  datas
                });
              }
            };
          }else{
            
          }
        }else{
        
        }
      }
    }else if(dataType === 'object'){
      // parse key
      let keys:NormalObject[] = [];
      for(let i in target){
        if(target.hasOwnProperty(i)){
          const val = target[i];
          const {key,config} = Mocker.parseKey(i);
          keys.push({
            key,
            target: val,
            config
          });
        }
      }
      this.mockFn = (dpath) => {
        const result:NormalObject = {};
        const xpath = this.xpath;
        keys.map((item) => {
          const {key,config,target} = item;
          const {optional} = config;
          const nowXpath = xpath.concat(key);
          const nowDpath = dpath.concat(key);
          if(optional && isOptional()){
            // do nothing
          }else{
            let instance = instances.get(nowXpath);
            if(!(instance instanceof Mocker)){
              instance = new Mocker({
                target,
                config,
                xpath: nowXpath,
                instances: instances.set(nowXpath,instance),
                datas: datas
              });
            }
            const value = instance.mock(dpath.concat(key));
            result[key] = value;
            datas.set(nowDpath,value);
          }
        });
        return result;
      };
    }else{
      let match;
      if(dataType === 'string' && (match = target.match(/^:([A-z]\w*)/)) && mockitList.hasOwnProperty(match[1])){
        const klass = (<NormalObject>mockitList)[match[1]];
        const instance = new klass;
        const meta = target.replace(match[0],'').replace(/^\s*:\s*/,'');
        const params = parser.parse(meta);
        instance.setParams(params);
        this.mockFn = () => instance.make();
      }else{
        this.mockFn = () => target;
      }
    }
  }
  static parseKey(key:string){
    const rule = /(\??)(:?)(?:\{(\d+)(?:,(\d+))?}|\[(\d+)(?:,(\d+))?])?$/;
    let match;
    let config:NormalObject = {};
    if(match = key.match(rule)){
      let [all, query, colon, lMin, lMax, aMin, aMax] = match;
      const hasArrLen = aMin !== undefined;
      const hasNormalLen = lMin !== undefined;
      config.optional = query === '?';
      config.oneOf = colon === ':';
      config.alwaysArray = hasArrLen;
      if(hasNormalLen || hasArrLen){
        let min = hasNormalLen ? lMin : aMin;
        let max = hasNormalLen ? lMax : aMax;
        if(max === undefined){
          max = min;
        }
        if(max <= min){
          throw new Error(`the max of ${max} is less than ${min}`);
        }
        config.min = min;
        config.max = max;
      }else if(config.oneOf){
        config.min = config.max = 1;
      }
      key = key.slice(0, -all.length);
    }
    return {
      key,
      config
    };
  }
  
  mock(dpath:Xpath){
    const {optional} = this.config;
    if(optional && isOptional()){
      return;
    }
    return this.mockFn(dpath);
  }
}
/**
 * 
 * 
 * @export
 * @class Such
 */
export default class Such{
  readonly target:any;
  readonly options:SuchConfig;
  readonly mocker:Mocker;
  readonly instances:ArrKeyMap<Mocker>;
  readonly datas:ArrKeyMap<any>;
  protected struct:NormalObject;
  constructor(target:any,options?:SuchConfig){
    this.target = target;
    this.instances = new ArrKeyMap();
    this.datas = new ArrKeyMap();
    this.mocker = new Mocker({
      target,
      xpath: [],
      config: options && options.config,
      instances: this.instances,
      datas: this.datas
    });
  }
  /**
   * 
   * 
   * @returns 
   * @memberof Such
   */
  a(){
    return this.mocker.mock([]);
  }
  /**
   * 
   * 
   * @static
   * @param {*} target 
   * @memberof Such
   */
  static as(target:any,options?:SuchConfig){
    const ret = new Such(target,options)
    return options && options.instance ? ret : ret.a();
  }
}