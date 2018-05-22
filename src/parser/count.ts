import {ParserInstance, ParamsCount} from '../config';
const parser:ParserInstance =  {
  config: {
    startTag:['(','['],
    endTag: [')',']']
  },
  parse():ParamsCount|never{
    const {params,tags} = this.info();
    if(params.length !== 2)return this.showError(`解析Count规则有误：错误的参数个数，希望的参数个数为2，实际的参数个数为${params.length}`);
    return {
      min: <string>(params[0]),
      containsMin: tags.start === '[',
      max: <string>(params[1]),
      containsMax: tags.end === ']'
    };
  }
};
export default parser;