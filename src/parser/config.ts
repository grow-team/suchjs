import {ParserInstance, ParamsCount, ParamsWrapper, ParamsConfig} from '../config';
const parser:ParserInstance =  {
  config: {
    startTag:['#['],
    endTag: [']'],
    separator: ';'
  },
  parse():ParamsConfig|never{
    const {params} = this.info();
    console.log('params is -----',params);
    return {};
  }
};
export default parser;