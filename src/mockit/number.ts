import Mockit from './namespace';
const factor = (options) => {
  const {containsMin,containsMax} = options;
  const type = containsMin * 1 + containsMax * 2;
  switch(type){    
    case 2:
      return 1 - Math.random();
    case 3:
      
    case 0:
      return (1 - Math.random()) + Math.random();
    case 1:
    default:
      return Math.random();
  }
};
export default class ToNumber extends Mockit<number>{
  constructor(){
    super();
    this.addRule('')
  }
  generate(){
    const {Count,Format} = this.params;
    let result:number;
    if(Count){
      const {min,max,containsMin,containsMax} = Count;

    }
  }
  
}