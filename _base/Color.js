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
	setColor: function(/*r, g, b, a*/){
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
		return this._cache.slice(0, (includeAlpha ? 4 : 3));
	},
	toRgba: function(){
		return this._cache.slice(0, 4);
	},
	toHex: function(){
		return dojo.rgb2hex(this.toRgb());
	},
	toCss: function(){
		return "rgb(" + this.toRgb().join(", ") + ")";
	},
	toString: function(){
		return this.toHex(); // decent default?
	}
});

dojo.blendColors = function(a, b, weight){
	// summary: 
	//		blend colors a and b with weight
	//		from -1 to +1, 0 being a 50/50 blend
	if(typeof a == "string"){ a = dojo.extractRgb(a); }
	if(typeof b == "string"){ b = dojo.extractRgb(b); }
	if(a["_cache"]){ a = a._cache; }
	if(b["_cache"]){ b = b._cache; }
	weight = Math.min(Math.max(-1, (weight||0)), 1);

	// alex: this interface blows.
	// map -1 to 1 to the range 0 to 1
	weight = (weight + 1)/2;
	
	var c = [];

	// var stop = (1000*weight);
	for(var x = 0; x < 3; x++){
		// console.debug(b[x] + ((a[x] - b[x]) * weight));
		c[x] = parseInt( b[x] + ( (a[x] - b[x]) * weight) );
	}
	return c;
}

// get RGB array from css-style color declarations
dojo.extractRgb = function(color){
	color = color.toLowerCase();
	if(!color.indexOf("rgb")){
		var matches = color.match(/rgba*\((\d+), *(\d+), *(\d+)/i);
		return dojo.map(matches.splice(1, 3), parseFloat);
	}else{
		return dojo.hex2rgb(color) || dojo.Color.named[color] || [255, 255, 255];
	}
}

dojo.hex2rgb = function(hex){
	var hexNum = "0123456789abcdef";
	var rgb = new Array(3);
	if(hex.charAt(0) == "#"){ hex = hex.substr(1); }
	hex = hex.toLowerCase();
	if(hex.replace(new RegExp("["+hexNum+"]", "g"), "") != ""){
		return null;
	}
	if(hex.length == 3){
		rgb[0] = hex.charAt(0) + hex.charAt(0);
		rgb[1] = hex.charAt(1) + hex.charAt(1);
		rgb[2] = hex.charAt(2) + hex.charAt(2);
	}else{
		rgb[0] = hex.substr(0, 2);
		rgb[1] = hex.substr(2, 2);
		rgb[2] = hex.substr(4);
	}
	for(var i = 0; i < rgb.length; i++){
		rgb[i] = hexNum.indexOf(rgb[i].charAt(0)) * 16 + hexNum.indexOf(rgb[i].charAt(1));
	}
	return rgb;
}

dojo.rgb2hex = function(r, g, b){
	// summary: converts an RGB numbers set to hex color code
	var ret = dojo.map(((r._cache)||((!g) ? r : [r, g, b])), function(x, i){
		var s = (new Number(x)).toString(16);
		while(s.length < 2){ s = "0" + s; }
		return s;
	});
	ret.unshift("#");
	return ret.join("");  // String
}
