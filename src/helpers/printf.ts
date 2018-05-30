const rule = /^%((?:#|-|+|0| )*?)(\d*)?(\.\d*)?([dfeEoxXi])(%%)?$/;
const parse = (format:string) => {
  if(!rule.test(format)){
    throw new Error('wrong format param');
  }else{
    const conf = {
      align: 'right',
      sign: '',
      fill: ' ',
      prefix: '',
      digits: 6,
      minWidth: 1
    };
    if(RegExp.$1 !== undefined){
      const segs = RegExp.$1.split('');
      let seg;
      let exists = '';
      while((seg = segs.shift()) !== undefined){
        if(exists.indexOf(seg) > -1){
          throw new Error(`repeated flag of (${seg})`);
        }else{
          exists += seg;
          let hasPlus = false;
          switch(seg){
            case '+':
              hasPlus = true;
              conf.sign = '+';
              break;
            case ' ':
              if(!hasPlus){
                conf.sign = ' ';
              }
              break;
            case '0':
              conf.fill = '0';
              break;
            case '-':
              conf.align = 'left';
              break;
            case '#':
              conf.fill = '';
              break;
          }
        }
      }
    }
  }
};
const printf = (format:string,target:number) => {

};
export default printf;