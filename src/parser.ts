import * as Utils from './utils';
import {Dispatcher} from './parser/namespace';
import * as ParserList from './parser/index';
const parser = new Dispatcher;
Utils.map(ParserList,(item,key) => {
  // remove such as __esModule key
  if((<string>key).indexOf('_') === 0)return;
  parser.addParser(<string>key,item.config,item.parse);
});
console.log(parser.parse(`(1]:{10,20}:<aaags,dddd>:%03d`));
export default parser;