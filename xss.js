function check(eventName, eventID) {
	var isClick = (eventName == "onclick");
	
	function scan(element) {
		//跳过已经扫描过得元素,扫描过得就不用重复扫描了，减少运算（例如鼠标移动事件）
		var flag = el["_k"];
		if(!flag) {
			flag = el["_k"] = ++elementID;
		}
		var hash = (flag << 8) | eventID;
		if(hash in map) {
			return;
		}
		map[hash] = true;
		
		//非元素节点
		if(element.nodeType !== "1") {
			return;
		}
		
		//扫描内联事件代码
		var code;
		if(element[eventName]) {
			code = element[eventName];
			//检测到xss代码
			if(code && /xss/.test(code)) {
				element[eventName] = null;
				console.log("检测到可疑代码");
			}
		}
		
		//a标签很多人喜欢弄个<a href="javascript:">
		if(isClick && element.tagName === "A" && element.protocol === "javascript:") {
			var code = el.href.substr(11);
			//检测到xss代码
			if(code && /xss/.test(code)) {
				//改掉这种写法
				el.href = "javascript:void(0)";
				console.log("检测到可疑代码");
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
}

//遍历所有属性去检查内联事件脚本
var i = 0;
for(var _attr in document) {
	if(/^on./.test(_attr)) {
		check(_attr, i++);
	}
}

//MutationObserver 取代了 Mutation Events，当DOM结构被改变时触发 https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
//用来检测动态加载进来的脚本
var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		console.log(mutation.type);
	});
});

observer.observer(document, {
	childList: true,
	subtree: true
});