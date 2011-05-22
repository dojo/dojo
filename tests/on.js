dojo.provide("tests.on");

var on = dojo.require("dojo.on");
var has = dojo.require("dojo.has");
doh.register("tests.on",
	[
		function object(t){
			var order = [];
			var obj = {
				oncustom: function(event){
					order.push(event.a);
					return event.a+1;
				}
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
			signal2.cancel();
			signal.resume();
			on.emit(obj, "custom", {
				a: 6
			});
			signal3.cancel();
			var signal4 = on(obj, "foo, custom", function(a){
				order.push(4);
			}, true);
			signal.cancel();
			on.emit(obj, "custom", {
				a: 7
			});
			t.is(order, [0,0,3,0,3,3,3,3,6,0,3,7,4]);
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
			signal.cancel();
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
			var button = div.appendChild(document.createElement("button"));
			// make sure we are propagating natively created events too
			signal = on(div, "click", function(){
				order.push(7);
			});
			button.click();
			signal.cancel();
			// test out event delegation
			if(dojo.query){
				// if dojo.query is loaded, test event delegation
				on(div, "button:click", function(){
					order.push(8);
				});
				button.click();
			}else{//just pass then
				order.push(8);
			}
			t.is(order, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
		},
		function extensionEvent(t){
			var div = document.body.appendChild(document.createElement("div"));
			var span = div.appendChild(document.createElement("span"));
			span.setAttribute("foo", 2);
			var order = [];
			var customEvent = function(target, listener){
				return on(target, "custom", listener);
			};
			var signal = on(div, customEvent, function(event){
				order.push(event.a);
			});
			var signal = on(div, on.selector("span", customEvent), function(event){
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
		function Evented(t){
			var MyClass = dojo.declare([on.Evented],{
				
			});
			var order = [];
			myObject = new MyClass;
			myObject.on("custom", function(event){
				order.push(event.a);
			});
			myObject.emit("custom", {a:0});
			t.is(order, [0]);
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
		}
	]
);
