import {ParserInstance, ParamsFunc} from '../config';
const parser:ParserInstance =  {
  config: {
    startTag:['@'],
    endTag: [],
    separator: '|'
  },
  parse():ParamsFunc|never{
    const {params} = this.info();
    if(params.length !== 2)return this.showError('');
    return [];
  }
};
export default parser;