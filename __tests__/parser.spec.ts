import {parser} from '../src/parser';
test('测试parser',function(){
  expect(parser.parse(':number(1,10):%02d')).toBe([['(','1',',','10',')'],['%','0','2','d']]);
});