/// <reference path="../utils.ts" />

namespace Mockit{
  export abstract class Mocker<Meta,Option>{
    readonly meta:Meta;
    readonly options:Option;
    readonly isExp:boolean = false;
    readonly type:string;
    /**
     * 构造函数
     * @param {Meta} meta 
     * @memberof Mocker
     */
    constructor(meta:Meta){
      this.meta = meta;
      if(typeof meta === 'string' && /^:([A-z]\w*).*$/.test(meta)){
        this.isExp = true;
        this.type = RegExp.$1;
        this.options = this.parseOptions(<string>meta);
      }else{
        this.options = this.getOptions(meta);
      }
    }
    /**
     * 解析表达式的各个参数
     * 
     * @protected
     * @param {string} meta 
     * @returns {Option} 
     * @memberof Mocker
     */
    protected parseOptions(meta:string):Option{
      const exp = meta.substr(this.type.length);
      let prev = '';
      let isParamBegin = true;
      let isStartTrans = false;
      Utils.map(exp, (char,index) => {
        
        prev = char;
      });
      return 
    }
    /**
     * 
     * 
     * @memberof Mocker
     */
    halt(){

    }
    /**
     * getOptions方法：获取原生非表达式类型的参数
     * 
     * @abstract
     * @param {Meta} meta 
     * @returns {Option} 
     * @memberof Mocker
     */
    abstract getOptions(meta:Meta):Option;
    /**
     * is方法：检测目标数据是否和规则匹配
     * 
     * @abstract
     * @param {Meta} target 
     * @param {string} [rule] 
     * @returns {boolean} 
     * @memberof Mocker
     */
    abstract is(target:Meta, rule?:string):boolean;
    /**
     * make方法：根据options参数，创建一个随机数据
     * 
     * @abstract
     * @returns {Meta} 
     * @memberof Mocker
     */
    abstract make():Meta;
  }
}