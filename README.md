# suchjs
An easy mock tool.

## [useage]

- number

  1. `Such.as(':number(1,10]:%02d')` => 02...10，随机一个大于1，小于等于10的整数
  2. `Such.as(':number[1,10]:%.2f')` =>  9.33 随机一个1到10之间的保留两位小数的浮点数

- string
  
  1. `Such.as(':string{10,20}:<test:,...>')` => 'test:acbdaaa...' 随机一个总长度在10到20之间，以test:开头，...结尾的字符串

- date  

- email

- url

- ip

## [value rules]

- (MIN,MAX)|[MIN,MAX)|[MIN,MAX]   
  用来表示大小，通常针对数字，对于字符串，也可以用来表示unicode码点范围

- {MIN?,MAX}|{NUMBER}  
  用来表示长度，可针对字符串或者数组，用来限定个数

- <PREFIX?,SUFFIX?>  
  主要针对字符串，设定字符串以xxx开始或者xxx结尾

- %FORMAT  
  主要针对数字、日期类型等，用来对数据进行格式化 

- #[KEY=VALUE;KEY=VALUE;....]  
  定义一些常量配置，用来对数据做进一步的处理

- @fn1()|fn2()...
  通过函数对数据进行进一步的处理

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
- if required,has a range length 
  ```javascript
  Such.as({    
      "author": ":word{1,2}:@ucfirst",
      "loves?{3,4}": [":string{5,10}"] 
  });
  ``` 
  case:
  ```javascript
  [{
    "author": "Yooa"
  }]
  [{
    "author": "Halo",
    "loves": ["abcde","defghaa","hijsgdsk"]
  }]
  ```
- one of,use the colon ":".
  ```javascript
  Such.as({    
      "module:":["amd", "cmd", "umd"]  
  });
  is equal to
  Such.as({
      "module:{1}": ["amd", "cmd", "umd"]
  })
  ``` 
  case:
  ```javascript
  [{
    "module": "amd"
  }]
  [{
    "module": "cmd"
  }]
  ```
- always array
  ```javascript
  Such.as({    
      "module[1]":["amd", "cmd", "umd"]  
  });
  ```
  case:
  ```javascript
  [{
    "module": ["amd"]
  }]
  ```
- one of and length
  ```javascript
  Such.as({    
      "module:[2,3]":["amd", "cmd", "umd"]  
  });
  ```
  case:
  ```javascript
  [{
    "module": ["amd", "amd"]
  }]
  [{
    "module": ["cmd", "cmd", "cmd"]
  }]
  ```
