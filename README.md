# suchjs
An easy mock tool.

## [usage]
  ```javascript
  // make one
  const str = Such.as(":string[97,122]:{5,10}");
  
  // make many
  const instance = Such.as(":string[97,122]:{5,10}",{
    instance: true
  });
  const one = instance.a();
  const two = instance.a();
  
  // define new type
  Such.define('chinese','string','[\\u4e00,\\u9fa5]');
  Such.as(":chinese{2,3}"); // "啊好你" 
  
  ``` 

- number

  1. `Such.as(':number(1,10]:%02d')` => 02
  2. `Such.as(':number[1,10]:%.2f')` => 9.33

- string
  
  1. `Such.as(':string{10,20}')` => "asg,83a30l."

- date  

- email

- url

- ip

## [value rules]

- [MIN,MAX]   
  a range between min to max,such as numbers,datetime,unicode point.

- {MIN,MAX?}|{NUMBER}  
  a length between min to max,such as string,array size

- %FORMAT  
  format the data,such as numbers,datetime. 

- #[KEY=VALUE,KEY=VALUE;....]  
  define some variables,e.g :ip#[v4]

- $/abc/i  
  regexp rules,you can extend many types from the regexp rule.



## [key rules]

- limit array size  
  ```javascript
  Such.as({  
    "book{3,5}": [{  
      "author": ":string[97,122]:{4,6}"  
    }]  
  });
  ```   
  case:
  ```javascript
  {
    "book":[{
      "author": "yoaa"
    },{
      "author": "kolaa",
    },{
      "author": "romas"
    },{
      "author": "zaadd"
    }] 
  }
  ```
- field not required
  ```javascript
  Such.as({
    "author": ":string[97,122]:{4,6}",
    "pubdate?": ":date:%Y-m-d"
  });
  ``` 
  case:
  ```javascript
  {
    "author": "yami"
  }
  {
    "author": "juha",
    "pubdate": "2015-03-16"
  }
  ```
- if required,has a range length 
  ```javascript
  Such.as({    
      "author": ":word{1,2}:@ucfirst",
      "loves?{3,4}": [":string[97,122]:{5,10}"] 
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
