import { ParamsFunc, ParserInstance } from '../config';
const parser: ParserInstance =  {
  config: {
    startTag: ['@'],
    endTag: [],
    separator: '|',
  },
  parse(): ParamsFunc | never {
    const {params} = this.info();
    if(params.length !== 2) {
      return this.halt('');
    }
    return [];
  },
};
export default parser;
