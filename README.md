# xsser
xss扫描检测（xss scan）  

使用： xss(yourCallback);  

原理：在事件捕获的过程中，通过正则表达式过滤可疑代码，在代码加载进页面或者调用DOM API之前拦截
