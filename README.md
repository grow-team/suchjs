# suchjs
An easy mock tool.

## useage

- number

  1. `Such.as(1)` => 1...100 随机一个整数
  2. `Such.as(':number(1,10]:%d')` => 2...10，随机一个大于1，小于等于10的整数
  3. `Such.as(':number[1,10]:%.2f')` => 9.33 随机一个1到10之间的保留两位小数的浮点数

- string
  
  1. `Such.as('abc')` => 'daksldjglsd' 随机一串字符串
  2. `Such.as(':string{10,20}':<test:,...>)` => 'test:acbdaaa...' 随机一个总长度在10到20之间，以test:开头，...结尾的字符串
