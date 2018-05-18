/// <reference path="../config" />
const instance:Parser.ParserInstance =  {
  config: {
    startTag:['(','['],
    endTag: [')',']']
  },
  parse(){
    return {};
  }
};
export default instance;