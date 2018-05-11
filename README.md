# suchjs
An easy mock tool.

## [useage]

- number

  1. `Such.as(1)` => 1...100 随机一个整数
  2. `Such.as(':number(1,10]:%d')` => 2...10，随机一个大于1，小于等于10的整数
  3. `Such.as(':number[1,10]:%.2f')` => 9.33 随机一个1到10之间的保留两位小数的浮点数

- string
  
  1. `Such.as('abc')` => 'daksldjglsd' 随机一串字符串
  2. `Such.as(':string{10,20}:<test:,...>')` => 'test:acbdaaa...' 随机一个总长度在10到20之间，以test:开头，...结尾的字符串

- date  

- email

- url

- ip

## [value rules]

- (MIN,MAX)|[MIN,MAX)|[MIN,MAX]   
  用来表示大小，通常针对数字，对于字符串，也可以用来表示unicode编码范围

- {MIN?,MAX}|{NUMBER}  
  用来表示长度，可针对字符串或者数组，用来限定个数

- <PREFIX?,SUFFIX?>  
  主要针对字符串，在字符串的首尾添加固定的一些字符

- %FORMAT  
  主要针对数字、日期类型等，用来对数据进行格式化 

- #[KEY=VALUE;KEY=VALUE;....]  
  定义一些常量配置，用来对数据做进一步的处理

## [key rules]

- limit array size  
  ```javascript
  Such.as({  
    "book{3,5}": [{  
      "author": "Zrag"  
    }]  
  });
  ```   
  case:
  ```javascript
  {
    "book":[{
      "author": "Yooa"
    },{
      "author": "Kola",
    },{
      "author": "Roma"
    },{
      "author": "Halo"
    }] 
  }
  ```
- top level array
  ```javascript
  Such.as({  
    "_{3,5}": [{  
      "author": "Zrag"  
    }]  
  });
  ``` 
  case:
  ```javascript
  [{
    "author": "Yooa"
  },{
    "author": "Kola",
  },{
    "author": "Roma"
  },{
    "author": "Halo"
  }]
  ```
- field not required
  ```javascript
  Such.as({
    "author": "Halo",
    "pubdate?": "2014-02-02"
  });
  ``` 
  case:
  ```javascript
  {
    "author": "Yami"
  }
  {
    "author": "Kuha",
    "pubdate": "2015-03-16"
  }
  ```
## [oneOf]

`Such.as(['a','b','c'])` => 'a' || 'b' || 'c'