export const rule = /^%([#\-+0 ]*)?([1-9]\d*)?(?:\.(\d*))?([dfeEoxXi])$/;
const parse = (format:string) => {
  let match:(string[]|null);
  if((match = format.match(rule)) !== null && match[0] !== ''){
    const conf = {
      align: 'right',
      type: '',
      fill: ' ',
      prefix: '',
      digits: 6,
      minWidth: 1,
      hash: false
    };
    const [_,flags,width,precision,type] = match;
    const isFloatType = ['f','e','E'].indexOf(type) > -1;
    // eg:%.2d %.2o
    if(precision !== undefined && !isFloatType){
      throw new Error(`Type of "${type}" should not has a percision width`);
    }
    conf.type = type;
    conf.digits = precision !== undefined ? +precision : conf.digits;
    conf.minWidth = width !== undefined ? +width : conf.minWidth;
    // parse flags
    if(flags !== undefined){
      const segs = flags.split('');
      let seg;
      let exists = '';
      while((seg = segs.shift()) !== undefined){
        if(exists.indexOf(seg) > -1){
          throw new Error(`repeated flag of (${seg})`);
        }else{
          exists += seg;
          switch(seg){
            case '+':
              conf.prefix = '+';
              break;
            case ' ':
              if(conf.prefix !== '+'){
                conf.prefix = ' ';
              }
              break;
            case '0':
              if(conf.align !== 'left'){
                conf.fill = '0';
              }
              break;
            case '-':
              conf.align = 'left';
              conf.fill = ' ';
              break;
            case '#':
              conf.hash = true;
              break;
          }
        }
      }
    }
    return conf;
  }else{
    throw new Error('Wrong format param');
  }
};
const printf = (format:string,target:number) => {
  const conf = parse(format);
  let result:number|string; 
  switch(conf.type){
    case 'd':
    case 'i':
      console.log('conf is ',conf,';result is ',target);
      result = target > 0 ? Math.floor(target) : Math.ceil(target);
      if(result < 0){
        conf.prefix = '-';
        result = ('' + result).slice(1);
      }else{
        result = '' + result;
      }
      const width = conf.minWidth;
      const fn = conf.align === 'right' ? 'padStart' : 'padEnd';
      if(conf.fill === '0'){
        return conf.prefix + (<string>result)[fn](width - conf.prefix.length,conf.fill);
      }else{
        return (conf.prefix + result)[fn](width,conf.fill);
      }
  }
};
export default printf;