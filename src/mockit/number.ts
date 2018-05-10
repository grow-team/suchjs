/// <reference path="./namespace.ts" />
/// <reference path="../config.ts" />
namespace Mockit{
  /**
   * 
   * (:integer(2,10):%03)
   * @export
   * @class Number
   * @implements {Mocker}
   */
  type Meta = 'number' | 'string';
  type Option = Options['Number'];
  export class ToNumber extends Mocker<Meta,Option>{
    constructor(meta:Meta){
      super(meta)
    }
    parseOptions(meta:Meta):Option{
      return {
        format: '',
        min: 6,
        max: 9,
        containsMin:true,
        containsMax:true
      }
    }
    
  }
}