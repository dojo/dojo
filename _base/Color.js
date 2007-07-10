dojo.provide("dojo._base.Color");
dojo.require("dojo._base.array");
dojo.require("dojo._base.lang");

dojo.Color = function(/*r, g, b, a*/){
	this.setColor.apply(this, arguments);
}

// FIXME: there's got to be a more space-efficient way to encode or discover these!!  Use hex?
dojo.Color.named = {
	black:      [0,0,0],
	silver:     [192,192,192],
	gray:       [128,128,128],
	white:      [255,255,255],
	maroon:		[128,0,0],
	red:        [255,0,0],
	purple:		[128,0,128],
	fuchsia:	[255,0,255],
	green:	    [0,128,0],
	lime:	    [0,255,0],
	olive:		[128,128,0],
	yellow:		[255,255,0],
	navy:       [0,0,128],
	blue:       [0,0,255],
	teal:		[0,128,128],
	aqua:		[0,255,255]
};

dojo.extend(dojo.Color, {
	// FIXME: implement caching of the RGBA array generation!! It's stupid that we realloc
	_cache: null,
	setColor: function(/*Array|String|(r, g, b, a)*/){
		// summary:
		// 		takes an r, g, b, a(lpha) value, [r, g, b, a] array, "rgb(...)"
		// 		string, hex string (#aaa, #aaaaaa, aaaaaaa)

		this._cache = [];
		var d = dojo;
		var a = arguments;
		var a0 = a[0];
		var pmap = (d.isArray(a0) ? a0 : (d.isString(a0) ? d.extractRgb(a0) : d._toArray(a)) );
		d.forEach(["r", "g", "b", "a"], function(p, i){
			this._cache[i] = this[p] = parseFloat(pmap[i]);
		}, this);
		this._cache[3] = this.a = this.a || 1.0;
	},
	toRgb: function(includeAlpha){
		return this._cache.slice(0, (includeAlpha ? 4 : 3)); // Array
	},
//FIXME: redundant?
	toRgba: function(){
		return this._cache.slice(0, 4); // Array
	},
//FIXME: toHex is redundant.  Just use toString?
	toHex: function(){
		return dojo.rgb2hex(this.toRgb()); // String
	},
	toCss: function(){
		return "rgb(" + this.toRgb().join(", ") + ")"; // String
	},
	toString: function(){
		//TODO: decent default?
		return this.toHex(); // String
	}
});

dojo.blendColors = function(/*String|Array|dojo.Color*/a, /*String|Array|dojo.Color*/b, /*Number?*/weight){
	// summary: 
	//		blend colors a and b with weight
	//		from -1 to +1, 0 being a 50/50 blend
	if(typeof a == "string"){ a = dojo.extractRgb(a); }
	if(typeof b == "string"){ b = dojo.extractRgb(b); }
	a = a._cache || a;
	b = b._cache || b;
	weight = Math.min(Math.max(-1, weight||0), 1);

	// alex: this interface blows.
	// map -1 to 1 to the range 0 to 1
	weight = (weight + 1)/2;

	return dojo.map(dojo._toArray(b), function(x, i){
		return parseInt(x + ((a[i] - x) * weight));
	}); // Array
}

// get RGB array from css-style color declarations
dojo.extractRgb = function(/*String*/color){
	color = color.toLowerCase();
	if(!color.indexOf("rgb")){
		var matches = color.match(/rgba*\((\d+), *(\d+), *(\d+)/i);
		return dojo.map(matches.splice(1, 3), parseFloat); // Array
	}else{
		return dojo.hex2rgb(color) || dojo.Color.named[color] || [255, 255, 255]; // Array
	}
}

dojo.hex2rgb = function(/*String*/value){
	// summary: converts a hex string with an optional '#' prefix to an 3-element rgb array.  Supports 12-bit #rgb shorthand.

	if(value.charAt(0) == "#"){ value = value.substr(1); }
	var bits = (value.length == 3) ? 4 : 8;
	var mask = (1 << bits) - 1;
	value = Number("0x"+value);
	if(isNaN(value)){
		return null; // null
	}
	var rgb = [];
	for(var i = 3; i; i--){
		var x = value & mask;
		if(bits == 4){ x *= 17; }
		rgb[i-1] = x;
		value >>= bits;
	}
	return rgb; // Array
}

dojo.rgb2hex = function(/*Array|dojo.Color*/rgb){
	// summary: converts a dojo.Color or an Array containing RGB values to a CSS-style hex string.

	var arr = dojo.map(rgb._cache || rgb, function(x){
		var s = (new Number(x)).toString(16);
		while(s.length < 2){ s = "0" + s; }
		return s;
	});

	return "#" + arr.join(""); // String
}
