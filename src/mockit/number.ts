import Mockit,{ModifierFn,RuleFn} from './namespace';
import * as Config from '../config';
const factor = (type:number) => {
  const epsilon = (<Config.NormalObject>Number).EPSILON || Math.pow(2,-52);
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
    this.addRule('Format',() => {
      const {Format} = this.params;
      
    });
    this.addModifier('Format',<ModifierFn<number>>((result:number) => {
      return result;
    }));
  }
  generate(){
    const {Count,Format} = this.params;
    let result:number;
    if(Count){
      const {min,max,containsMin,containsMax} = Count;
      
    }
    return result;
  }
  test(){
    return true;
  }
  
}