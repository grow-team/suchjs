
import {NormalObject} from './config';
import {typeOf,deepLoop} from './utils';
import * as mockitList from './mockit';
import parser from './parser';
interface SuchConfig{
  instance?: boolean;
  config?: NormalObject;
}
interface MockerOptions{
  origKey:string;
  parent:Mocker;
  xpath:string;
}
class Mocker{
  readonly origKey:string;
  readonly key:string;
  readonly parent:Mocker;
  readonly config:NormalObject;
  readonly required:boolean;
  readonly xpath:string;
  readonly type:string;
  constructor(options:MockerOptions){
    
  }
}
export default class Such{
  readonly target:any;
  readonly options:SuchConfig;
  protected isBaseType:boolean = false;
  protected initilized:boolean = false;
  protected rootType:string;
  protected rootMockit:NormalObject;
  protected struct:NormalObject;
  constructor(target:any,options?:SuchConfig){
    this.target = target;
    this.rootType = typeOf(target).toLowerCase();
  }
  /**
   * 
   * 
   * @returns 
   * @memberof Such
   */
  a(){
    if(this.isBaseType){
      return this.target;
    }else{
      if(this.rootType === 'string'){
        if(this.rootMockit){
          return this.rootMockit.make();
        }else if(/:([A-z]\w*)/.test(this.target) && mockitList.hasOwnProperty(RegExp.$1)){
          const klass = (<NormalObject>mockitList)[RegExp.$1];
          this.rootMockit = new klass;
          const params = parser.parse(this.target.replace(RegExp.$1,'').replace(/^\s*:\s*/,''));
          this.rootMockit.setParams(params);
          return this.rootMockit.make();
        }else{
          this.isBaseType = true;
          return this.target;
        }
      }else{
        if(this.rootType === 'array' || this.rootType === 'object'){
          if(!this.initilized){
            const last = this.struct = this.rootType === 'array' ? [] : {};
            deepLoop(this.target,(key,value,parent,curPath) => {
              
            });
          }else{
            deepLoop(this.struct,() => {

            });
          }
        }else{
          this.isBaseType = true;
          return this.target;
        }
      }
    }
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