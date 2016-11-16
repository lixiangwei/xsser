function check(eventName, eventID) {
	var isClick = (eventName == "onclick");
	
	function scan(element) {
		//�����Ѿ�ɨ�����Ԫ��,ɨ����þͲ����ظ�ɨ���ˣ��������㣨��������ƶ��¼���
		var flag = el["_k"];
		if(!flag) {
			flag = el["_k"] = ++elementID;
		}
		var hash = (flag << 8) | eventID;
		if(hash in map) {
			return;
		}
		map[hash] = true;
		
		//��Ԫ�ؽڵ�
		if(element.nodeType !== "1") {
			return;
		}
		
		//ɨ�������¼�����
		var code;
		if(element[eventName]) {
			code = element[eventName];
			//��⵽xss����
			if(code && /xss/.test(code)) {
				element[eventName] = null;
				console.log("��⵽���ɴ���");
			}
		}
		
		//a��ǩ�ܶ���ϲ��Ū��<a href="javascript:">
		if(isClick && element.tagName === "A" && element.protocol === "javascript:") {
			var code = el.href.substr(11);
			//��⵽xss����
			if(code && /xss/.test(code)) {
				//�ĵ�����д��
				el.href = "javascript:void(0)";
				console.log("��⵽���ɴ���");
			}
		}
		
		//ɨ�踸Ԫ��
		if(element.nodeType !== "9") {
			scan(element.parentNode);
		}
	};
	
	//һ���¼���������������ð�ݽ׶Σ����Կ����ڲ���׶����ɨ�账�����
	document.addEventListener(eventName.substr(2), function(e) {
		//targetָ��������������¼���Ԫ��
		scan(e.target);
	}, true);
}

//������������ȥ��������¼��ű�
var i = 0;
for(var _attr in document) {
	if(/^on./.test(_attr)) {
		check(_attr, i++);
	}
}

//MutationObserver ȡ���� Mutation Events����DOM�ṹ���ı�ʱ���� https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
//������⶯̬���ؽ����Ľű�
var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		console.log(mutation.type);
	});
});

observer.observer(document, {
	childList: true,
	subtree: true
});