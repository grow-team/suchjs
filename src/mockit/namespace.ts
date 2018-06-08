import * as Config from '../config';
//
import NormalObject = Config.NormalObject;
export interface ModifierFn<T>{
  (res:T):T|never;
}
export interface RuleFn{
  (cur:NormalObject):void;
}
type Result<T> = T|never;
export default abstract class Mockit<T>{
  protected rules:string[] = [];
  protected ruleFns:NormalObject = {};
  protected modifiers:string[] = [];
  protected modifierFns:NormalObject = {};
  protected params:NormalObject = {};
  protected generateFn:undefined|(() => Result<T>);
  constructor(){}
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
      fns[name] = () => {
        fn.call(this,this.params[name]);
      };
    }
  }

  addRule(name:string, fn:RuleFn, pos?:string){
    return this.add('rule', name, fn, pos);
  }

  addModifier(name:string,fn:ModifierFn<T>, pos?:string){
    return this.add('modifier', name, fn, pos);
  }

  setParams(params:NormalObject,value:undefined):void|never;
  setParams(key:string,value:NormalObject):void|never;
  setParams(key:any,value:any):void|never{
    if(typeof key === 'object' && value === undefined){
      this.params = key; 
    }else if(typeof key === 'string'){
      this.params[key] = value;
    }
    // 
    const {rules} = this;
    if(rules.length){
      try{
        rules.map((fnName) => {
          this.ruleFns[fnName].call(this);
        });
      }catch(e){
        throw e;
      }
    } 
  }


  reGenerate(fn?:()=>Result<T>){
    this.generateFn = fn;
  }

  make():Result<T>{
    const {modifiers,params} = this;
    let result = typeof this.generateFn === 'function'? this.generateFn.call(this) : this.generate(); 
    for(let i = 0, j = modifiers.length; i < j; i++){
      const name = modifiers[i];
      if(params.hasOwnProperty(name)){
        result = this.modifierFns[name].call(this,result);
      }
    }
    return result;
  };
  abstract generate():Result<T>;
  abstract test(target:T):boolean;
}