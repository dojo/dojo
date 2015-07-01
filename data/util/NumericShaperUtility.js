define(
		[],
		function() {
			
			return {
				// summary:
				//      This module is used to convert European digits to Arabic Digits & vice versa. 
				// description:
				//		Arabic and many other languages have classical shapes for digits (National Digits)
				//		That are different from the conventional Western Digits (European).
				//		Arabic digits have the same semantic meaning as the European digits. The difference is
				//		Only a difference in glyphs.
				//		This module is used to shape the digits contained in any string from Arabic to European
				//		And vice versa.
				
				
				// _context: [private] int
				//		The current effective context.
				//		Used to shape the digits in 'Contextual' mode.
				//		If the value is 1 & the mode is contextual, the digits will be European.
				//		If the value is 2 & the mode is contextual, the digits will be Arabic.
				//		Allowed values:
				//		'1': European context
				//		'2': Arabic context
				_context : 1,
				
				shape: function(/*String*/ text, /*String*/ shaperType, /*String?*/ textDir){
					// summary:
					//		Converts the digits in the text to European or Arabic digits
					//		According to the shaperType & the textDir.
					// description:
					//      This function is intended to convert the digits in the input 
					//		Text from European to Arabic & vice versa according to 
					//		The shaperType & the textDir as the following:
					//		1-Arabic: if shaperType = 'National'.
					//      2-Arabic: if shaperType = 'Contextual' & the preceding character is Arabic.
					//		3-Arabic: if shaperType = 'Contextual' & textDir='rtl' & no preceding strong character.
					//		4-European: if shaperType = 'Nominal'.
					//		5-European: if shaperType = 'Contextual' & the preceding character is English.
					//		6-European: if shaperType = 'Contextual' & textDir='ltr' & no preceding strong character.
					// text: String
					//		The text to be shaped.
					// shaperType: String
					//		The type of the shaper to be used.
					//		Allowed values:
					//		1."National"
					//		2."Nominal"
					//		3."Contextual"
					// textDir: String
					//		The direction of the input text.
					//		Allowed values:
					//		1. "ltr"
					//		2. "rtl"
					//		3. "auto"
					// returns:
					//		The shaped string.
					
					if(!text){
						return;
					}
					
					if(["National", "Nominal", "Contextual"].indexOf(shaperType) === -1){
						return text;
					}
					
					if(shaperType === "National"){
						return this._shapeArabic(text);
					}else if(shaperType === "Nominal"){
						return this._shapeEuropean(text);
					}else if(shaperType === "Contextual" && textDir === "rtl"){
						this._context = 2;
						return this._shapeContextual(text);
					}else{
						this._context = 1;
						return this._shapeContextual(text);
					}
				},
				
				_shapeEuropean: function (/*String*/ text){
					// summary:
					//		Converts the digits in the text to European digits.
					// text: String
					//		The text to be shaped.
					// return:
					//		The shaped string in European format.
					// tags:
			        //		private
					
					var textArr = text.split("");
					var c = "";
					for (var i = 0; i < text.length; ++i) {
						c = textArr[i];
						if (c >= "\u0660" && c <= "\u0669") { // Arabic digits range
							textArr[i] = c.charCodeAt(0) - 1632;
						}
					}
					return textArr.join("");
				},
				
				_shapeArabic: function(/*String*/ text){
					// summary:
					//		Converts the digits in the text to Arabic digits.
					// text: String
					//		The text to be shaped.
					// return:
					//		The shaped string in Arabic format.
					// tags:
			        //		private
					
					var textArr = text.split("");
					var c = "";
					for (var i = 0; i < text.length; ++i) {
						c = textArr[i];
						if (c >= "0" && c <= "9") { // European digits range
							textArr[i] = String.fromCharCode(parseInt(c) + 1632);
						}
					}
					return textArr.join("");
				},
				
				_shapeContextual: function(/*String*/ text){
					// summary:
					//		Converts the digits in the text to European or Arabic digits
					//		According to the type of the preceding strong character.
					// text: String
					//		The text to be shaped.
					// return:
					//		The shaped string.
					// tags:
			        //		private
					
					var textArr = text.split("");
					var c = "";
					for (var i = 0; i < text.length; ++i) {
						c = textArr[i];
						if (c >= "0" && c <= "9") {  // European digits range
							if(this._context === 2){ // context = 2 so convert from European to Arabic. else skip.
								textArr[i] = String.fromCharCode(parseInt(c) + 1632);
							}
						}else if (c >= "\u0660" && c <= "\u0669"){ // Arabic digits range
							if(this._context === 1){ // context = 1 so convert from Arabic to European. else skip.
								textArr[i] = c.charCodeAt(0) - 1632;
							}
						}else{ // this is not an Arabic or European digit.
							this._setContext(c);
						}
						
					}
					return textArr.join("");
				},
				
				_setContext: function(/*String*/ char){
					// summary:
					//		Set the current context according to the type of the input char.
					//		If the char is strong Arabic character this._context will be 2
					//		Else if it is a strong English character this._context will be 1
					//		Otherwise do nothing.
					// char: String
					//		The input character which will be checked 
					//		To determine if it is a strong Arabic or strong English character.
					// tags:
			        //		private
					
					
					/* As of Unicode 7.0, the Arabic script is contained in the following blocks:
					 * 
					 * Arabic (0600—06FF, 255 characters)Arabic Supplement (0750—077F, 48 characters)
					 * Arabic Extended-A (08A0—08FF, 39 characters)
					 * Arabic Presentation Forms-A (FB50—FDFF, 608characters)
					 * Arabic Presentation Forms-B (FE70—FEFF, 140 characters)
					 */
					
					var strongArabic = [["\u0608", "\u0608"],
					                    ["\u060B", "\u060B"],
					                    ["\u060D", "\u060D"],
					                    ["\u061B", "\u064A"], 
					                    ["\u066D", "\u066F"],
					                    ["\u0671", "\u06D5"],
					                    ["\u06E5", "\u06E6"],
					                    ["\u06EE", "\u06EF"],
					                    ["\u06FA", "\u06FF"],
					                    ["\u0750", "\u077F"],
					                    ["\u08A0", "\u08E3"],
					                    ["\u200F", "\u200F"],
					                    ["\u202B", "\u202B"],
					                    ["\u202E", "\u202E"],
					                    ["\u2067", "\u2067"],
					                    ["\uFB50", "\uFD3D"],
					                    ["\uFD40", "\uFDCF"],
					                    ["\uFDF0", "\uFDFC"],
					                    ["\uFDFE", "\uFDFF"],
					                    ["\uFE70", "\uFEFE"]];
					
					var weakArabic =[["\u0600", "\u0607"],
					                 ["\u0609", "\u060A"],
					                 ["\u060C", "\u060C"],
					                 ["\u060E", "\u061A"],
					                 ["\u064B", "\u066C"],
					                 ["\u0670", "\u0670"],
					                 ["\u06D6", "\u06E4"],
					                 ["\u06E7", "\u06ED"],
					                 ["\u06F0", "\u06F9"],
					                 ["\u08E4", "\u08FF"],
					                 ["\uFD3E", "\uFD3F"],
					                 ["\uFDD0", "\uFDEF"],
					                 ["\uFDFD", "\uFDFD"],
					                 ["\uFEFF", "\uFEFF"]];
						
					/* As of Unicode 7.0, the latin script is contained in the following blocks:
					 * 
					 * Basic Latin, 0000–007F.
					 * Latin Extended-A, 0100–017F
					 * Latin Extended-B, 0180–024F
					 * IPA Extensions, 0250–02AF
					 * Spacing Modifier Letters, 02B0–02FF
					 * Phonetic Extensions, 1D00–1D7F 
					 * Phonetic Extensions Supplement, 1D80–1DBF
					 * Latin Extended Additional, 1E00–1EFF
					 * Superscripts and Subscripts, 2070-209F
					 * Letter-like Symbols, 2100–214F
					 * Number Forms, 2150–218F
					 * Latin Extended-C, 2C60–2C7F
					 * LatinExtended-D, A720–A7FF
					 * Latin Extended-E, AB30–AB6F
					 * Alphabetic Presentation Forms (Latin ligatures) FB00–FB4F
					 * Halfwidth and Fullwidth Forms (fullwidthLatin letters) FF00–FFEF
					 */
					var weakLatin = [["\u0000", "\u0040"],
					                 ["\u005B", "\u0060"],
					                 ["\u007B", "\u007F"],
					                 ["\u0080", "\u00A9"],
					                 ["\u00AB", "\u00B4"],
					                 ["\u00B6", "\u00B9"],
					                 ["\u00BB", "\u00BF"],
					                 ["\u00D7", "\u00D7"],
					                 ["\u00F7", "\u00F7"],
					                 ["\u02B9", "\u02BA"],
					                 ["\u02C2", "\u02CF"],
					                 ["\u02D2", "\u02DF"],
					                 ["\u02E5", "\u02ED"],
					                 ["\u02EF", "\u02FF"],
					                 ["\u2070", "\u2070"],
					                 ["\u2074", "\u207E"],
					                 ["\u2080", "\u208E"],
					                 ["\u2100", "\u2101"], 
					                 ["\u2103", "\u2106"], 
					                 ["\u2108", "\u2109"], 
					                 ["\u2114", "\u2114"], 
					                 ["\u2116", "\u2118"], 
					                 ["\u211E", "\u2123"], 
					                 ["\u2125", "\u2125"], 
					                 ["\u2127", "\u2127"], 
					                 ["\u2129", "\u2129"], 
					                 ["\u212E", "\u212E"], 
					                 ["\u213A", "\u213B"], 
					                 ["\u2140", "\u2144"], 
					                 ["\u214A", "\u214D"],
					                 ["\u2150", "\u215F"], 
					                 ["\u2189", "\u2189"],
					                 ["\uA720", "\uA721"],
					                 ["\uA788", "\uA788"],
					                 ["\uFF01", "\uFF20"], 
					                 ["\uFF3B", "\uFF40"], 
					                 ["\uFF5B", "\uFF65"], 
					                 ["\uFFE0", "\uFFE6"], 
					                 ["\uFFE8", "\uFFEE"]];
					
					if(this._binarySearch(strongArabic, char) > -1){
						this._context = 2;
					}else if(this._binarySearch(weakArabic, char) > -1 || this._binarySearch(weakLatin, char) > -1){
						return;
					}else{
						this._context = 1;
					}
				},
				
				_binarySearch: function(/*Array*/ arr, /*string*/ key) {
					var low = 0;
					var high = arr.length - 1;
					while (low <= high) {
						var mid = parseInt(low + ((high - low) / 2));
						if (key >= arr[mid][0] && key <= arr[mid][1]){
							return mid;
						}else if (key > arr[mid]){
							low = mid + 1;
						}else if (key < arr[mid]){
							high = mid - 1;
						}
					}
					return -1;
				}
				
			};
		});