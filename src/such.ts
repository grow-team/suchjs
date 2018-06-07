import {NormalObject} from './config';
import {typeOf, deepLoop, valueof, map, makeRandom, isOptional} from './utils';
import * as mockitList from './mockit';
import parser from './parser';
/**
 *
 *
 * @interface SuchConfig
 */
interface SuchConfig{
  instance?: boolean;
  config?: KeyRuleInterface;
}
/**
 *
 *
 * @interface KeyRuleInterface
 */
interface KeyRuleInterface{
  min?:number;
  max?:number;
  optional?:boolean;
  oneOf?:boolean;
  alwaysArray?:boolean;
}
/**
 *
 *
 * @interface MockitInstances
 */
interface MockitInstances{
  [index:string]: any;
}
/**
 *
 *
 * @interface MockerOptions
 */
interface MockerOptions{
  target:any;
  xpath:Array<string|number>;
  parent?:Mocker;
  config?:KeyRuleInterface;
}
type Xpath = (string|number)[];
/**
 *
 *
 * @class ArrKeyMap
 * @template T
 */
class ArrKeyMap<T>{
  private hashs:{[index:string]:T} = {};
  private keyHashs: {[index:string]:Xpath} = {};
  private rootKey:string = '__ROOT__';
  private buildKey(key:Xpath){
    return key.reduce((prev,next) => {
      return prev + '["' + ('' + next).replace(/"/g,'\\"') + '"]';
    },this.rootKey);
  }
  /**
   *
   *
   * @param {Xpath} key
   * @param {T} value
   * @returns
   * @memberof ArrKeyMap
   */
  set(key:Xpath,value:T){
    const saveKey = this.buildKey(key);
    this.hashs[saveKey] = value;
    this.keyHashs[saveKey] = key;
    return this;
  }
  /**
   *
   *
   * @param {Xpath} key
   * @returns {T}
   * @memberof ArrKeyMap
   */
  get(key:Xpath):T{
    return this.hashs[this.buildKey(key)];
  }
  /**
   *
   *
   * @memberof ArrKeyMap
   */
  clear(){
    this.hashs = {};
    this.keyHashs = {};
  }
}
/**
 * 
 * 
 * @class Mocker
 */
class Mocker{
  readonly target:any;
  readonly config:NormalObject = {};
  readonly xpath:Xpath;
  readonly type:string;
  readonly instances?:ArrKeyMap<Mocker>;
  readonly datas?:ArrKeyMap<any>;
  readonly root:Mocker;
  readonly parent:Mocker;
  readonly dataType:string;
  readonly isRoot:boolean;
  readonly mockFn:(dpath:Xpath)=>any;
  constructor(options:MockerOptions,rootInstances?:ArrKeyMap<Mocker>,rootDatas?:ArrKeyMap<any>){
    const {target,xpath,config,parent} = options;
    this.target = target;
    this.xpath = xpath;
    this.config = config || {};
    this.isRoot = xpath.length === 0;
    if(this.isRoot){
      this.instances = rootInstances;
      this.datas = rootDatas;
      this.root = this;
      this.parent = this;
    }else{
      this.parent = parent;
      this.root = parent.root;
    }
    const dataType = typeOf(this.target).toLowerCase();
    const {min,max,oneOf,alwaysArray} = this.config;
    const {instances,datas} = this.root;
    const hasLength = !isNaN(min);
    this.dataType = dataType;
    if(dataType === 'array'){
      const getInstance = (index?:number):Mocker => {
        const mIndex = !isNaN(index) ? index : makeRandom(0,target.length - 1);
        const nowXpath = xpath.concat(mIndex);
        let instance = instances.get(nowXpath);
        if(!(instance instanceof Mocker)){
          instance = new Mocker({
            target: target[mIndex],
            xpath: nowXpath,
            parent: this
          });
          instances.set(nowXpath,instance);
        }
        return instance;
      };
      if(!hasLength){
        // e.g {"a":["b","c"]}
        const mockers = target.map((item:any,index:number) => {
          return getInstance(index);
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
        const makeArrFn = (dpath:Xpath,instance:Mocker|Mocker[],total?:number) => {
          const result:any[] = [];
          const makeInstance = instance instanceof Mocker ? (i:number) => <Mocker>instance : (i:number) => (<Mocker[]>instance)[i];
          total = !isNaN(total) ? total : makeRandom(min,max);
          for(let i = 0; i < total; i++){
            const nowDpath = dpath.concat(i);
            const value = makeInstance(i).mock(nowDpath);
            result[i] = value;
            datas.set(nowDpath,value);
          }
          return result;
        };
        const makeOptional = (dpath:Xpath,instance:Mocker,total:number):never|any => {
          let result; 
          if(total > 1){
            throw new Error(`optional func of the total param can not more than 1`);
          }else if(total === 1){
            result = instance.mock(dpath);
          }
          datas.set(dpath,result);
          return result;
        };
        let resultFn:(dpath:Xpath,instance:Mocker)=>any;
        if(oneOf){
          if(alwaysArray){
            // e.g {"a:[0,1]":[{b:1},{"c":1},{"d":1}]}
            resultFn = makeArrFn;
          }else{  
            // e.g {"a:{0,5}":["amd","cmd","umd"]}
            resultFn = (dpath,instance) => {
              const total = makeRandom(min,max);
              if(total <= 1)return makeOptional(dpath,instance,total);
              return makeArrFn(dpath,instance,total);
            };
          }
          this.mockFn = (dpath) => {
            const instance = getInstance();
            return resultFn(dpath,instance);
          };
        }else{
          //e.g {"a[1,3]":["amd","cmd","umd"]}
          //e.g {"a{0,3}":["amd","cmd","umd"]}
          const makeRandArrFn = (dpath:Xpath,total?:number) => {
            total = !isNaN(total) ? total : makeRandom(min,max);
            const instances = Array.apply(null,new Array(total)).map(() => {
              return getInstance();
            });
            return makeArrFn(dpath, instances, total);
          };
          if(alwaysArray || min > 1){
            this.mockFn = (dpath) => {
              return makeRandArrFn(dpath);
            };
          }else{
            this.mockFn = (dpath) => {
              const total = makeRandom(min,max);
              if(total <= 1)return makeOptional(dpath,getInstance(),total);
              return makeRandArrFn(dpath,total);
            };
          }
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
                parent: this
              });
              instances.set(nowXpath,instance);
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
        this.type = match[1];
        const klass = (<NormalObject>mockitList)[match[1]];
        const instance = new klass;
        const meta = target.replace(match[0],'').replace(/^\s*:\s*/,'');
        if(meta !== ''){
          const params = parser.parse(meta);
          instance.setParams(params);
        }
        this.mockFn = () => instance.make();
      }else{
        this.mockFn = () => target;
      }
    }
  }
  static parseKey(key:string){
    const rule = /(\??)(:?)(?:\{(\d+)(?:,(\d+))?}|\[(\d+)(?:,(\d+))?])?$/;
    let match:any[];
    let config:NormalObject = {};
    if((match = key.match(rule)).length && match[0] !== ''){
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
        if(max < min){
          throw new Error(`the max of ${max} is less than ${min}`);
        }
        config.min = Number(min);
        config.max = Number(max);
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
  /**
   *
   *
   * @param {Xpath} [dpath]
   * @returns
   * @memberof Mocker
   */
  mock(dpath?:Xpath){
    const {optional} = this.config;
    dpath = this.isRoot ? [] : dpath;
    if(this.isRoot && optional && isOptional()){
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
  private initail:boolean = false;
  constructor(target:any,options?:SuchConfig){
    this.target = target;
    this.instances = new ArrKeyMap();
    this.datas = new ArrKeyMap();
    this.mocker = new Mocker({
      target,
      xpath: [],
      config: options && options.config
    },this.instances,this.datas);
  }
  /**
   * 
   * 
   * @returns 
   * @memberof Such
   */
  a(){
    if(!this.initail){
      this.initail = true;
    }else{
      this.datas.clear();
    }
    return this.mocker.mock();
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