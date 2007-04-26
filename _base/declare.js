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
	 
	// I. Munge parameters
	// parameter juggling to support omitting init param 
	// (also allows reordering init and props arguments)
	if((dojo.isFunction(props))||((!props)&&(!dojo.isFunction(init)))){ 
		var t=props; props=init; init=t;
	}
	// extract mixins from 'superclass' argument, if necessary
	var mixins = [ ];
	if(dojo.isArray(superclass)){
		mixins = superclass;
		superclass = mixins.shift();
	}
	// require props object
	props = props || {};
	//
	// II. Make constructor
	// construct an instance of our canonical constructor
	var ctor = dojo.declare._makeConstructor();
	//
	// III. Chain superclass
	// alias the superclass prototype (if any)
	var scp = (superclass ? superclass.prototype : null);
	if(scp){
		// chain prototypes.
		var thunk = function(){};
		thunk.prototype = scp;
		ctor.prototype = new thunk();
	}
	// keep a reference to the superclass prototype
	ctor.superclass = scp;
	//
	// IV. Copy mixins
	// keep a reference to the array of mixin classes
	ctor.mixins = mixins;
	// copy the mixin prototype to the new prototype
	for(var i=0,m;(m=mixins[i]);i++){
		dojo.extend(ctor, m.prototype);
	}
	//
	// V. Finalize constructor
	// alias the prototype
	var cp = ctor.prototype;
	// override any inherited initializer property
	cp.initializer = null;
	// keep a reference to our className
	cp.declaredClass = className;
	// mix props and _core into our prototype 
	dojo.mixin(cp, props, dojo.declare._core);
	// keep a reference to our constructor
	cp.constructor = ctor;
	// install the initializer
	cp.initializer = (cp.initializer)||(init)||(function(){});
	//
	// VI. Create named reference
	return dojo.setObject(className, ctor); // Function
}

dojo.declare._makeConstructor = function(){
	return function(){ 
		var c = arguments.callee, p = c.prototype, s = c.superclass;			
		// superclass instantiation
		if(s){s.constructor.apply(this, arguments);}
		// initialize any mixins
		if(c.mixins){
			for(var i=0, m, f; (m=c.mixins[i]); i++){
				// avoid the constructor on 'declared' mixins
				(f=("initializer" in m ? m.initializer : m))&&(f.apply(this, arguments));
			}
		}
		// initialize ourself
		if(p.initializer){
			p.initializer.apply(this, arguments);
		}
	}
}

dojo.declare._core = {
	_findInherited: function(name, callee){
		var p = this.constructor.prototype;
		if (this[name]!==callee){
			while(p && (p[name]!==callee)){ 
				p = p.constructor.superclass; 
			}
		}
		if ((!p)||(p[name]!==callee)){
			throw(this.toString() + ': name argument ("' + name + '") to inherited does not match callee (declare.js)');
		}
		while(p && (p[name]===callee)){ 
			p = p.constructor.superclass; 
		}
		return (p)&&(p[name]);	
	},
	inherited: function(name, args, callee){
	 	//	summary: 
		//		Invoke an ancestor method
		//	name: String
		//		name of the method to invoke
		//	args: Array||arguments
		//		array of arguments, or the 'arguments' value from
		//		the caller. Args must include a 'callee' property from
		//		a the callers 'arguments', or 'callee' must be passed
		//		as the third parameter.
		//	callee: Function?
		//		reference to the function from which to ascend the
		//		prototype chain.
		//	description:
		//		Invoke an ancestor (base class) or overriden method.
	 	//	usage:
		//		foo: function() {
		//			// invoke superclass 'foo'
		//			this.inherited("foo", arguments);
		//		}
		var c = (callee)||((args)&&(args.callee));
		if(c){
			var fn = (name)&&(this._findInherited(name, c));
			return (fn)&&(fn.apply(this, args));
		}
	}
};
