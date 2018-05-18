/// <reference path="./parser/namespace" />
/// <reference path="./utils" />

import * as ParserList from './parser/index';
const parser = new Parser.Dispatcher;
Utils.map(ParserList,(item,key) => {
  parser.addParser(<string>key,item.config,item.parse);
});
export default parser;