import {ParserInstance, ParamsWrapper} from '../config';
const parser:ParserInstance =  {
  config: {
    startTag:['<'],
    endTag: ['>']
  },
  parse():ParamsWrapper|never{
    const {params} = this.info();
    if(params.length !== 2)return this.showError('');
    return {
      prefix: params[0],
      suffix: params[1]
    };
  }
};
export default parser;