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
      let isInParsing = false;
      let isParamBegin = true;
      let skipIndex = -Infinity;
      const showError = (errmsg:string,index:number,char:string):never => {
        throw new Error(`${errmsg}，位置${index}<字符：${char}>`);
      };
      Utils.map(exp, (char,index:number) => {        
        // 第一个参数的:可以忽略
        if(index === 0 && char === ':')return;
        // 需要跳过的部分，忽略代码
        if(index <= skipIndex)return;
        // 如果参数解析尚未开始
        if(isParamBegin){
          if(!isInParsing){
            //解析尚未开始，忽略多余的空格等
            if(char === '' || char === '\t'){
              return;
            }else{
              isInParsing = true;
              switch(char){
                case '{':
                  break;
                case '[':
                case '(':
                  break;
                case '<':
                  break;
                case '#':
                  const nextChar = exp.charAt(index + 1);
                  if(nextChar === '['){
                    skipIndex = index + 1; 
                  }else{
                    showError('无法解析的参数开始符，此处可能是"["',index + 1,nextChar);
                  }
                  break;
                default:
                  return showError('不能识别的参数开始符',index,char);
              }
            }
          }else{
            // 往Parser里添加字符

          }
        }else{
          if(char === '' || char === '\t'){
            // 忽略多余的空格和制表符
            return;
          }else{
            if(char === ':'){
              // 如果找到:分隔符
              isParamBegin = true;
            }else{
              // 其它字符均抛出异常
              return showError('缺少正确的参数分隔符',index,char);
            }
          }
        }
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