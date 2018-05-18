/// <reference path="../utils" />
/// <reference path="../config" />

namespace Parser{
  interface Tags{
    start:string;
    end:string;
  }
  interface ParserConstructor extends ParserConfig{
    new (): ParserInterface;
  }
  /**
   * 定义解析器抽象类
   * 
   * @interface ParserInterface
   */
  abstract class ParserInterface{
    // 最终获取的信息，参数及开始结束标签
    protected params:string[];
    protected tags:Tags;
    // 已解析字符
    protected parsedCode:string;
    // 当前位置的字符位置索引
    protected codeIndex:number;
    // 是否已转义
    protected isInTrans:boolean;
    protected transIndexs:number[];
    // 是否解析已结束
    protected isParseEnded:boolean; 
    // 匹配开始标记相关
    protected startTagBegin:boolean;
    protected startTagOk:boolean;
    protected startTagLastIndex:number;
    protected matchedStartTagList:string[];
    protected startTagMatchedSeg:string;
    // 匹配结束标记相关 
    protected hasEndTag:boolean;
    protected endTagOk:boolean;
    protected matchedEndTagList:string[];
    protected endTagMatchedSeg:string;
    // 参数索引
    protected paramIndex:number;
    // 构造函数
    constructor(){
      this.init();
    }
    // 初始化，以便能重复利用parser实例
    init(){
      // 如果没有结束标签，表示不需要界定结束标签
      this.params = [];
      this.tags = {
        start: '',
        end: ''
      };
      this.isInTrans = false;
      this.transIndexs = [];
      this.isParseEnded = false;
      this.codeIndex = 0;
      // 匹配开始标记
      this.startTagMatchedSeg = '';
      this.startTagBegin = false;
      this.startTagOk = false;
      this.startTagLastIndex = 0;
      this.matchedStartTagList = [];
      // 匹配结束标记 
      const endTag = (<ParserConstructor>this.constructor).endTag;
      this.hasEndTag = endTag.length === 0;
      this.endTagOk = false;
      this.matchedEndTagList = [];
      this.endTagMatchedSeg = '';
      // 参数索引
      this.paramIndex = 0;
    }
    // 获取开始结束标记
    getTags(){
      return this.tags;
    }
    // 获取参数
    getParams(){
      return this.params;
    }
    //
    showError(err:string):never{
      throw new Error(err);
    }
    // 往Parser里添加code
    addCode(code:string|undefined){
      if(this.isParseEnded){
        this.showError('标签已解析完成，不能添加新的解析字符');
      }
      if(typeof code === 'undefined'){
        // 如果强制结束解析
        if(this.startTagOk && this.params.length && (this.hasEndTag ? this.endTagOk : true)){
          this.endTagOk = true;
          this.isParseEnded = true;
        }else{
          this.showError(!this.startTagOk ? '开始标签解析有误' : (this.params.length === 0 ? '没有找到对应的参数': '结束标签解析有误'));
        }
      }else{
        const constr = <ParserConstructor>this.constructor;
        const {startTag, endTag} = constr;
        const cur = code.trim();
        // save parsed code
        this.parsedCode += code;
        this.codeIndex += code.length;
        // startTag not matched yet
        if(!this.startTagOk){
          if(!this.startTagBegin){
            if(cur === ''){
              // ignore whitespaces
            }else{
              this.startTagBegin = true;
            }
          }
          // startTag should match now
          if(this.startTagBegin){
            const maybeTags = this.startTagMatchedSeg === '' ? startTag : this.matchedStartTagList;
            const matched = maybeTags.filter((tag) => {
              return tag.charAt(this.startTagMatchedSeg.length) === cur;
            });
            if(matched.length){
              if(matched.length === 1){
                // find the only tag matched
                this.tags.start = matched[0];
                this.startTagOk = true;
              }else{
                this.matchedStartTagList = matched;
                this.startTagMatchedSeg += cur;
              }
            }else{
              this.showError('解析有误，开始标签不匹配');
            }
          }
        }
        // after matched startTag
        if(this.startTagOk){
          if(!this.endTagOk){
            let needAddToParam = true;
            if(!this.isInTrans){
              if(cur === ','){
                needAddToParam = false;
                this.paramIndex++;
              }else if(cur === ':'){
                needAddToParam = false;
                if(this.hasEndTag){
                  this.showError('结束标签不正确');
                }else{
                  this.endTagOk = true;
                  this.isParseEnded = true;
                }
              }else if(cur === '\\'){
                this.isInTrans = true;
              }else{
                if(this.hasEndTag){
                  const hasMatchedSeg = this.endTagMatchedSeg !== '';
                  const maybeTags = hasMatchedSeg ? this.matchedEndTagList : endTag;
                  const nextCode = this.endTagMatchedSeg + code;
                  const matched = maybeTags.filter((tag) => {
                    return tag.indexOf(nextCode) === 0;
                  });
                  const totalMatched = matched.length;
                  if(totalMatched){
                    if(totalMatched === 1){
                      this.endTagOk = true;
                      this.tags.end = matched[0];
                    }else{
                      this.matchedEndTagList = matched;
                      this.endTagMatchedSeg = nextCode;
                    }
                  }else{
                    if(hasMatchedSeg){
                      const findIndex = maybeTags.indexOf(this.endTagMatchedSeg);
                      if(findIndex > -1){
                        if(cur === ''){
                          this.endTagOk = true;
                          this.tags.end = maybeTags[findIndex];
                        }else{
                          this.showError('错误的结束标签');
                        }
                      }else{
                        this.matchedEndTagList = [];
                        this.endTagMatchedSeg = '';
                      }
                    }
                  }
                }
              }
            }else{
              this.isInTrans = false;
            }
            if(needAddToParam){
              this.params[this.paramIndex] += code;
            }
          }else{
            if(cur === ''){
              // ignore whitespaces
            }else if(cur === ':'){
              this.isParseEnded = true;
            }else{
              this.showError('解析有误，无法识别的结束标签');
            }
          }
        }
      }
    }
    getParsedCode(){
      return this.parsedCode;
    }
    abstract parse():Object;
  }
  interface ParserList{
    [index: string]: ParserConstructor
  }
  /**
   * 所有Parser的入口，分配器
   * 
   * @export
   * @abstract
   * @class Dispatcher
   */
  export class Dispatcher{
    protected parsers:ParserList;
    protected tagPairs:string[];
    halt(err:string):never{
      throw new Error(err);
    }
    /**
     * 
     * 
     * @param {string} name 
     * @param {ParserConfig} config 
     * @param {()=>void} parse 
     * @returns {(never|void)} 
     * @memberof Dispatcher
     */
    addParser(name:string,config:ParserConfig,parse:()=>void):never|void{
      const {startTag,endTag} = config;
      if(this.parsers.hasOwnProperty(name)){
        return this.halt(`${name}的parser已经存在，请查看命名`);
      }
      if(startTag.length === 0){
        return this.halt('${name}的解析器开始标签不能为空');
      }
      if(/(\\|:|\s)/.test(startTag.concat(endTag).join(''))){
        const char = RegExp.$1;
        return this.halt(`${name}的解析器开始或者结束标签里不能包含特殊含义字符(${char})`);
      }
      //
      const pairs:string[] = [];
      const splitor = ':';
      startTag.map((start) => {
        if(endTag.length > 1){
          endTag.map((end) => {
            pairs.push(start + splitor + end);
          });
        }else{
          pairs.push([start].concat(endTag).join(splitor));
        }
      });
      for(let i = 0, j = pairs.length; i < j; i++){
        const cur = pairs[i];
        if(this.tagPairs.indexOf(cur) > -1){
          const pair = cur.split(splitor);
          return this.halt(`${name}的解析器开始标签(${pair[0]})与结束标签(${pair[1]})的组合已经存在于其它解析器`);
        }
      }
      // 
      this.tagPairs = this.tagPairs.concat(pairs);
      // make sure startTag and endTag combine is unique
      this.parsers[name] = class extends ParserInterface{
        static startTag:any[] = startTag;
        static endTag:any[] = endTag;
        parse(){
          return parse.call(this);
        }
      };
    }
    
    parse(code:string){

    }
  } 
}