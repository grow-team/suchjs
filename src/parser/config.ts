import { ParamsConfig, ParamsCount, ParamsWrapper, ParserInstance } from '../config';
const parser: ParserInstance =  {
  config: {
    startTag: ['#['],
    endTag: [']'],
    separator: ';',
  },
  parse(): ParamsConfig | never {
    const {params} = this.info();
    return {};
  },
};
export default parser;
