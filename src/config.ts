export const suchRule = /^:([A-z]\w*)/;
// mockit
/**
 * ParamsWrapper接口，一般针对字符串，在mock的数据首或尾添加指定字符，在表达式里用尖括号包裹<a,b>
 *
 * @interface ParamsWrapper
 */
export interface ParamsWrapper {
  prefix: string;
  suffix: string;
}
/**
 * ParamsLength接口，一般针对字符串或数组，设置最大最小长度，在表达式里用大括号包裹{3,6}
 *
 * @interface ParamsLength
 */
export interface ParamsLength {
  least: number;
  most: number;
}
/**
 * ParamsCount接口，一般针对数字，设置数字最大最小值，在表达式里用小括号或中括号包括(3,6]
 *
 * @interface ParamsCount
 */
export interface ParamsCount {
  range: Array<string | number>;
}
/**
 * ParamsFormat接口，一般针对数组、日期类型，设置要format的格式，在表达式里用%开头来表示
 *
 * @interface ParamsFormat
 */
export interface ParamsFormat {
  format: string;
}
/**
 * ParamsFunc接口，通过函数对数据做进一步的处理
 *
 * @export
 * @interface ParamsFunc
 */
export interface ParamsFunc {
  [index: number]: {
    name: string;
    params?: any[]
  };
}
/**
 *
 *
 * @export
 * @interface ParamsRegexp
 */
export interface ParamsRegexp {
  rule: string;
}
/**
 *
 *
 * @export
 * @interface ParamsConfig
 */
export interface ParamsConfig {
  [index: string]: string;
}
/**
 * Options接口，所有的模拟类型对应接受的表达式解析参数类型
 *
 * @export
 * @interface Options
 */
export interface Options {
  Number: ParamsCount & ParamsFormat;
  String: ParamsLength & ParamsWrapper;
}
// parser
export interface ParserConfig {
  startTag: string[];
  endTag: string[];
  separator?: string;
  splitor?: string;
  rule?: RegExp;
}
export interface ParserInstance {
  config: ParserConfig;
  parse(): object | never;
}
