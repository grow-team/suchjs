import Mockit,{ModifierFn,RuleFn} from './namespace';
import {NormalObject} from '../config';
import { isOptional } from '../utils';
import printf,{rule as formatRule} from '../helpers/printf';
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
    // Count Rule
    this.addRule('Count',(Count:NormalObject) => {
      const {range} = Count;
      const size = range.length;
      if(size !== 2){
        throw new Error(size < 2 ? `the count param must have the min and the max params` : `the count param length should be 2,but got ${size}`);
      }
      const [min,max] = range;
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
      if(!formatRule.test(format)){
        throw new Error(`Wrong format rule(${format})`);
      }
    });
    // Format Modifier
    this.addModifier('Format',<ModifierFn<number>>((result:number,Format:NormalObject) => {
      return printf(Format.format,result);
    }));
  }
  generate(){
    const {Count} = this.params;
    let result:number;
    if(Count){
      const {range,containsMin,containsMax} = Count;
      const [min,max] = range;
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