define([
	"doh",
	"dojo/_base/declare",  "dojo/Evented", "dojo/has", "dojo/on", "dojo/query", "dojo/topic"
], function(doh, declare, Evented, has, on, query, topic){

	doh.register("tests.on", [
		function object(t){
			var order = [];
			var obj = new Evented();
			obj.oncustom = function(event){
				order.push(event.a);
				return event.a+1;
			};
			var signal = on.pausable(obj, "custom", function(event){
				order.push(0);
				return event.a+1;
			});
			obj.oncustom({a:0});
			var signal2 = on(obj, "custom, foo", function(event){
				order.push(event.a);
			});
			on.emit(obj, "custom", {
				a: 3
			});
			signal.pause();
			var signal3 = on(obj, "custom", function(a){
				order.push(3);
			}, true);
			on.emit(obj, "custom", {
				a: 3
			});
			signal2.remove();
			signal.resume();
			on.emit(obj, "custom", {
				a: 6
			});
			signal3.remove();
			var signal4 = on(obj, "foo, custom", function(a){
				order.push(4);
			}, true);
			signal.remove();
			on.emit(obj, "custom", {
				a: 7
			});
			t.is(order, [0,0,3,0,3,3,3,3,6,0,3,7,4]);
		},
		function once(t){
			var order = [];
			var obj = new Evented();
			obj.on("custom", function(event){
				order.push(event.a);
			});
			var signal = on.once(obj, "custom", function(event){
				order.push(1);
			});
			obj.emit("custom",{a:0});
			obj.oncustom({a:2}); // should call original method, but not listener
			t.is(order, [0,1,2]);
		},
		function dom(t){
			var div = document.body.appendChild(document.createElement("div"));
			var span = div.appendChild(document.createElement("span"));

			var order = [];
			var signal = on(div,"custom", function(event){
				order.push(event.a);
				event.addedProp += "ue";
			});
			on(span,"custom", function(event){
				event.addedProp = "val";
			});
			on.emit(div, "custom", {
				target: div,
				currentTarget:div,
				relatedTarget: div,
				a: 0
			});
			on.emit(div, "otherevent", {
				a: 0
			});
			t.is(on.emit(span, "custom", {
				a: 1,
				bubbles: true,
				cancelable: true
			}).addedProp, "value");
			t.t(on.emit(span, "custom", {
				a: 1,
				bubbles: false,
				cancelable: true
			}));
			var signal2 = on.pausable(div,"custom", function(event){
				order.push(event.a + 1);
				event.preventDefault();
			});
			t.f(on.emit(span, "custom", {
				a: 2,
				bubbles: true,
				cancelable: true
			}));
			signal2.pause();
			t.is(on.emit(span, "custom", {
				a: 4,
				bubbles: true,
				cancelable: true
			}).type, "custom");
			signal2.resume();
			signal.remove();
			t.f(on.emit(span, "custom", {
				a: 4,
				bubbles: true,
				cancelable: true
			}));
			on(span, "custom", function(event){
				order.push(6);
				event.stopPropagation();
			});
			t.t(on.emit(span, "custom", {
				a: 1,
				bubbles: true,
				cancelable: true
			}));

			// make sure we are propagating natively created events too, and that defaultPrevented works
			var button = span.appendChild(document.createElement("button")),
				defaultPrevented = false,
				signal2Fired = false;
			signal = on(span, "click", function(event){
				event.preventDefault();
			});
			signal2 = on(div, "click", function(event){
				order.push(7);
				signal2Fired = true;
				defaultPrevented = event.defaultPrevented;
			});
			button.click();
			t.t(signal2Fired, "bubbled click event on div");
			t.t(defaultPrevented, "defaultPrevented for click event");
			signal.remove();
			signal2.remove();

			// make sure that evt.defaultPrevented gets set for synthetic events too
			signal = on(span, "click", function(event){
				event.preventDefault();
			});
			signal2 = on(div, "click", function(event){
				signal2Fired = true;
				defaultPrevented = event.defaultPrevented;
			});
			signal2Fired = false;
			on.emit(button, "click", {bubbles: true, cancelable: true});
			t.t(signal2Fired, "bubbled synthetic event on div");
			t.t(defaultPrevented, "defaultPrevented set for synthetic event on div");
			signal.remove();
			signal2.remove();

			// test out event delegation
			if(query){
				// if dojo.query is loaded, test event delegation

				// check text node target is properly handled by event delegation
				var textnodespan = div.appendChild(document.createElement("span"));
				textnodespan.className = "textnode";
				textnodespan.innerHTML = "text";
				on(document.body, ".textnode:click", function(){
					order.push(8);
				});
				on.emit(textnodespan.firstChild, "click", {bubbles: true, cancelable: true});

				on(div, "button:click", function(){
					order.push(9);
				});
				on(document, "button:click", function(){
				}); // just make sure this doesn't throw an error
			}else{//just pass then
				order.push(8, 9);
			}
			// test out event delegation using a custom selector
			on(div, on.selector(function(node){
				return node.tagName == "BUTTON";
			}, "click"), function(){
				order.push(10);
			});
			button.click();
			t.is([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], order);
			on(span, "propertychange", function(){}); // make sure it doesn't throw an error
		},
		/*
		 This only works if the test page has the focus, so you can enable if you want to test focus functionality and allow the test page to have focus
 		function focus(t){
			var div = document.body.appendChild(document.createElement("div"));
			var input = div.appendChild(document.createElement("input"));
			var order = [];
			var signal = on(div,"input:focusin", function(event){
				order.push('in');
			});
			var signal = on(div,"input:focusout", function(event){
				order.push('out');
			});
			var otherInput = document.body.appendChild(document.createElement("input"));
			input.focus();
			otherInput.focus();
			d = new doh.Deferred();
			setTimeout(function(){
				t.is(['in', 'out'], order);
				d.callback(true);
			}, 1);
			return d;
		},*/
		function extensionEvent(t){
			var div = document.body.appendChild(document.createElement("div"));
			var span = div.appendChild(document.createElement("span"));
			span.setAttribute("foo", 2);
			var order = [];
			var customEvent = function(target, listener){
				return on(target, "custom", listener);
			};
			on(div, customEvent, function(event){
				order.push(event.a);
			});
			on(div, on.selector("span", customEvent), function(event){
				order.push(+this.getAttribute("foo"));
			});
			on.emit(div, "custom", {
				a: 0
			});
			// should trigger selector
			t.t(on.emit(span, "custom", {
				a: 1,
				bubbles: true,
				cancelable: true
			}));
			// shouldn't trigger selector
			t.t(on.emit(div, "custom", {
				a: 3,
				bubbles: true,
				cancelable: true
			}));
			t.is(order, [0, 1, 2, 3]);
		},
		function testEvented(t){
			var MyClass = declare([Evented],{

			});
			var order = [];
			myObject = new MyClass;
			myObject.on("custom", function(event){
				order.push(event.a);
			});
			myObject.emit("custom", {a:0});
			t.is(order, [0]);
		},
		function pubsub(t){
			var fooCount = 0;
			topic.subscribe("/test/foo", function(event, secondArg){
				t.is("value", event.foo);
				t.is("second", secondArg);
				fooCount++;
			});
			topic.publish("/test/foo", {foo: "value"}, "second");
			t.is(1, fooCount);
		},
		function touch(t){
			console.log("has", has);
			if(has("touch")){
				var div = document.body.appendChild(document.createElement("div"));
				on(div, "touchstart", function(event){
					t.t("rotation" in event);
					t.t("pageX" in event);
				});
				on.emit(div, "touchstart", {changedTouches: [{pageX:100}]});
			}
		},
		function stopImmediatePropagation(t){
			var button = document.body.appendChild(document.createElement("button"));
			on(button, "click", function(event){
				event.stopImmediatePropagation();
			});
			var afterStop = false;
			on(button, "click", function(event){
				afterStop = true;
			});
			button.click();
			t.f(afterStop);
		},
		function eventAugmentation(t){
			var div = document.body.appendChild(document.createElement("div"));
			var button = div.appendChild(document.createElement("button"));
			on(button, "click", function(event){
				event.modified = true;
				event.test = 3;
			});
			var testValue;
			on(div, "click", function(event){
				testValue = event.test;
			});
			button.click();
			t.is(testValue, 3);
		}
	]);
});
