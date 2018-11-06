import { ParamsFormat, ParserInstance } from '../config';
const parser: ParserInstance =  {
  config: {
    startTag: ['%'],
    endTag: [],
  },
  parse(): ParamsFormat | never {
    const {params} = this.info();
    if(params.length !== 1) {return this.showError(''); }
    return {
      format: '%' + params[0],
    };
  },
};
export default parser;
