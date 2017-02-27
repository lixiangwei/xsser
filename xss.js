/**
 *
 * 　　　┏┓　　　┏┓
 * 　　┏┛┻━━━┛┻┓
 * 　　┃　　　　　　　┃
 * 　　┃　　　━　　　┃
 * 　　┃　┳┛　┗┳　┃
 * 　　┃　　　　　　　┃
 * 　　┃　　　┻　　　┃
 * 　　┃　　　　　　　┃
 * 　　┗━┓　　　┏━┛Code is far away from bug with the animal protecting
 * 　　　　┃　　　┃    神兽保佑,代码无bug
 * 　　　　┃　　　┃
 * 　　　　┃　　　┗━━━┓
 * 　　　　┃　　　　　 ┣┓
 * 　　　　┃　　　　 ┏┛
 * 　　　　┗┓┓┏━┳┓┏┛
 * 　　　　　┃┫┫　┃┫┫
 * 　　　　　┗┻┛　┗┻┛
 *
 */
var xss = function (callback) {
	//正则匹配疑是XSS的内容
	var inlineHandleRE = scriptHtmlRE = setAttributeRE = /%|-|`|~|!|@|#|\$|\^|&|\*|\(|\)|=|\||\{|\}|'|:|;|,|\[|\]|\.|<|>|\?|\+|~|\{|\}|！|￥|……|（|）|—/gi,
		aTagRE = /your xssRE/,
		scriptSrcRE = /your xssRE/,
		map = {},
		callback;
		
	//如果用户没有设置回调的话，就用这个默认回调吧
	callback = callback || function() {
		console.log("发现可疑行为：");
	};
	
	function hook(window) {
		//扫描内联事件代码
		function check(eventName, eventID) {
			
			function scan(element) {
				//跳过已经扫描过得元素,扫描过得就不用重复扫描了，减少运算（例如鼠标移动事件）
				var hash = element["data-scaned"];
				if(hash) {
					return;
				}
				element["data-scaned"] = eventID;
				
				//非元素节点
				if(element.nodeType !== "1") {
					return;
				}
				
				//检测xss代码
				var code;
				if(element[eventName]) {
					//获取事件处理函数
					code = element[eventName];
					if(code && inlineHandleRE.test(code)) {
						element[eventName] = null;
						callback();
					}
				}
				
				//a标签很多人喜欢弄个<a href="javascript:">
				if((eventName == "onclick") && element.tagName === "A" && element.protocol === "javascript:") {
					var code = el.href.substr(11);
					//检测到xss代码
					if(code && aTagRE.test(code)) {
						//改掉这种写法
						el.href = "javascript:void(0)";
						callback();
					}
				}
				
				//扫描父元素
				if(element.nodeType !== "9") {
					scan(element.parentNode);
				}
			};
			
			//一般事件处理程序都是添加在冒泡阶段，所以可以在捕获阶段添加扫描处理程序
			document.addEventListener(eventName.substr(2), function(e) {
				//target指向的是真正触发事件的元素
				scan(e.target);
			}, true);
		};
		//然后遍历所有属性去检查on开头的内联事件脚本
		var i = 0;
		for(var _attr in document) {
			if(/^on./.test(_attr)) {
				check(_attr, i++);
			}
		}
		
		//MutationObserver 取代了 Mutation Events，当DOM结构被改变时触发 https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
		//用来检测静态script标签有没有问题
		var observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				//检查插进来script
				var node = mutation.addedNodes[0];
				if(scriptSrcRE.test(node.src) || scriptHtmlRE.test(node.innerHTML)) {
					node.parentNode.removeChild(node);
					callback();
				}
			});
		});
		observer.observe(document, {
			childList: true,
			subtree: true
		});

		//不让别人改写这些方法
		Object.defineProperty(Function.prototype, "apply", { value: Function.prototype.apply, writable: false, configurable: false, enumerable: true });
		Object.defineProperty(Function.prototype, "call", { value: Function.prototype.call, writable: false, configurable: false, enumerable: true });
		
		//检测那些动态生成的脚本
		var nativeFn = Document.prototype.createElement;
		Document.prototype.createElement = function() {
			//思路先保存原来的函数，然后再添加进行检查
			var element = nativeFn.apply(this, arguments);
			if(element.tagName == "SCRIPT") {
				element.__defineSetter__("src", function(url) {
					callback();
				});
			}
			return element;
		};

		var nativeFn2 = Element.prototype.setAttribute;
		Element.prototype.setAttribute = function(name, value) {
			if(this.tagName == "SCRIPT" && /^src$/i.test(name)) {
				if(setAttributeRE.test(value)) {
					callback();
					//if(confirm("检测到可疑代码，是否拦截")) {
						//return;
					//}
				}
			}
			nativeFn2.apply(this, arguments);
		};

		//防止通过iframe来绕过监控
		window.document.addEventListener('DOMNodeInserted', function(e) {
			var element = e.target;
			// 给框架里环境也装个钩子
			if (element.tagName == 'IFRAME') {
				hook(element.contentWindow);
			}
		}, true);
	};
	hook(window);
};
