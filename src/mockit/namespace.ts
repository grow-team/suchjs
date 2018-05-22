import * as Config from '../config';
//
export abstract class Mockit<T>{
  protected rules:string[];
  protected requiredRules:string[];
  private origRules:string[];
  protected params:Object;
  abstract readonly type:string;
  constructor(params?:Object){
    if(typeof params === 'object'){
      this.setParams(params);
    }
  }
  addRule(name:string, fn:()=> T|never, pos?:string){
    
  }
  setParams(params:Object):void|never{
    const keys = Object.keys(params);
    const rules = this.rules;
    const noExists = keys.filter((rule) => {
      return rules.indexOf(rule) < 0;
    });
    if(noExists.length){
      throw new Error(`无法解析的规则：${noExists.join('&')}`);
    }else{
      this.params = params;
    }  
  }
  
  make():T|never{
    const {rules,params} = this;
    let result:T|never;
    let dones:string[] = [];
    for(let i = 0, j = rules.length; i < j; i++){
      const name = rules[i];
      if(params.hasOwnProperty(name) && dones.indexOf(name) < 0){
        
      }
    }
    return ;
  };

  abstract test(target:T):boolean;
}