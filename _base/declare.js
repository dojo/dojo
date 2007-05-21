dojo.provide("dojo._base.declare");
dojo.require("dojo._base.lang");

// this file courtesy of the TurboAjax group, licensed under a Dojo CLA

dojo.declare = function(/*String*/ className, 
						/*Function||Array*/ superclass, 
						/*Function*/ init, 
						/*Object*/ props){
	//	summary: 
	//		Create a feature-rich constructor from compact notation
	//	className: String
	//		the name of the constructor (loosely, a "class")
	//		stored in the "declaredClass" property in the created prototype
	// 	superclass: Function||Array
	//		may be a Function, or an Array of Functions. If "superclass" is an
	//		array, the first element is used as the prototypical ancestor and
	//		any following Functions become mixin ancestors.
	//	init: Function?
	//    an initializer function called when an object is instantiated
	//		from this constructor.
	//	props: Object?||Array?
	//		an object (or array of objects) whose properties are copied to the
	//		created prototype
	//	description:
	//		Create a constructor using a compact notation for inheritance and
	//		prototype extension. 
	//
	//		All superclasses (including mixins) must be Functions (not simple Objects).
	//
	//		Mixin ancestors provide a type of multiple inheritance.
	//	
	//		Prototypes of mixin ancestors are copied to the new class.
	//
	//		"className" is cached in "declaredClass" property of the new class.
	//
	// usage:
	//		dojo.declare("my.classes.bar", my.classes.foo,
	//			function(){
	//				// initialization function
	//				this.myComplicatedObject = new ReallyComplicatedObject(); 
	//			},{ 
	//				// properties to be added to the class prototype
	//				someValue: 2,
	//				someMethod: function(){ 
	//					doStuff(); 
	//				}
	//			}
	//		);
	
	// argument juggling
	if(dojo.isFunction(props)||(!props&&!dojo.isFunction(init))){ 
		var t=props; props=init; init=t;
	}	
	// our constructor boilerplate (this is cloned, so keep it short)
	var ctor = function(){this._construct(arguments);}
	// alias declare, ensure props, make mixin array, alias prototype
	var dd=dojo.declare, p=props || {}, mixins=[];
	// extract mixins
	if(dojo.isArray(superclass)){
		mixins = superclass;
		superclass = mixins.shift();
	}
	// chain prototypes
	var scp = superclass ? superclass.prototype : null;
	if(scp){ ctor.prototype = dojo._delegate(scp); }
	// cache ancestry, attach fancy extension mechanism
	dojo.mixin(ctor, {superclass: scp, mixins: mixins, extend: dd._extend});
	// extend with mixin classes
	for(var i=0,m;(m=mixins[i]);i++){dojo.extend(ctor, m.prototype);}
	// decorate the prototype
	dojo.extend(ctor, {declaredClass: className, _initializer:init||p.constructor, preamble: null}, p, dd._core); 
	// do this last (doesn't work via extend anyway)
	ctor.prototype.constructor = ctor;
	// create named reference
	return dojo.setObject(className, ctor); // Function
}

dojo.mixin(dojo.declare, {
	_extend: function(mixin, preamble) {
		dojo.extend(this, mixin);
		this.mixins.push(!preamble ? mixin : function() { mixin.apply(this, preamble.apply(this, arguments) || arguments); });
	},
	_core: {
		_construct: function(args) {
			var c=args.callee, s=c.superclass, ct=s&&s.constructor, a=args, ii;
			// call any preamble
			if(fn=c.prototype.preamble){a = fn.apply(this, a) || a;}
			// initialize superclass
			if(ct&&ct.apply){ct.apply(this, a)};
			// initialize mixins
			for(var i=0, m; (m=c.mixins[i]); i++){if(m.apply){m.apply(this, a);}}
			// call our own initializer
			var ii = c.prototype._initializer;
			if(ii){ii.apply(this, args);}
		},
		inherited: function(name, args, newArgs){
			var c=args.callee, p=this.constructor.prototype, a=newArgs||args, fn;
			// if not an instance override 
			if (this[name]!=c || p[name]==c) {
				// seek the prototype which contains callee
				while(p && (p[name]!==c)){ p=p.constructor.superclass; }
				// not found means user error
				if(!p){ throw(this.toString() + ': name argument ("' + name + '") to inherited must match callee (declare.js)');	}
				// find the eldest prototype which does not contain callee
				while(p && (p[name]==c)){ p=p.constructor.superclass; }
			}
			// if the function exists, invoke it in our scope
			return (fn=p&&p[name])&&(fn.apply(this, a));
		}
	}
});	
