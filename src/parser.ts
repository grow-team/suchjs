import * as Utils from './utils';
import {Dispatcher} from './parser/namespace';
import * as ParserList from './parser/index';
const dispatcher = new Dispatcher;
Utils.map(ParserList,(item,key) => {
  // remove such as __esModule key
  if((<string>key).indexOf('_') === 0)return;
  dispatcher.addParser(<string>key,item.config,item.parse);
});
console.log(dispatcher.parse(`(1,100]:{10,20}:<aaags,dddd>:%03d:#[base=123;ok=true]`));
export default dispatcher;