function check(eventName, eventID) {
	var isClick = (eventName == "onclick");
	
	function scan(element) {
		//跳过已经扫描过得元素
		var flag = el["_k"];
		if(!flag) {
			flag = el["_k"] = ++eleID;
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
		
		//扫描父元素
		scan(element.parentNode);
	};
	
	//事件捕获过程添加处理程序
	document.addEventListener(eventName.substr(2), function(e) {
		scan(e.target);
	}, true);
}

//遍历所有事件去检测
var i = 0;
for(var _attr in document) {
	if(/^on./.test(_attr)) {
		check(_attr, i++);
	}
}