dojo.provide("dojo._base.declare");
dojo.require("dojo._base.lang");

// this file courtesy of the TurboAjax group, licensed under a Dojo CLA

dojo.declare = function(/*String*/ className, /*Function||Array*/ superclass, /*Object*/ props){
	//	summary: 
	//		Create a feature-rich constructor from compact notation
	//	className: String
	//		The name of the constructor (loosely, a "class")
	//		stored in the "declaredClass" property in the created prototype
	//	superclass: Function||Array
	//		May be null, a Function, or an Array of Functions. If an array, 
	//		the first element is used as the prototypical ancestor and
	//		any following Functions become mixin ancestors.
	//	props: Object
	//		An object whose properties are copied to the
	//		created prototype.
	//		Add an instance-initialization function by making it a property 
	//		named "constructor".
	//	description:
	//		Create a constructor using a compact notation for inheritance and
	//		prototype extension. 
	//
	//		All superclasses (including mixins) must be Functions (not simple Objects).
	//
	//		Mixin ancestors provide a type of multiple inheritance. Prototypes of mixin 
	//		ancestors are copied to the new class: changes to mixin prototypes will
	//		not affect classes to which they have been mixed in.
	//
	//		"className" is cached in "declaredClass" property of the new class.
	//
	// usage:
	//		dojo.declare("my.classes.bar", my.classes.foo, {
	//			// properties to be added to the class prototype
	//			someValue: 2,
	//			// initialization function
	//			constructor: function(){
	//				this.myComplicatedObject = new ReallyComplicatedObject(); 
	//			},
	//			// other functions
	//			someMethod: function(){ 
	//				doStuff(); 
	//			}
	//		);

	// argument juggling (deprecated)
	if(dojo.isFunction(props)||(arguments.length>3)){ 
		dojo.deprecated("dojo.declare: for class '" + className + "' pass initializer function as 'constructor' property instead of as a separate argument.", "", "1.0");
		var c = props;
		props = arguments[3] || {};
		props.constructor = c;
	}
	// process superclass argument
	// var dd=dojo.declare, mixins=null;
	var dd=arguments.callee, mixins=null;
	if(dojo.isArray(superclass)){
		mixins = superclass;
		superclass = mixins.shift();
	}
	// construct intermediate classes for mixins
	if (mixins) {
		for (var i=0, m; i<mixins.length; i++){
			m = mixins[i];
			if(!m){throw("Mixin #" + i + " to declaration of " + className + " is null. It's likely a required module is not loaded.")};
			superclass = dd._delegate(superclass, m);
		}
	}	
	// prepare values
	var init=(props||0).constructor, ctor=dd._delegate(superclass), fn;
	// name methods (experimental)
	for(var i in props){if(dojo.isFunction(fn=props[i])&&(!0[i])){fn.nom=i;}}
	// decorate prototype
	dojo.extend(ctor, {declaredClass: className, _constructor: init, preamble: null}, props||0); 
	// special help for IE
	ctor.prototype.constructor = ctor;
	// create named reference
	return dojo.setObject(className, ctor); // Function
}

dojo.mixin(dojo.declare, {
	_delegate: function(base, mixin) {
		var bp = (base||0).prototype, mp = (mixin||0).prototype;
		// fresh constructor, fresh prototype
		var ctor = dojo.declare._makeCtor();
		// cache ancestry
		dojo.mixin(ctor, {superclass: bp, mixin: mp});
		// chain prototypes
		if(base){ctor.prototype = dojo._delegate(bp);};
		// add mixin and core
		dojo.extend(ctor, dojo.declare._core, mp||0, {_constructor: null});
		// special help for IE
		ctor.prototype.constructor = ctor;
		// name this class for debugging
		ctor.prototype.declaredClass = (bp||0).declaredClass + '_' + (mp||0).declaredClass;
		dojo.setObject(ctor.prototype.declaredClass, ctor); // Function
		return ctor;
	},
	_makeCtor: function() {
		// we have to make a function, but don't want to close over anything
		return function(){this._construct(arguments);}
	},
	_core: { 
		_construct: function(args){
			var c=args.callee, s=c.superclass, ct=s&&s.constructor, m=c.mixin, mct=m&&m.constructor, a=args, ii, fn;
			// side-effect of = used on purpose here, lint may complain, don't try this at home
			if(a[0]){ 
				// FIXME: preambles for each mixin should be allowed
				// FIXME: 
				//		should we allow the preamble here NOT to modify the
				//		default args, but instead to act on each mixin
				//		independently of the class instance being constructed
				//		(for impdedence matching)?

				// allow any first argument w/ a "preamble" property to act as a
				// class preamble (not exclusive of the prototype preamble)
				if(/*dojo.isFunction*/(fn = a[0]["preamble"])){ 
					a = fn.apply(this, a) || a; 
				}
			} 
			// prototype preamble
			if(fn=c.prototype.preamble){a = fn.apply(this, a) || a;}
			// FIXME: 
			//		need to provide an optional prototype-settable
			//		"_explicitSuper" property which disables this
			// initialize superclass
			if(ct&&ct.apply){ct.apply(this, a)};
			// initialize mixin
			if(mct&&mct.apply){mct.apply(this, a)};
			// initialize self
			if(ii=c.prototype._constructor){ii.apply(this, args);}
		},
		_findMixin: function(mixin){
			var c = this.constructor, p, m;
			while(c) {
				p = c.superclass;
				m = c.mixin;
				if(m==mixin || (m instanceof mixin.constructor)){return p;}
				if(m && (m=m._findMixin(mixin))){return m;}
				c = p && p.constructor;
			}
		},
		_findMethod: function(name, method, ptype, has){
			// consciously trading readability for bytes and speed in this low-level method
			var p=ptype, c, m, f;
			do{
				c = p.constructor;
				m = c.mixin;
				// find method by name in our mixin ancestor
				if(m && (m=this._findMethod(name, method, m, has))){return m};
				// if we found a named method that either exactly-is or exactly-is-not 'method'
				if((f=p[name])&&(has==(f==method))){return p};
				// ascend chain
				p = c.superclass;
			}while(p);
			// if we couldn't find an ancestor in our primary chain, try a mixin chain
			return !has && (p=this._findMixin(ptype)) && this._findMethod(name, method, p, has);
		},
		inherited: function(name, args, newArgs){
			// optionalize name argument (experimental)
			var a = arguments;
			if(!dojo.isString(a[0])){newArgs=args; args=name; name=args.callee.nom;}
			var c=args.callee, p=this.constructor.prototype, a=newArgs||args, fn, mp;
			// if not an instance override 
			if(this[name]!=c || p[name]==c){
				mp = this._findMethod(name, c, p, true);
				if(!mp){throw(this.declaredClass + ': name argument ("' + name + '") to inherited must match callee (declare.js)');}
				p = this._findMethod(name, c, mp, false);
			}
			fn = p && p[name];
			// FIXME: perhaps we should throw here? 
			if(!fn){console.debug(mp.declaredClass + ': no inherited "' + name + '" was found (declare.js)'); return;}
			// if the function exists, invoke it in our scope
			return fn.apply(this, a);
		}
	}
});
