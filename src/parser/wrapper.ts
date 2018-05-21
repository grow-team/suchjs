import {ParserInstance} from '../config';
const instance:ParserInstance =  {
  config: {
    startTag:['<'],
    endTag: ['>']
  },
  parse(){
    const info = this.info();
    console.log('info is ---',info);
    return {};
  }
};
export default instance;