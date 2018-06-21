
/*1.形如2016/06/01,2016-06-01,2016.06.01
2.特殊日期
3.形如20160601 201661
4.形如06/01/2016 06/01 06/01/16 月/日/年
5.形如[June 1st] June 1st,2016,June.1,Jun 1st等
6.形如+1 day,-1 week,1 week ago
*/

interface SpecialDateInfo{
  today:number;
  tomorrow:number;
  yesterday:number;
}
const fixDate = (date?:Date|string|number):Date => {
  if(typeof date === 'undefined')return new Date;
  if(date instanceof Date)return date;
  return new Date(date);
};

const makeDate = (year:string|null, month:string|null, day:string|null) => {
  const localDate = new Date();
  const fullYear = localDate.getFullYear().toString();
  year = year || fullYear;
  month = month || (localDate.getMonth() + 1).toString();
  day = day || localDate.getDate().toString();
  year = (year.length < 4 ? fullYear.slice(0,fullYear.length - year.length) : '') + year;  
  const strDate = [year,month,day].join('/') + ' 00:00:00';
  return new Date(strDate);
};
const strToDate = (dateStr:string, baseDate?:Date|string|number) => {
    const mS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const mL = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const r1 = /^(\d{4})([-\/.])(\d{1,2})\2(\d{1,2})$/;
    const r2 = /^(today|yesterday|tomorrow)$/;
    const r3 = /^(\d{4})(\d{1,2})(\d{1,2})$/;
    const r4 = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4})?)$/;
    const r5 = new RegExp('^(' + mS.concat(mL).join('|') + ')(?:\\s+|\\.)(?:(([13]?1)(?:st)?|([12]?2)(?:nd)?|([12]?3)(?:rd)?|([12]0|[12]?[4-9])(?:th)?|(30)th))(?:\\s*,\\s*(\\d{2}|\\d{4}))?$');
    const r6 = /^(([+-]?\d+)\s+(day|month|week|year)s?(\s+(?!$)|))+?(\s+ago)?$/;
    const r6e = /([+-]?\d+)\s+(day|month|week|year)s?/g;
    let match;
    const localDate = new Date();
    dateStr = dateStr.toLowerCase();
    if(dateStr === ''){
      localDate.setHours(0,0,0,0);
      return localDate;
    }else if(match = dateStr.match(r1)){
      return makeDate(match[1],match[3],match[4]);	
    }else if(match = dateStr.match(r2)){
      const addNum:SpecialDateInfo = {
        today: 0,
        yesterday: -1,
        tomorrow: 1
      };
      const key:keyof SpecialDateInfo = <keyof SpecialDateInfo>match[1];
      
      if(baseDate){
        baseDate = fixDate(baseDate);
        if(addNum[key]){
          baseDate.setDate(baseDate.getDate() + addNum[key]);
        }
        baseDate.setHours(0,0,0,0);
        return baseDate;
      }else{
        if(addNum[key]){
          return makeDate(null,null,localDate.getDate() + addNum[key]);
        }
        return makeDate(null,null,null);
      }
    }else if(match = dateStr.match(r3)){
      return makeDate.apply(null,match.slice(1,4));
    }else if(match = dateStr.match(r4)){
      return makeDate(match[4],match[1],match[2]);
    }else if(match = dateStr.match(r5)){
      var month = match[1];
      var day = match[3];
      var year = match[8];
      var atMS = mS.indexOf(month);
      var atML = mL.indexOf(month);
      if(atMS > -1){
        month = (atMS + 1).toString();
      }else{
        month = (atML + 1).toString();
      }
      return makeDate(year,month,day);
    }else if(match = dateStr.match(r6)){
      var needReverse = match[5] ? '-' : '';
      var group;
      var info = {
        year: [],
        month: [],
        day: [],
        week: []
      };
      var i;
      while((group = r6e.exec(dateStr)) != undefined){
        info[group[2]].push('(' + group[1] + ')');
      }
      for(i in info){
        if(info.hasOwnProperty(i)){
          var arr = info[i];
          if(arr.length){
            info[i] = new Function('','return ' + needReverse + '(' + arr.join('+') + ')')();
          }else{
            info[i] = 0;
          }
        }
      }
      info.date = info.week * 7 + info.day;
      info.fullYear = info.year;
      var setQueue = ['date','month','fullYear'];
      var total = setQueue.length;
      baseDate = baseDate ? fixDate(baseDate) : new Date();
      for(i = 0; i < total; i++){
        var key = setQueue[i];
        var num = info[key];
        var method = Util.capitialize(key);
        if(num){
          var fn = baseDate['set' + method];
          var orig = baseDate['get' + method]();
          try{
            fn.call(baseDate,orig + num);
          }catch(e){
            throw e;
          }
        }
      }
      return baseDate;
    }else{
      throw new Error('can not parse the date!');
    }
  }