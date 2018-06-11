import Mockit,{ModifierFn,RuleFn} from './namespace';
import {NormalObject} from '../config';
import { isOptional } from '../utils';
const factor = (type:number) => {
  const epsilon = (<NormalObject>Number).EPSILON || Math.pow(2,-52);
  switch(type){    
    case 2:
      return 1 - Math.random();
    case 3:
      return (1 + epsilon) * Math.random();
    case 0:
      return (1 - epsilon) * (1 - Math.random());
    case 1:
    default:
      return Math.random();
  }
};
export default class ToNumber extends Mockit<number>{
  constructor(){
    super();
    // Count
    this.addRule('Count',(Count:NormalObject) => {
      let {min,max,containsMin,containsMax} = Count;
      if(isNaN(min)){
        throw new Error(`the min param expect a number,but got ${min}`);
      }
      if(isNaN(max)){
        throw new Error(`the max param expect a number,but got ${max}`);
      }
      if(Number(min) >  Number(max)){
        throw new Error(`the min number ${min} is big than the max number ${max}`);
      }
    });
    // Format rule
    this.addRule('Format',(Format:NormalObject) => {
      const {format} = Format;
      
    });
    //
    this.addModifier('Format',<ModifierFn<number>>((result:number) => {
      return result;
    }));
  }
  generate(){
    const {Count} = this.params;
    let result:number;
    if(Count){
      const {min,max,containsMin,containsMax} = Count;
      result = +min + (max - min) * factor(1 * containsMin + 2 * containsMax);
    }else{
      result = Math.random() * Math.pow(10, Math.floor(10 * Math.random()));
      result = isOptional() ? -result : result;
    }
    return result;
  }
  test(){
    return true;
  }
  
}