namespace Mockit{
  /**
   * UseWrapper接口，一般针对字符串，在mock的数据首或尾添加指定字符，在表达式里用尖括号包裹<a,b>
   * 
   * @interface UseWrapper
   */
  interface UseWrapper{
    prefix:string;
    suffix:string;
  }
  /**
   * UseLength接口，一般针对字符串或数组，设置最大最小长度，在表达式里用大括号包裹{3,6}
   * 
   * @interface UseLength
   */
  interface UseLength{
    least:number;
    most:number;
  }
  /**
   * UseCount接口，一般针对数字，设置数字最大最小值，在表达式里用小括号或中括号包括(3,6]
   * 
   * @interface UseCount
   */
  interface UseCount{
    min:number;
    containsMin:boolean;
    max:number;
    containsMax:boolean;
  }
  /**
   * UseFormat接口，一般针对数组、日期类型，设置要format的格式，在表达式里用%开头来表示
   * 
   * @interface UseFormat
   */
  interface UseFormat{
    format:string;
  }
  /**
   * Options接口，所有的模拟类型对应接受的表达式解析参数类型
   * 
   * @export
   * @interface Options
   */
  export interface Options{
    Number: UseCount & UseFormat,
    String: UseLength & UseWrapper
  }
}