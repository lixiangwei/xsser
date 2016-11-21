/**
 *
 * ��������������������
 * ���������ߩ��������ߩ�
 * ����������������������
 * ����������������������
 * ���������ש������ס���
 * ����������������������
 * �������������ߡ�������
 * ����������������������
 * ����������������������Code is far away from bug with the animal protecting
 * ������������������    ���ޱ���,������bug
 * ������������������
 * ��������������������������
 * �������������������� �ǩ�
 * ������������������ ����
 * �������������������ש�����
 * �������������ϩϡ����ϩ�
 * �������������ߩ������ߩ�
 *
 */
(function() {
	function iframeHook(window) {
		//ɨ�������¼�����
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
				
				//���xss����
				var code;
				if(element[eventName]) {
					code = element[eventName];
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
		//Ȼ�������������ȥ��������¼��ű�
		var i = 0;
		for(var _attr in document) {
			if(/^on./.test(_attr)) {
				check(_attr, i++);
			}
		}
		
		//MutationObserver ȡ���� Mutation Events����DOM�ṹ���ı�ʱ���� https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
		//������⾲̬script��ǩ��û������
		var observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				console.log(mutation);
				//�������script
				var node = mutation.addedNodes[0];
				if(/xss/.test(node.src) || /xss/.test(node.innerHTML)) {
					node.parentNode.removeChild(node);
					console.log('��⵽���ɴ���:', node);
				}
			});
		});
		observer.observe(document, {
			childList: true,
			subtree: true
		});

		//���ñ��˸�д��Щ����
		Object.defineProperty(Function.prototype, "apply", { value: Function.prototype.apply, writable: false, configurable: false, enumerable: true });
		Object.defineProperty(Function.prototype, "call", { value: Function.prototype.call, writable: false, configurable: false, enumerable: true });
		
		//�����Щ��̬���ɵĽű�
		var nativeFn = Document.prototype.createElement;
		Document.prototype.createElement = function() {
			//˼·�ȱ���ԭ���ĺ�����Ȼ������ӽ��м��
			var element = nativeFn.apply(this, arguments);
			if(element.tagName == "SCRIPT") {
				element.__defineSetter__("src", function(url) {
					console.log("��������URL", url);
				});
			}
			return element;
		}

		nativeFn = Element.prototype.setAttribute;
		Element.prototype.setAttribute = function(name, value) {
			if(this.tagName == "SCRIPT" && /^src$/i.test(name)) {
				if(/xss/.test(value)) {
					if(confirm("��⵽���ɴ��룬�Ƿ�����")) {
						return false;
					}
				}
			}
			nativeFn.apply(this, arguments);
		}

		//��ֹͨ��iframe���ƹ����
		window.document.addEventListener('DOMNodeInserted', function(e) {
			var element = e.target;

			// ������ﻷ��Ҳװ������
			if (element.tagName == 'IFRAME') {
				iframeHook(element.contentWindow);
			}
		}, true);
	};
	iframeHook(window);
})();
