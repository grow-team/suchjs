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
export const deepLoop = (obj:any,fn:(key:string|number,value:any,parent:Object,path:string) => any,curPath:string[] = []) => {
  const type = typeOf(obj);
  if(type === 'Object'){
    for(let key in obj){
      const value = obj[key];
      const valType = typeOf(value);
      fn.call(null,key,value,obj,curPath.concat(key).join('.'));
      if(['Object','Array'].indexOf(valType) > -1){
        deepLoop(obj[key],fn,curPath.concat(key));
      }
    }
  }else if(type === 'Array'){
    for(let key = 0, len = obj.length; key < len; key++){
      const value = obj[key];
      const valType = typeOf(value);
      fn.call(null,key,value,obj,curPath.concat('' + key).join('.'));
      if(['Object','Array'].indexOf(valType) > -1){
        deepLoop(obj[key],fn,curPath.concat('' + key));
      }
    }
  }
  return;
};
export const makeRandom = (min:number, max:number):number => {
  if(min === max){
    return min;
  }else{
    return min + Math.floor(Math.random() * (max + 1 - min));
  }
};
export const isOptional = ():boolean => {
  return Math.round(Math.random()) === 0
};