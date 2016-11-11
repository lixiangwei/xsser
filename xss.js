function check(eventName, eventID) {
	var isClick = (eventName == "onclick");
	
	function scan(element) {
		//�����Ѿ�ɨ�����Ԫ��
		var flag = el["_k"];
		if(!flag) {
			flag = el["_k"] = ++eleID;
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
		
		//ɨ�踸Ԫ��
		scan(element.parentNode);
	};
	
	//�¼����������Ӵ������
	document.addEventListener(eventName.substr(2), function(e) {
		scan(e.target);
	}, true);
}

//���������¼�ȥ���
var i = 0;
for(var _attr in document) {
	if(/^on./.test(_attr)) {
		check(_attr, i++);
	}
}