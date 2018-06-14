import * as Config from '../config';
//
import NormalObject = Config.NormalObject;
export interface ModifierFn<T>{
  (res:T):T|string|never;
}
export interface RuleFn{
  (cur:NormalObject):void|NormalObject;
}
type Result<T> = T|never;
export default abstract class Mockit<T>{
  protected rules:string[] = [];
  protected ruleFns:NormalObject = {};
  protected modifiers:string[] = [];
  protected modifierFns:NormalObject = {};
  protected params:NormalObject = {};
  protected generateFn:undefined|(() => Result<T>);
  protected frozenRules:string[] = [];
  /**
   *Creates an instance of Mockit.
   * @memberof Mockit
   */
  constructor(){
  }
  /**
   *
   *
   * @private
   * @param {("rule"|"modifier")} type
   * @param {string} name
   * @param {(RuleFn|ModifierFn<T>)} fn
   * @param {string} [pos]
   * @returns {(never|void)}
   * @memberof Mockit
   */
  private add(type:"rule"|"modifier", name:string,  fn:RuleFn|ModifierFn<T>, pos?:string):never|void{
    let target;
    let fns;
    if(type === 'rule'){
      target = this.rules;
      fns = this.ruleFns;
    }else if(type === 'modifier') {
      target = this.modifiers;
      fns = this.modifierFns;
    }else{
      throw new Error('unkonwn type');
    }
    if(target.indexOf(name) > -1){
      throw new Error(`${type} of ${name} already exists`);
    }else{
      if(typeof pos === 'undefined' || pos.trim() === ''){
        target.push(name);
      }else{
        let prepend = false;
        if(pos.charAt(0) === '^'){
          prepend = true;
          pos = pos.slice(1);
        }
        if(pos === ''){
          target.unshift(name);
        }else{
          const findIndex = target.indexOf(pos);
          if(findIndex < 0){
            throw new Error(`no exists ${type} name of ${pos}`);
          }else{
            target.splice(findIndex + (prepend ? 0 : 1), 0, name);
          }
        }
      }
      fns[name] = fn;
    }
  }
  /**
   *
   *
   * @param {string} name
   * @param {RuleFn} fn
   * @param {string} [pos]
   * @returns
   * @memberof Mockit
   */
  addRule(name:string, fn:RuleFn, pos?:string){
    return this.add('rule', name, fn, pos);
  }
  /**
   *
   *
   * @param {string} name
   * @param {ModifierFn<T>} fn
   * @param {string} [pos]
   * @returns
   * @memberof Mockit
   */
  addModifier(name:string,fn:ModifierFn<T>, pos?:string){
    return this.add('modifier', name, fn, pos);
  }
  /**
   *
   *
   * @param {NormalObject} params
   * @param {undefined} value
   * @returns {(void|never)}
   * @memberof Mockit
   */
  setParams(params:NormalObject,value:undefined):void|never;
  setParams(key:string,value:NormalObject):void|never;
  setParams(key:any,value:any):void|never{
    let params:NormalObject = {};
    if(typeof key === 'object' && value === undefined){
      params = key; 
    }else if(typeof key === 'string'){
      params[key] = value;
    }
    const {rules,ruleFns} = this;
    const keys = Object.keys(params);
    (keys.length > 1 ? keys.sort((a:string,b:string) => {
      return rules.indexOf(a) < rules.indexOf(b) ? 1 : -1;
    }) : keys).map((name:string) => {
      if(rules.indexOf(name) > -1){
        try{
          const res = ruleFns[name].call(this,params[name]);
          if(typeof res === 'object'){
            this.params[name] = res;
          }else{
            this.params[name] = params[name];
          }
        }catch(e){
          throw e;
        } 
      }else{
        throw new Error(`un supported param (${name})`);
      }
    });
  }
  /**
   *
   *
   * @param {()=>Result<T>} [fn]
   * @memberof Mockit
   */
  reGenerate(fn?:()=>Result<T>){
    this.generateFn = fn;
  }
  /**
   *
   *
   * @returns {Result<T>}
   * @memberof Mockit
   */
  make(Such?:NormalObject):Result<T>{
    const {modifiers,params} = this;
    let result = typeof this.generateFn === 'function'? this.generateFn.call(this) : this.generate(); 
    for(let i = 0, j = modifiers.length; i < j; i++){
      const name = modifiers[i];
      if(params.hasOwnProperty(name)){
        const fn = this.modifierFns[name];
        const args = [result,this.params[name]];
        if(fn.length === 3){
          args.push(Such);
        }
        result = fn.apply(this,args);
      }
    }
    return result;
  };
  /**
   *
   *
   * @abstract
   * @returns {Result<T>}
   * @memberof Mockit
   */
  abstract generate():Result<T>;
  /**
   *
   *
   * @abstract
   * @param {T} target
   * @returns {boolean}
   * @memberof Mockit
   */
  abstract test(target:T):boolean;
}