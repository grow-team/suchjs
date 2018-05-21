import {ParserInstance} from '../config';
const instance:ParserInstance =  {
  config: {
    startTag:['(','['],
    endTag: [')',']']
  },
  parse(){
    const {params,tags} = this.info();
    if(params.length !== 2)return this.showError(`解析Count规则有误：错误的参数个数，希望的参数个数为2，实际的参数个数为${params.length}`);
    
    return {

    };
  }
};
export default instance;