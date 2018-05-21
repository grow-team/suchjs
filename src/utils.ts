export type NormalObject = {
  [index:string]:any
};
export type valueof<T> = T[keyof T];
export const typeOf = (target:any):string => {
  return Object.prototype.toString.call(target).slice(8,-1);
};
export const map = (target:(any[]|NormalObject|string),fn:(item:any,index:number|string) => void) => {
  if(typeOf(target) === 'Array'){
    return (<any[]>target).map(fn);
  }else if(typeOf(target) === 'Object'){
    const ret:NormalObject = {};
    target = <NormalObject>target;
    for(let key in target){
      ret[key] = fn(target[key],key);
    }
    return ret;
  }else if(typeOf(target) === 'String'){
    target = <string>target;
    for(let i = 0, j = target.length; i < j; i++){
      const code = target.charCodeAt(i);
      if(code >= 0xD800 && code <= 0xDBFF){
        let nextCode = target.charCodeAt(i+1);
        if(nextCode >= 0xDC00 && nextCode <= 0xDFFF){
          fn(target.substr(i,2),i);
          i++;
        }else{
          throw new Error('错误的字符编码');
        }
      }else{
        fn(target.charAt(i),i);
      }
    }
  }
};