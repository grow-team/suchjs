import {ParserInstance} from '../config';
const instance:ParserInstance =  {
  config: {
    startTag:['{'],
    endTag: ['}']
  },
  parse(){
    console.log(this.info());
    return {};
  }
};
export default instance;