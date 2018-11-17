import { ParamsRegexp, ParserInstance } from '../config';
const parser: ParserInstance =  {
  config: {
    startTag: ['$'],
    endTag: [],
  },
  parse(): ParamsRegexp | never {
    const { params } = this.info();
    if(params.length !== 1) {
      return this.showError('');
    }
    return {
      rule: params[0],
    };
  },
};
export default parser;
