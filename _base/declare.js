dojo.provide("dojo._base.declare");

dojo.require("dojo._base.lang");
dojo.require("dojo._base.array");

// a drop-in replacement for dojo.declare() with fixed bugs and enhancements

(function(){
	var d = dojo, op = Object.prototype, isF = d.isFunction, xtor = new Function, counter = 0;

	function err(msg){ throw new Error("declare: " + msg); }

	// C3 Method Resolution Order (see http://www.python.org/download/releases/2.3/mro/)
	function c3mro(bases){
		var result = [], dag = [{cls: 0, refs: []}], nameMap = {}, clsCount = 1, l = bases.length,
			i = 0, j, lin, base, top, proto, rec, name, refs;

		// build a list of bases naming them if needed
		for(; i < l; ++i){
			base = bases[i];
			if(!base){
				err("mixin #" + i + " is null");
			}
			lin = base._meta ? base._meta.bases : [base];
			top = 0;
			// add bases to the name map
			for(j = lin.length - 1; j >= 0; --j){
				proto = lin[j].prototype;
				if(!proto.hasOwnProperty("declaredClass")){
					proto.declaredClass = "dojoUniqClassName_" + (counter++);
				}
				name = proto.declaredClass;
				if(!nameMap.hasOwnProperty(name)){
					nameMap[name] = {count: 0, refs: [], cls: lin[j]};
					++clsCount;
				}
				rec = nameMap[name];
				if(top && top !== rec){
					rec.refs.push(top);
					++top.count;
				}
				top = rec;
			}
			++top.count;
			dag[0].refs.push(top);
		}

		// remove classes without external references recursively
		while(dag.length){
			top = dag.pop();
			result.push(top.cls);
			--clsCount;
			// follow a single-linked chain
			for(refs = top.refs; refs.length == 1; refs = top.refs){
				top = refs[0];
				if(!top){
					// end of the chain
					break;
				}
				if(--top.count){
					// branch: signal next cycle
					top = 0;
					break;
				}
				result.push(top.cls);
				--clsCount;
			}
			if(top){
				// branch
				for(i = 0, l = refs.length; i < l; ++i){
					top = refs[i];
					if(!--top.count){
						dag.push(top);
					}
				}
			}
		}
		if(clsCount){
			err("can't build consistent linearization");
		}

		// calculate the superclass
		l = 0;
		base = bases[0];
		if(base){
			l = 1;
			if(base._meta){
				base = base._meta.bases;
				for(i = 0, l = base.length, j = result.length - l; i < l; ++i, ++j){
					if(base[i] !== result[j]){
						l = 1;
						break;
					}
				}
			}
		}
		result[0] = l;

		return result;
	}

	// find the next "inherited" method using available meta-information
	function findInherited(self, caller, name){
		var meta = self.constructor._meta, bases = meta.bases,
			l = bases.length, i, f, opf, cache, currentBase, proto;

		name = name || caller.nom;
		if(!name){
			err("can't deduce a name to call inherited()");
		}

		// error detection
		if(name == "constructor" && meta.ctorSpecial){
			err("calling constructor as inherited");
		}
		if(meta.chains.hasOwnProperty(name)){
			err("calling chained method as inherited: " + name);
		}

		// find our caller using simple cache and the list of base classes
		cache = self._inherited;
		currentBase = bases[cache.pos];
		meta = currentBase && currentBase._meta;
		proto = currentBase && currentBase.prototype;
		if(!currentBase || cache.name != name ||
				!(meta ?
					(meta.hidden[name] === caller ||
						proto.hasOwnProperty(name) && proto[name] === caller) :
					(proto[name] === caller))){
			// cache bust
			for(i = 0; i < l; ++i){
				currentBase = bases[i];
				meta = currentBase._meta;
				proto = currentBase.prototype;
				if(meta ?
						(meta.hidden[name] === caller ||
							proto.hasOwnProperty(name) &&
							proto[name] === caller) :
						(proto[name] === caller)){
					break;
				}
			}
			cache.name = name;
			cache.pos = i < l ? i : -1;
		}
		i = cache.pos;

		// find next
		opf = op[name];
		while(++i < l){
			currentBase = bases[i];
			proto = currentBase.prototype;
			if(currentBase._meta){
				if(proto.hasOwnProperty(name)){
					f = proto[name];
					break;
				}
			}else{
				f = proto[name];
				if(f && f !== opf){
					break;
				}
			}
		}
		cache.pos = i;

		// return found method, or the underlying Object method
		return i < l && f || name != "constructor" && opf;
	}

	// implementation of getInherited()
	function getInherited(args, a){
		var name;
		// crack arguments
		if(typeof args == "string"){
			name = args;
			args = a;
		}
		return findInherited(this, args.callee, name);
	}

	// implementation of inherited()
	function inherited(args, a, f){
		var name;
		// crack arguments
		if(typeof args == "string"){
			name = args;
			args = a;
			a = f;
		}
		f = findInherited(this, args.callee, name);
		// do not call the inherited at the end of the chain
		return f ? f.apply(this, a || args) : undefined;
	}

	// emulation of "instanceof"
	function isInstanceOf(cls){
		var bases = this.constructor._meta.bases;
		for(var i = 0, l = bases.length; i < l; ++i){
			if(bases[i] === cls){
				return true;
			}
		}
		return this instanceof cls;
	}

	// imlementation of our fancy extend (adds metadata)
	function extend(props){
		var name, t, i = 0, l = d._extraNames.length, proto = this.prototype;
		// add props adding metadata for incoming functions
		for(name in props){
			t = props[name];
			if(t !== op[name] || !(name in op)){
				if(isF(t)){
					// non-trivial function method => attach its name
					t.nom = name;
				}
				proto[name] = t;
			}
		}
		// process unenumerable methods on IE
		for(; i < l; ++i){
			name = d._extraNames[i];
			t = props[name];
			if(t !== op[name] || !(name in op)){
				if(isF(t)){
					// non-trivial function method => attach its name
					t.nom = name;
				}
				proto[name] = t;
			}
		}
	}

	// chained constructor compatible with the legacy dojo.declare()
	function chainedConstructor(bases, ctorSpecial){
		return function(){
			var a = arguments, args = a, a0 = a[0], f, i, m, h,
				l = bases.length, preArgs;
			this._inherited = {};
			// perform the shaman's rituals of the original dojo.declare()
			// 1) call two types of the preamble
			if(ctorSpecial && (a0 && a0.preamble || this.preamble)){
				// full blown ritual
				preArgs = new Array(bases.length);
				// prepare parameters
				preArgs[0] = a;
				for(i = 0;;){
					// process the preamble of the 1st argument
					a0 = a[0];
					if(a0){
						f = a0.preamble;
						if(f){
							a = f.apply(this, a) || a;
						}
					}
					// process the preamble of this class
					f = bases[i].prototype;
					f = f.hasOwnProperty("preamble") && f.preamble;
					if(f){
						a = f.apply(this, a) || a;
					}
					// one pecularity of the preamble:
					// it is called if it is not needed,
					// e.g., there is no constructor to call
					// let's watch for the last constructor
					// (see ticket #9795)
					if(++i == l){
						break;
					}
					preArgs[i] = a;
				}
			}
			// 2) call all non-trivial constructors using prepared arguments
			for(i = l - 1; i >= 0; --i){
				f = bases[i];
				m = f._meta;
				if(m){
					h = m.hidden;
					f = h.hasOwnProperty("constructor") && h.constructor;
				}
				if(f){
					f.apply(this, preArgs ? preArgs[i] : a);
				}
			}
			// 3) continue the original ritual: call the postscript
			f = this.postscript;
			if(f){
				f.apply(this, args);
			}
		};
	}

	// plain vanilla constructor (can use inherited() to call its base constructor)
	function simpleConstructor(bases){
		return function(){
			var a = arguments, f, i = 0, l = bases.length;
			this._inherited = {};
			// perform the shaman's rituals of the original dojo.declare()
			// 1) do not call the preamble
			// 2) call the top constructor (it can use this.inherited())
			for(; i < l; ++i){
				f = bases[i];
				m = f._meta;
				if(m){
					h = m.hidden;
					f = h.hasOwnProperty("constructor") && h.constructor;
				}
				if(f){
					f.apply(this, a);
					break;
				}
			}
			// 3) call the postscript
			f = this.postscript;
			if(f){
				f.apply(this, a);
			}
		};
	}

	function chain(name, bases, reversed){
		return function(){
			var b, m, h, f, i = 0, l = bases.length, step = 1;
			if(reversed){
				i = l - 1;
				step = l = -1;
			}
			for(; i != l; i += step){
				f = 0;
				b = bases[i];
				m = b._meta;
				if(m){
					h = m.hidden;
					f = h.hasOwnProperty(name) && h[name];
				}else{
					f = b.prototype[name];
				}
				if(f){
					f.apply(this, arguments);
				}
			}
		};
	}

	d.makeDeclare = function(ctorSpecial, chains){
		chains = chains || {};

		// dojo.declare
		return function(className, superclass, props){
			var proto, i, l, t, ctor, ctorChain, name, bases, mixins = 1;

			// crack parameters
			if(typeof className != "string"){
				props = superclass;
				superclass = className;
				className = "";
			}
			props = props || {};

			// build a prototype
			if(d.isArray(superclass)){
				// C3 MRO
				bases = c3mro(superclass);
				t = bases[0];
				superclass = t == 1 ? bases[bases.length - 1] : superclass[0];
				mixins = bases.length - t;
			}else{
				bases = [0];
				if(superclass){
					t = superclass._meta;
					bases = bases.concat(t ? t.bases : superclass);
				}
			}
			if(superclass){
				for(i = mixins - 1;; --i){
					// delegation
					xtor.prototype = superclass.prototype;
					proto = new xtor;
					if(!i){
						// stop if nothing to add (the last base)
						break;
					}
					// mix in properties
					t = bases[i];
					d._mixin(proto, t._meta ? t._meta.hidden : t.prototype);
					// chain in new constructor
					ctor = new Function;
					ctor.superclass = superclass;
					ctor.prototype = proto;
					superclass = proto.constructor = ctor;
				}
			}else{
				proto = {};
			}
			xtor.prototype = proto;
			extend.call(xtor, props);
			xtor.prototype = 0;	// cleanup

			// build ctor
			bases[0] = ctor = ctorSpecial || chains.hasOwnProperty("constructor") ?
				chainedConstructor(bases, ctorSpecial) : simpleConstructor(bases);

			// add metainformation to the constructor
			ctor._meta  = {bases: bases, hidden: props, chains: chains, ctorSpecial: ctorSpecial};
			ctor.superclass = superclass && superclass.prototype;
			ctor.extend = extend;
			ctor.prototype = proto;
			proto.constructor = ctor;

			// add "standard" methods to the ptototype
			proto.getInherited = getInherited;
			proto.inherited = inherited;
			proto.isInstanceOf = isInstanceOf;

			// add name if specified
			if(className){
				proto.declaredClass = className;
				d.setObject(className, ctor);
			}

			// build chains and add them to the prototype
			for(name in chains){
				if(typeof chains[name] == "string"){
					t = proto[name] = chain(name, bases, chains[name] === "after");
					t.nom = name;
				}
			}
			// chained methods do not return values
			// no need to chain "invisible" functions

			return ctor;	// Function
		};
	};

	d.declare = d.makeDeclare(true);

	/*=====
	dojo.makeDeclare = function(ctorSpecial, chains){
		//	summary:
		//		Create a specialized version of dojo.declare
		//	ctorSpecial: Boolean
		//		If true, the classic dojo.declare() compatibility mode is enabled.
		//	chains: Object?
		//		The optional dictionary of chained method names. Allowed values
		//		can be strings "before" or "after". They specify how to chain
		//		methods.
		//	returns:
		//		New declare function.
		//	description:
		//		Create a specialized version of dojo.declare with support for the
		//		legacy compatibility mode, method chaining, and anonymous classes
		//		(see dojo.declare for more details).
		//
		//		If "ctorSpecial" is true, the resulting function works as the
		//		classic dojo.declare. In this mode, all constructors are chained
		//		using the "after" rule, preamble() method is going to be called
		//		like in the classic dojo.declare(), and user cannot use
		//		"this.inherited()" in the constructor. Otherwise, if
		//		"constructor" appears in "chains", it will be chained as
		//		specified, no magic preamble() support, and if "constructor" is
		//		not mentioned in chains, it is treated as a regular method and
		//		user can call "this.inherited()" to chain constructors manually.
		//
		//		"chains" is a literal object, which looks like this:
		//		|	{
		//		|		method1: "before",
		//		|		method2: "after"
		//		|	}
		//
		//		"before" means that a method is called before its base methods.
		//		"after" means that a method is called after its base methods.
		//		In both cases methods are called with the same arguments.
		//		Usually constructors are chained as "after" and destructors are
		//		chained as "before". Note that chaining assumes that chained
		//		methods do not return any value: any returned value will be
		//		discarded.
		//
		//	example:
		//	|	var decl = dojo.makeDeclare(false, {
		//	|		constructor: "after",
		//	|		destroy:     "before"
		//	|	});
		//	|	var A = decl(null, {
		//	|		constructor: function(){ console.log("constructing A"); },
		//	|		destroy:     function(){ console.log("destroying A"); }
		//	|	});
		//	|	var B = decl(A, {
		//	|		constructor: function(){ console.log("constructing B"); },
		//	|		destroy:     function(){ console.log("destroying B"); }
		//	|	});
		//	|	var C = decl(B, {
		//	|		constructor: function(){ console.log("constructing C"); },
		//	|		destroy:     function(){ console.log("destroying C"); }
		//	|	});
		//	|	new C().destroy();
		//	|	// will print:
		//	|	// constructing A
		//	|	// constructing B
		//	|	// constructing C
		//	|	// destroying C
		//	|	// destroying B
		//	|	// destroying A
		return new Function(); // Function
	};
	=====*/

	/*=====
	dojo.declare = function(className, superclass, props){
		//	summary:
		//		Create a feature-rich constructor from compact notation.
		//	className: String?:
		//		The optional name of the constructor (loosely, a "class")
		//		stored in the "declaredClass" property in the created prototype.
		//		It will be used as a global name for a created constructor.
		//	superclass: Function|Function[]:
		//		May be null, a Function, or an Array of Functions. This argument
		//		specifies a list of bases (the left-most one is the most deepest
		//		base).
		//	props: Object:
		//		An object whose properties are copied to the created prototype.
		//		Add an instance-initialization function by making it a property
		//		named "constructor".
		//	returns:
		//		New constructor function.
		//	description:
		//		Create a constructor using a compact notation for inheritance and
		//		prototype extension.
		//
		//		Mixin ancestors provide a type of multiple inheritance.
		//		Prototypes of mixin ancestors are copied to the new class:
		//		changes to mixin prototypes will not affect classes to which
		//		they have been mixed in.
		//
		//		Ancestors can be compound classes created by this version of
		//		dojo.declare. In complex cases all base classes are going to be
		//		linearized according to C3 MRO algorithm
		//		(see http://www.python.org/download/releases/2.3/mro/ for more
		//		details).
		//
		//		"className" is cached in "declaredClass" property of the new class,
		//		if it was supplied. The immediate super class will be cached in
		//		"superclass" property of the new class.
		//
		//		Methods in "props" will be copied and modified: "nom" property
		//		(the declared name of the method) will be added to all copied
		//		functions to help identify them for the internal machinery. Be
		//		very careful, while reusing methods: if you use the same
		//		function under different names, it can produce errors in some
		//		cases.
		//
		//		It is possible to use constructors created "manually" (without
		//		dojo.declare) as bases. They will be called as usual during the
		//		creation of an instance, their methods will be chained, and even
		//		called by "this.inherited()".
		//
		//	example:
		//	|	dojo.declare("my.classes.bar", my.classes.foo, {
		//	|		// properties to be added to the class prototype
		//	|		someValue: 2,
		//	|		// initialization function
		//	|		constructor: function(){
		//	|			this.myComplicatedObject = new ReallyComplicatedObject();
		//	|		},
		//	|		// other functions
		//	|		someMethod: function(){
		//	|			doStuff();
		//	|		}
		//	|	});
		//
		//	example:
		//	|	var MyBase = dojo.declare(null, {
		//	|		// constructor, properties, and methods go here
		//	|		// ...
		//	|	});
		//	|	var MyClass1 = dojo.declare(MyBase, {
		//	|		// constructor, properties, and methods go here
		//	|		// ...
		//	|	});
		//	|	var MyClass2 = dojo.declare(MyBase, {
		//	|		// constructor, properties, and methods go here
		//	|		// ...
		//	|	});
		//	|	var MyDiamond = dojo.declare([MyClass1, MyClass2], {
		//	|		// constructor, properties, and methods go here
		//	|		// ...
		//	|	});
		//
		//	example:
		//	|	var F = function(){ console.log("raw constructor"); };
		//	|	F.prototype.method = function(){
		//	|		console.log("raw method");
		//	|	};
		//	|	var A = dojo.declare(F, {
		//	|		constructor: function(){
		//	|			console.log("A.constructor");
		//	|		},
		//	|		method: function(){
		//	|			console.log("before calling F.method...");
		//	|			this.inherited(arguments);
		//	|			console.log("...back in A");
		//	|		}
		//	|	});
		//	|	new A().method();
		//	|	// will print:
		//	|	// raw constructor
		//	|	// A.constructor
		//	|	// before calling F.method...
		//	|	// raw method
		//	|	// ...back in A
		return new Function(); // Function
	};
	=====*/

	/*=====
	Object.inherited = function(name, args, newArgs){
		//	summary:
		//		Calls a super method.
		//	name: String?
		//		The optional method name. Should be the same as the caller's
		//		name. Usually "name" is specified in complex dynamic cases, when
		//		the calling method was dynamically added, undecorated by
		//		dojo.declare, and it cannot be determined.
		//	args: Arguments
		//		The caller supply this argument, which should be the original
		//		"arguments".
		//	newArgs: Array?
		//		If supplied, it will be used to call a super method. Otherwise
		//		"args" will be used.
		//	returns:
		//		Whatever is returned by a super method.
		//	description:
		//		This method is used inside method of classes produced with
		//		dojo.declare to call a super method (next in the chain). It is
		//		used for manually controlled chaining. Consider using the regular
		//		chaining, because it is faster. Use "this.inherited()" only in
		//		complex cases.
		//
		//		This method cannot me called from automatically chained
		//		constructors including the case of a special (legacy)
		//		constructor chaining. It cannot be called from chained methods.
		//
		//		If "this.inherited()" cannot find the next-in-chain method, it
		//		does nothing and returns "undefined". The last method in chain
		//		can be a default method implemented in Object, which will be
		//		called last.
		//
		//		If "name" is specified, it is assumed that the method that
		//		received "args" is the parent method for this call. It is looked
		//		up in the chain list and if it is found the next-in-chain method
		//		is called. If it is not found, the first-in-chain method is
		//		called.
		//
		//		If "name" is not specified, it will be derived from the calling
		//		method (using a methoid property "nom").
		//
		//	example:
		//	|	var B = dojo.declare(A, {
		//	|		method1: function(a, b, c){
		//	|			this.inherited(arguments);
		//	|		},
		//	|		method2: function(a, b){
		//	|			return this.inherited(arguments, [a + b]);
		//	|		}
		//	|	});
		//	|	// next method is not in the chain list because it is added
		//	|	// manually after the class was created.
		//	|	B.prototype.method3 = function(){
		//	|		console.log("This is a dynamically-added method.");
		//	|		this.inherited("method3", arguments);
		//	|	};
		return	{};	// Object
	}
	=====*/

	/*=====
	Object.getInherited = function(name, args){
		//	summary:
		//		Returns a super method.
		//	name: String?
		//		The optional method name. Should be the same as the caller's
		//		name. Usually "name" is specified in complex dynamic cases, when
		//		the calling method was dynamically added, undecorated by
		//		dojo.declare, and it cannot be determined.
		//	args: Arguments
		//		The caller supply this argument, which should be the original
		//		"arguments".
		//	returns:
		//		Returns a super method (Function) or "undefined".
		//	description:
		//		This method is complimentary to "this.inherited()". It uses the
		//		same algorithm but instead of executing a super method, it
		//		returns it, or "undefined" if not found.
		//
		//	example:
		//	|	var B = dojo.declare(A, {
		//	|		method: function(a, b){
		//	|			var super = this.getInherited(arguments);
		//	|			// ...
		//	|			if(!super){
		//	|				console.log("there is no super method");
		//	|				return 0;
		//	|			}
		//	|			return super.apply(this, arguments);
		//	|		}
		//	|	});
		return	{};	// Object
	}
	=====*/

	/*=====
	Object.isInstanceOf = function(cls){
		//	summary:
		//		Checks the inheritance cahin to see if it is inherited from this
		//		class.
		//	cls: Function
		//		Class constructor.
		//	returns:
		//		"true", if this object is inherited from this class, "false"
		//		otherwise.
		//	description:
		//		This method is used with instances of classes produced with
		//		dojo.declare to determine of they support a certain interface or
		//		not. It models "instanceof" operator.
		//
		//	example:
		//	|	var A = dojo.declare(null, {
		//	|		// constructor, properties, and methods go here
		//	|		// ...
		//	|	});
		//	|	var B = dojo.declare(null, {
		//	|		// constructor, properties, and methods go here
		//	|		// ...
		//	|	});
		//	|	var C = dojo.declare([A, B], {
		//	|		// constructor, properties, and methods go here
		//	|		// ...
		//	|	});
		//	|	var D = dojo.declare(A, {
		//	|		// constructor, properties, and methods go here
		//	|		// ...
		//	|	});
		//	|
		//	|	var a = new A(), b = new B(), c = new C(), d = new D();
		//	|
		//	|	console.log(a.isInstanceOf(A)); // true
		//	|	console.log(b.isInstanceOf(A)); // false
		//	|	console.log(c.isInstanceOf(A)); // true
		//	|	console.log(d.isInstanceOf(A)); // true
		//	|
		//	|	console.log(a.isInstanceOf(B)); // false
		//	|	console.log(b.isInstanceOf(B)); // true
		//	|	console.log(c.isInstanceOf(B)); // true
		//	|	console.log(d.isInstanceOf(B)); // false
		//	|
		//	|	console.log(a.isInstanceOf(C)); // false
		//	|	console.log(b.isInstanceOf(C)); // false
		//	|	console.log(c.isInstanceOf(C)); // true
		//	|	console.log(d.isInstanceOf(C)); // false
		//	|
		//	|	console.log(a.isInstanceOf(D)); // false
		//	|	console.log(b.isInstanceOf(D)); // false
		//	|	console.log(c.isInstanceOf(D)); // false
		//	|	console.log(d.isInstanceOf(D)); // true
		return	{};	// Object
	}
	=====*/
})();
