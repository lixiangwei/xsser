# xsser
xss扫描检测（xss scan）  

使用（usage）： xss(yourCallback);  

原理：在事件捕获的过程中，通过正则表达式过滤可疑代码，在代码加载进页面或者调用DOM API之前拦截

不依赖其他库（no dependence）

HTML5有推出XSS解决方案：CSP http://www.w3.org/TR/CSP11/  

启发自：http://fex.baidu.com/blog/2014/06/xss-frontend-firewall-1/

XSS比赛：https://github.com/cure53/XSSChallengeWiki/wiki
