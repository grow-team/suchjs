const rule = /^%([#-+0 ]*?)([1-9]\d*)?(?:\.(\d*))?([dfeEoxXi])?$/;
const parse = (format:string) => {
  if(!rule.test(format)){
    throw new Error('wrong format param');
  }else{
    const conf = {
      align: 'right',
      type: '',
      fill: ' ',
      prefix: '',
      digits: 6,
      minWidth: 1,
      hash: false
    };
    const {$1:flags,$2:width,$3:precision,$4:type} = RegExp;
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
  }
};
const printf = (format:string,target:number) => {
  const conf = parse(format);
  let result:string = '';
  switch(conf.type){
    case 'd':
    case 'i':
      result = '' + Math.round(target);
      if(conf.minWidth > (result.length + conf.prefix.length)){
        
      }
  }
};
export default printf;