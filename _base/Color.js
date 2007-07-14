dojo.provide("dojo._base.Color");
dojo.require("dojo._base.array");
dojo.require("dojo._base.lang");

dojo.Color = function(/*Array|String|Object*/ color){
	// summary:
	//		takes a named string, hex string, array of rgb or rgba values,
	//		an object with r, g, b, and a properties, or another dojo.Color object
	if(color){ this.setColor(color); }
};

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


(function(){
	var sanitize = function(c, low, high){
		// summary:
		//		sanitize a color component by making sure it is a number,
		//		and clamping it to valid values
		c = Number(c);
		return isNaN(c) ? high : c < low ? low : c > high ? high : c;
	};
	
	dojo.extend(dojo.Color, {
		r: 255, g: 255, b: 255, a: 1,
		_set: function(r, g, b, a){
			var t = this; t.r = r; t.g = g; t.b = b; t.a = a;
		},
		setColor: function(/*Array|String|Object*/ color){
			// summary:
			//		takes a named string, hex string, array of rgb or rgba values,
			//		an object with r, g, b, and a properties, or another dojo.Color object
			var d = dojo;
			if(d.isString(color)){
				d.colorFromString(color, this);
			}else if(d.isArray(color)){
				d.colorFromArray(color, this);
			}else{
				this._set(color.r, color.g, color.b, color.a);
				if(!(color instanceof d.Color)){ this.sanitize(); }
			}
			return this;	// dojo.Color
		},
		sanitize: function(){
			// summary: makes sure that the object has correct attributes
			var t = this;
			t.r = Math.round(sanitize(t.r, 0, 255));
			t.g = Math.round(sanitize(t.g, 0, 255));
			t.b = Math.round(sanitize(t.b, 0, 255));
			t.a = sanitize(t.a, 0, 1);
			return this;	// dojo.Color
		},
		toRgb: function(/*Boolean?*/ includeAlpha){
			// summary: returns 3 or 4 component array of rgb(a) values
			var t = this;
			return includeAlpha ? [t.r, t.g, t.b] : [t.r, t.g, t.b, t.a];	// Array
		},
		toRgba: function(){
			// summary: returns a 4 component array of rgba values
			var t = this;
			return [t.r, t.g, t.b, t.a];	// Array
		},
		toHex: function(){
			// summary: returns a css color string in hexadecimal representation
			var arr = dojo.map(["r", "g", "b"], function(x){
				var s = this[x].toString(16);
				return s.length < 2 ? "0" + s : s;
			}, this);
			return "#" + arr.join("");	// String
		},
		toCss: function(/*Boolean?*/ includeAlpha){
			// summary: returns a css color string in rgb(a) representation
			var t = this, rgb = t.r + ", " + t.g + ", " + t.b;
			return (includeAlpha ? "rgba(" + rgb + ", " + t.a : "rgb(" + rgb) + ")";	// String
		},
		toString: function(){
			// summary: returns a visual representation of the color
			return this.toCss(true); // String
		}
	});
})();

dojo.blendColors = function(
	/*String|Array|dojo.Color*/ end, 
	/*String|Array|dojo.Color*/ start, 
	/*Number?*/ weight,
	/*dojo.Color?*/ obj
){
	// summary: 
	//		blend colors end and start with weight
	//		from -1 to +1, 0 being a 50/50 blend,
	//		can reuse the same dojo.Color object for the result
	var d = dojo, t = obj ? obj : new dojo.Color();
	if(!(end instanceof d.Color)){ end = new dojo.Color(end); }
	if(!(start instanceof d.Color)){ start = new dojo.Color(start); }
	weight = Math.min(Math.max(-1, weight || 0), 1);

	// Alex: this interface blows.
	// map -1 to 1 to the range 0 to 1
	weight = (weight + 1) / 2;

	d.forEach(["r", "g", "b", "a"], function(c){
		t[c] = start[c] + (end[c] - start[c]) * weight;
	});
	
	return t.sanitize();	// dojo.Color
};

dojo.colorFromRgb = function(/*String*/ color, /*dojo.Color?*/ obj){
	// summary: get rgb(a) array from css-style color declarations
	color = color.toLowerCase();
	var m = color.match(/^(rgba?)\(([\s\.,0-9]+)\)/i);
	if(m){
		var c = m[2].split(/\s*,\s*/);
		if((m[1] == "rgb" && c.length == 3) || (m[1] == "rgba" && c.length == 4)){
			return dojo.colorFromArray(c, obj);	// dojo.Color
		}
	}
	// else return the default color (white)
	return null;	// dojo.Color
};

dojo.colorFromHex = function(/*String*/ color, /*dojo.Color?*/ obj){
	// summary: converts a hex string with an optional '#' prefix to a color object.
	//	Supports 12-bit #rgb shorthand.
	if(color.charAt(0) == "#"){ color = color.substr(1); }
	var bits = (color.length == 3) ? 4 : 8;
	var mask = (1 << bits) - 1;
	color = Number("0x" + color);
	if(isNaN(color)){
		return null; // dojo.Color
	}
	var rgb = [];
	for(var i = 3; i; i--){
		var x = color & mask;
		if(bits == 4){ x *= 17; }
		rgb[i-1] = x;
		color >>= bits;
	}
	return dojo.colorFromArray(rgb, obj);	// dojo.Color
};

dojo.colorFromArray = function(/*Array*/ a, /*dojo.Color?*/ obj){
	// summary: builds a color from 1, 2, 3, or 4 element array
	var t = obj ? obj : new dojo.Color(), l = a.length;
	if(l > 0){
		if(l < 3){
			// greyscale + optional alpha
			t._set(a[0], a[0], a[0], l < 2 ? 1 : a[1]);
		}else{
			// rgb + optional alpha
			t._set(a[0], a[1], a[2], l < 4 ? 1 : a[3]);
		}
	}
	return t.sanitize();	// dojo.Color
};

dojo.colorFromString = function(/*String*/ str, /*dojo.Color?*/ obj){
	var a = dojo.Color.named[str];
	return a && dojo.colorFromArray(a, obj) || dojo.colorFromRgb(str, obj) || dojo.colorFromHex(str, obj);
};
