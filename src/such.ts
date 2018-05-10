
interface Config{
  alwaysArray?: boolean
}
export default class Such{
  protected constructor(){

  }
  /**
   * 
   * 
   * @static
   * @param {*} target 
   * @memberof Such
   */
  static as(target:any,options?:Config){
    const type = Object.prototype.toString.call(target).slice(8,-1)
    
  }
}

/** 
 * Such.as({
 *  '_({3,5})': [{
 *    'a{}': ''
 *  }]
 * })
 * 
*/