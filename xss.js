var xss = function (callback) {
	//正则匹配疑是XSS的内容
	var inlineHandleRE = scriptHtmlRE = setAttributeRE = /%|-|`|~|!|@|#|\$|\^|&|\*|\(|\)|=|\||\{|\}|'|:|;|,|\[|\]|\.|<|>|\?|\+|~|\{|\}|！|￥|……|（|）|—/gi,
		aTagRE = /your xssRE/,
		//如果添加到页面的是外链脚本判断来源是不是合法的；
		scriptSrcRE = /http/gi,
		//返回的数据
		data = {
			action: "",
			value: "",
			location: location.href,
			ua: navigator.userAgent,
			//重置返回单个元素的方法,添加钩子程序
			elementFunName: ["createElement", "getElementById"],
			//重置返回多个元素的方法
			elementsFunName: ["getElementsByTagName", "getElementsByClassName"]
		};
		
	//如果用户没有设置回调的话，就用这个默认回调
	callback = callback || function() {
		console.warn("发现可疑行为：", data);
	};
	
	function hook(window) {
		//扫描内联on事件代码
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
				
				var code;
				if(element[eventName]) {
					//获取事件处理函数进行检测，有问题设为null
					code = element[eventName];
					if(code && inlineHandleRE.test(code)) {
						element[eventName] = null;
						callback(data);
					}
				}
				
				//a标签很多人喜欢弄个<a href="javascript:">
				if((eventName == "onclick") && element.tagName === "A" && element.protocol === "javascript:") {
					var code = el.href.substr(11);
					//检测到xss代码
					if(code && aTagRE.test(code)) {
						//改掉这种写法
						el.href = "javascript:void(0)";
						callback(data);
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
		
		//MutationObserver 取代了 Mutation Events，当DOM结构属性被改变时触发 https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
		//主要用来检测添加进来的script标签有没有问题，但问题是在脚本添加操作之后才触发，脚本都执行了
		var config = {
			childList: true,
			subtree: true,
			//也可以监视attribute有没有被改变，但是通过script.src 设置的检测不到，getAttribute添加的才行
			//attributes: true,
			//attributeFilter: ["src"]
		}
		var observer = new MutationObserver(function(mutations) {
			return false;
			mutations.forEach(function(mutation) {
				//检查插进来script，注意删除也会触发的，加个判断
				if(mutation.addedNodes[0]) {
					var node = mutation.addedNodes[0];
					//如果是外链脚本判断来源是不是合法的；如果是内联脚本就判断内容是否合法
					if(scriptSrcRE.test(node.getAttribute("src"))) {
						data.action = "新添加的外链脚本不合法";
						data.value = node.src;
						callback(data);
						//不合法就移除了
						node.parentNode.removeChild(node);
					}	
					if(scriptHtmlRE.test(node.innerHTML)) {
						data.action = "新添加的内联脚本不合法";
						data.value = node.innerHTML;
						callback(data);
						//不合法就移除了
						node.parentNode.removeChild(node);
					}	
				}
			});
		});
		observer.observe(document, config);
		//observe.disconnect();  取消观察

		//不让别人改写这些方法
		Object.defineProperty(Function.prototype, "apply", { value: Function.prototype.apply, writable: false, configurable: false, enumerable: true });
		Object.defineProperty(Function.prototype, "call", { value: Function.prototype.call, writable: false, configurable: false, enumerable: true });
		
		//设置元素属性时会触发
		/*var nativeFn3 = Element.prototype.__defineSetter__;
		Element.prototype.__defineSetter__ = function() {
			data.action = "__defineSetter__";
			data.value = arguments;
			callback(data);
			nativeFn3.apply(this, arguments);
		};*/
		
		//重置返回单个元素的方法
		for (var i = data.elementFunName.length - 1; i >= 0; i--) {
			hookNativeElement(data.elementFunName[i]);
		}
		function hookNativeElement(methodName) {
			var nativeCode = "_" + methodName;
			//保存原生函数
			nativeCode = Document.prototype[methodName];
			Document.prototype[methodName] = function() {
				var element = nativeCode.apply(this, arguments);
				if(element.tagName == "SCRIPT") {
					defineSetter(element, methodName);
				}
				return element;
			};
		};
		
		//重置返回多个元素的方法
		for (var i = data.elementsFunName.length - 1; i >= 0; i--) {
			hookNativeElements(data.elementsFunName[i]);
		}
		function hookNativeElements(methodName) {
			var nativeCode = "_" + methodName;
			nativeCode = Document.prototype[methodName];
			Document.prototype[methodName] = function() {
				var elementList = nativeCode.apply(this, arguments);
				var i,len = elementList.length;
				for (var i = elementList.length - 1; i >= 0; i--) {
					if(elementList[i].tagName == "SCRIPT") {
						defineSetter(elementList[i], methodName);
					}
				}
				return elementList;
			};
		};

		//设置src属性时触发
		function defineSetter(element, methodName) {
			element.__defineSetter__("src", function(value) {
				data.action = methodName;
				data.value = value;
				callback(data);
			});
		};

		var nativeFn2 = Element.prototype.setAttribute;
		Element.prototype.setAttribute = function(name, value) {
			if(this.tagName == "SCRIPT" && /^src$/i.test(name)) {
				if(setAttributeRE.test(value)) {
					data.action = "使用setAttribute设置script的src";
					data.value = value;
					callback(data);
					//if(confirm("检测到可疑代码，是否拦截")) {
						//return;
					//}
				}
			}
			nativeFn2.apply(this, arguments);
		};
		
		//检测能执行字符串的函数，主要这几个 eval setTimeout setInterval
		//eval改了会出问题，eval并不是真正意义的函数
		var funName = ["eval", "setTimeout", "setInterval"];
		for (var i = funName.length - 1; i >= 0; i--) {
			hookNative(funName[i]);
		}
		function hookNative(methodName) {
			var nativeCode = "_" + methodName;
			nativeCode = window[methodName];
			window[methodName] = function() {
				data.action = methodName;
				data.value = arguments;
				callback(data);
				return nativeCode.apply(this, arguments);
			};
		}

		//防止通过iframe来绕过监控
		window.document.addEventListener('DOMNodeInserted', function(e) {
			var element = e.target;
			// 给框架里环境也装个钩子
			if (element.tagName == 'IFRAME') {
				hook(element.contentWindow);
			}
		}, true);
	};
	//当前页面
	hook(window);
};
