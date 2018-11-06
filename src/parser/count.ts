import { ParamsCount, ParserInstance } from '../config';
const parser: ParserInstance =  {
  config: {
    startTag: ['(', '['],
    endTag: [')', ']'],
  },
  parse(): ParamsCount | never {
    const {params, tags} = this.info();
    return {
      containsMin: tags.start === '[',
      containsMax: tags.end === ']',
      range: params,
    };
  },
};
export default parser;
