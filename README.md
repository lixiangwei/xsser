# xsser
xss扫描检测（xss scan）  

使用（usage）： xss(yourCallback);  

原理：在事件捕获的过程中，通过正则表达式过滤可疑代码，在代码加载进页面或者调用DOM API之前拦截

不依赖其他库（no dependence）  
    
HTML5有推出对应的CSP: http://ww.w3.org/RT/CSP11  

启发自：http://fex.baidu.com/blog/2014/06/xss-frontend-firewall-1/
