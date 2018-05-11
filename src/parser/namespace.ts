namespace Paser{
  interface Config{
    startTag: string[];
    endTag: string[];
    splitTag?: string;
    stopTag?: string[];
  }
  export abstract class ParamParser{
    readonly options:Config;
    readonly isEnd:boolean = false;
    readonly params:any[] = [];
    constructor(options:Config){
      this.options = options;  
    }
    add(tag:string){
      
    }
  }
}