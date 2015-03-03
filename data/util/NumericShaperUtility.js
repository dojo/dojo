define([ "dojo/_base/declare", ], function(declare) {
	return declare("NumericShaperUtility", null, {
		// summary:
		// This class handles numeric shaping. A shaper can
		// either be contextual or not.
		// A non-contextual shaper will always translate ASCII
		// digits in its input into the target Unicode range.
		// A contextual shaper will change the target Unicode
		// range depending on the characters it has previously
		// processed.
		// Create a new numeric shaper. The key given is a
		// constant from this class, the constructor turns it
		// into its internal form.
		// key: int
		// The key to use, as one of the manifest constants
		// mask: int
		// The mask of languages to shape for

		// Bidi Support
		// INT_MIN_VALUE: [const] int
		INT_MIN_VALUE : -2147483646,

		// ALL_RANGES: [const] int
		ALL_RANGES : 524287,

		// ARABIC: [const] int
		// Constant representing the Unicode ARABIC range.
		ARABIC : 2,

		// BENGALI: [const] int
		// Constant representing the Unicode BENGALI range.
		BENGALI : 16,

		// DEVANAGARI: [const] int
		// Constant representing the Unicode DEVANAGARI range.
		DEVANAGARI : 8,

		// EASTERN_ARABIC: [const] int
		// Constant representing the Unicode extended arabic
		// range.
		EASTERN_ARABIC : 4,

		// ETHIOPIC: [const] int
		// Constant representing the Unicode ETHIOPIC range.
		ETHIOPIC : 65536,

		// EUROPEAN: [const] int
		// Constant representing the Unicode EUROPEAN range.
		EUROPEAN : 1,

		// GUJARATI: [const] int
		// Constant representing the Unicode GUJARATI range.
		GUJARATI : 64,

		// GURMUKHI: [const] int
		// Constant representing the Unicode GURMUKHI range.
		GURMUKHI : 32,

		// KANNADA: [const] int
		// Constant representing the Unicode KANNADA range.
		KANNADA : 1024,

		// KHMER: [const] int
		// Constant representing the Unicode KHMER range.
		KHMER : 131072,

		// LAO: [const] int
		// Constant representing the Unicode LAO range.
		LAO : 8192,

		// MALAYALAM: [const] int
		// Constant representing the Unicode MALAYALAM range.
		MALAYALAM : 2048,

		// MONGOLIAN: [const] int
		// Constant representing the Unicode MONGOLIAN range.
		MONGOLIAN : 262144,

		// MYANMAR: [const] int
		// Constant representing the Unicode MYANMAR range.
		MYANMAR : 32768,

		// ORIYA: [const] int
		// Constant representing the Unicode ORIYA range.
		ORIYA : 128,

		// TAMIL: [const] int
		// Constant representing the Unicode TAMIL range.
		// Note that there is no digit zero in this range
		// An ASCII digit zero is left unchanged when shaping to
		// this range.
		TAMIL : 256,

		// TELUGU: [const] int
		// Constant representing the Unicode TELUGU range.
		TELUGU : 512,

		// THAI: [const] int
		// Constant representing the Unicode THAI range.
		THAI : 4096,

		// TIBETAN: [const] int
		// Constant representing the Unicode TIBETAN range.
		TIBETAN : 16384,

		// zeroDigitsArray: char []
		// This array holds the zero digits for each language.
		// This is hard-coded because the values will not
		// change.
		// In the two places where a language does not have a
		// zero digit,
		// the character immediately preceeding the one digit is
		// used instead.

		zeroDigitsArray : [ '0', // EUROPEAN
		'\u0660', // ARABIC
		'\u06f0', // EASTERN_ARABIC
		'\u0966', // DEVANAGARI
		'\u09e6', // BENGALI
		'\u0a66', // GURMUKHI
		'\u0ae6', // GUJARATI
		'\u0b66', // ORIYA
		'\u0be6', // TAMIL - special case as there is no digit
		// zero
		'\u0c66', // TELUGU
		'\u0ce6', // KANNADA
		'\u0d66', // MALAYALAM
		'\u0e50', // THAI
		'\u0ed0', // LAO
		'\u0f20', // TIBETAN
		'\u1040', // MYANMAR
		'\u1368', // ETHIOPIC - special case as there is no
		// digit zero
		'\u17e0', // KHMER
		'\u1810' // MONGOLIAN
		],

		// Key: [const] int
		// The default initial context for this shaper,
		// specified as an integer from 0 to 18
		key : 0,

		// mask: [const] int
		// The target ranges handled by this shaper.
		// If the shaper is not contextual, the high bit of this
		// field will be set.
		mask : 0,

		// blocksStarts: [const] int []
		blockStarts : [ 0x0000, // Basic Latin
		0x0080, // Latin-1 Supplement
		0x0100, // Latin Extended-A
		0x0180, // Latin Extended-B
		0x0250, // IPA Extensions
		0x02B0, // Spacing Modifier Letters
		0x0300, // Combining Diacritical Marks
		0x0370, // Greek and Coptic
		0x0400, // Cyrillic
		0x0500, // Cyrillic Supplementary
		0x0530, // Armenian
		0x0590, // Hebrew
		0x0600, // Arabic
		0x0700, // Syriac
		0x0750, // unassigned
		0x0780, // Thaana
		0x07C0, // unassigned
		0x0900, // Devanagari
		0x0980, // Bengali
		0x0A00, // Gurmukhi
		0x0A80, // Gujarati
		0x0B00, // Oriya
		0x0B80, // Tamil
		0x0C00, // Telugu
		0x0C80, // Kannada
		0x0D00, // Malayalam
		0x0D80, // Sinhala
		0x0E00, // Thai
		0x0E80, // Lao
		0x0F00, // Tibetan
		0x1000, // Myanmar
		0x10A0, // Georgian
		0x1100, // Hangul Jamo
		0x1200, // Ethiopic
		0x1380, // unassigned
		0x13A0, // Cherokee
		0x1400, // Unified Canadian Aboriginal Syllabics
		0x1680, // Ogham
		0x16A0, // Runic
		0x1700, // Tagalog
		0x1720, // Hanunoo
		0x1740, // Buhid
		0x1760, // Tagbanwa
		0x1780, // Khmer
		0x1800, // Mongolian
		0x18B0, // unassigned
		0x1900, // Limbu
		0x1950, // Tai Le
		0x1980, // unassigned
		0x19E0, // Khmer Symbols
		0x1A00, // unassigned
		0x1D00, // Phonetic Extensions
		0x1D80, // unassigned
		0x1E00, // Latin Extended Additional
		0x1F00, // Greek Extended
		0x2000, // General Punctuation
		0x2070, // Superscripts and Subscripts
		0x20A0, // Currency Symbols
		0x20D0, // Combining Diacritical Marks for Symbols
		0x2100, // Letterlike Symbols
		0x2150, // Number Forms
		0x2190, // Arrows
		0x2200, // Mathematical Operators
		0x2300, // Miscellaneous Technical
		0x2400, // Control Pictures
		0x2440, // Optical Character Recognition
		0x2460, // Enclosed Alphanumerics
		0x2500, // Box Drawing
		0x2580, // Block Elements
		0x25A0, // Geometric Shapes
		0x2600, // Miscellaneous Symbols
		0x2700, // Dingbats
		0x27C0, // Miscellaneous Mathematical Symbols-A
		0x27F0, // Supplemental Arrows-A
		0x2800, // Braille Patterns
		0x2900, // Supplemental Arrows-B
		0x2980, // Miscellaneous Mathematical Symbols-B
		0x2A00, // Supplemental Mathematical Operators
		0x2B00, // Miscellaneous Symbols and Arrows
		0x2C00, // unassigned
		0x2E80, // CJK Radicals Supplement
		0x2F00, // Kangxi Radicals
		0x2FE0, // unassigned
		0x2FF0, // Ideographic Description Characters
		0x3000, // CJK Symbols and Punctuation
		0x3040, // Hiragana
		0x30A0, // Katakana
		0x3100, // Bopomofo
		0x3130, // Hangul Compatibility Jamo
		0x3190, // Kanbun
		0x31A0, // Bopomofo Extended
		0x31C0, // unassigned
		0x31F0, // Katakana Phonetic Extensions
		0x3200, // Enclosed CJK Letters and Months
		0x3300, // CJK Compatibility
		0x3400, // CJK Unified Ideographs Extension A
		0x4DC0, // Yijing Hexagram Symbols
		0x4E00, // CJK Unified Ideographs
		0xA000, // Yi Syllables
		0xA490, // Yi Radicals
		0xA4D0, // unassigned
		0xAC00, // Hangul Syllables
		0xD7B0, // unassigned
		0xD800, // High Surrogates
		0xDB80, // High Private Use Surrogates
		0xDC00, // Low Surrogates
		0xE000, // Private Use
		0xF900, // CJK Compatibility Ideographs
		0xFB00, // Alphabetic Presentation Forms
		0xFB50, // Arabic Presentation Forms-A
		0xFE00, // Variation Selectors
		0xFE10, // unassigned
		0xFE20, // Combining Half Marks
		0xFE30, // CJK Compatibility Forms
		0xFE50, // Small Form Variants
		0xFE70, // Arabic Presentation Forms-B
		0xFF00, // Halfwidth and Fullwidth Forms
		0xFFF0, // Specials
		0x10000, // Linear B Syllabary
		0x10080, // Linear B Ideograms
		0x10100, // Aegean Numbers
		0x10140, // unassigned
		0x10300, // Old Italic
		0x10330, // Gothic
		0x10350, // unassigned
		0x10380, // Ugaritic
		0x103A0, // unassigned
		0x10400, // Deseret
		0x10450, // Shavian
		0x10480, // Osmanya
		0x104B0, // unassigned
		0x10800, // Cypriot Syllabary
		0x10840, // unassigned
		0x1D000, // Byzantine Musical Symbols
		0x1D100, // Musical Symbols
		0x1D200, // unassigned
		0x1D300, // Tai Xuan Jing Symbols
		0x1D360, // unassigned
		0x1D400, // Mathematical Alphanumeric Symbols
		0x1D800, // unassigned
		0x20000, // CJK Unified Ideographs Extension B
		0x2A6E0, // unassigned
		0x2F800, // CJK Compatibility Ideographs Supplement
		0x2FA20, // unassigned
		0xE0000, // Tags
		0xE0080, // unassigned
		0xE0100, // Variation Selectors Supplement
		0xE01F0, // unassigned
		0xF0000, // Supplementary Private Use Area-A
		0x100000 // Supplementary Private Use Area-B
		],

		// blocks: String []
		blocks : [ "BASIC_LATIN", "LATIN_1_SUPPLEMENT", "LATIN_EXTENDED_A", "LATIN_EXTENDED_B", "IPA_EXTENSIONS", "SPACING_MODIFIER_LETTERS",
				"COMBINING_DIACRITICAL_MARKS", "GREEK", "CYRILLIC", "CYRILLIC_SUPPLEMENTARY", "ARMENIAN", "HEBREW", "ARABIC", "SYRIAC", null, "THAANA", null,
				"DEVANAGARI", "BENGALI", "GURMUKHI", "GUJARATI", "ORIYA", "TAMIL", "TELUGU", "KANNADA", "MALAYALAM", "SINHALA", "THAI", "LAO", "TIBETAN",
				"MYANMAR", "GEORGIAN", "HANGUL_JAMO", "ETHIOPIC", null, "CHEROKEE", "UNIFIED_CANADIAN_ABORIGINAL_SYLLABICS", "OGHAM", "RUNIC", "TAGALOG",
				"HANUNOO", "BUHID", "TAGBANWA", "KHMER", "MONGOLIAN", null, "LIMBU", "TAI_LE", null, "KHMER_SYMBOLS", null, "PHONETIC_EXTENSIONS", null,
				"LATIN_EXTENDED_ADDITIONAL", "GREEK_EXTENDED", "GENERAL_PUNCTUATION", "SUPERSCRIPTS_AND_SUBSCRIPTS", "CURRENCY_SYMBOLS",
				"COMBINING_MARKS_FOR_SYMBOLS", "LETTERLIKE_SYMBOLS", "NUMBER_FORMS", "ARROWS", "MATHEMATICAL_OPERATORS", "MISCELLANEOUS_TECHNICAL",
				"CONTROL_PICTURES", "OPTICAL_CHARACTER_RECOGNITION", "ENCLOSED_ALPHANUMERICS", "BOX_DRAWING", "BLOCK_ELEMENTS", "GEOMETRIC_SHAPES",
				"MISCELLANEOUS_SYMBOLS", "DINGBATS", "MISCELLANEOUS_MATHEMATICAL_SYMBOLS_A", "SUPPLEMENTAL_ARROWS_A", "BRAILLE_PATTERNS",
				"SUPPLEMENTAL_ARROWS_B", "MISCELLANEOUS_MATHEMATICAL_SYMBOLS_B", "SUPPLEMENTAL_MATHEMATICAL_OPERATORS", "MISCELLANEOUS_SYMBOLS_AND_ARROWS",
				null, "CJK_RADICALS_SUPPLEMENT", "KANGXI_RADICALS", null, "IDEOGRAPHIC_DESCRIPTION_CHARACTERS", "CJK_SYMBOLS_AND_PUNCTUATION", "HIRAGANA",
				"KATAKANA", "BOPOMOFO", "HANGUL_COMPATIBILITY_JAMO", "KANBUN", "BOPOMOFO_EXTENDED", null, "KATAKANA_PHONETIC_EXTENSIONS",
				"ENCLOSED_CJK_LETTERS_AND_MONTHS", "CJK_COMPATIBILITY", "CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A", "YIJING_HEXAGRAM_SYMBOLS",
				"CJK_UNIFIED_IDEOGRAPHS", "YI_SYLLABLES", "YI_RADICALS", null, "HANGUL_SYLLABLES", null, "HIGH_SURROGATES", "HIGH_PRIVATE_USE_SURROGATES",
				"LOW_SURROGATES", "PRIVATE_USE_AREA", "CJK_COMPATIBILITY_IDEOGRAPHS", "ALPHABETIC_PRESENTATION_FORMS", "ARABIC_PRESENTATION_FORMS_A",
				"VARIATION_SELECTORS", null, "COMBINING_HALF_MARKS", "CJK_COMPATIBILITY_FORMS", "SMALL_FORM_VARIANTS", "ARABIC_PRESENTATION_FORMS_B",
				"HALFWIDTH_AND_FULLWIDTH_FORMS", "SPECIALS", "LINEAR_B_SYLLABARY", "LINEAR_B_IDEOGRAMS", "AEGEAN_NUMBERS", null, "OLD_ITALIC", "GOTHIC", null,
				"UGARITIC", null, "DESERET", "SHAVIAN", "OSMANYA", null, "CYPRIOT_SYLLABARY", null, "BYZANTINE_MUSICAL_SYMBOLS", "MUSICAL_SYMBOLS", null,
				"TAI_XUAN_JING_SYMBOLS", null, "MATHEMATICAL_ALPHANUMERIC_SYMBOLS", null, "CJK_UNIFIED_IDEOGRAPHS_EXTENSION_B", null,
				"CJK_COMPATIBILITY_IDEOGRAPHS_SUPPLEMENT", null, "TAGS", null, "VARIATION_SELECTORS_SUPPLEMENT", null, "SUPPLEMENTARY_PRIVATE_USE_AREA_A",
				"SUPPLEMENTARY_PRIVATE_USE_AREA_B" ],

		blocksEnum : {
			BASIC_LATIN : "BASIC_LATIN",
			LATIN_1_SUPPLEMENT : "LATIN_1_SUPPLEMENT",
			LATIN_EXTENDED_A : "LATIN_EXTENDED_A",
			LATIN_EXTENDED_B : "LATIN_EXTENDED_B",
			HEBREW : "HEBREW",
			ARABIC : "ARABIC",
			DEVANAGARI : "DEVANAGARI",
			BENGALI : "BENGALI",
			GURMUKHI : "GURMUKHI",
			GUJARATI : "GUJARATI",
			ORIYA : "ORIYA",
			TAMIL : "TAMIL",
			TELUGU : "TELUGU",
			KANNADA : "KANNADA",
			MALAYALAM : "MALAYALAM",
			THAI : "THAI",
			LAO : "LAO",
			TIBETAN : "TIBETAN",
			MYANMAR : "MYANMAR",
			ETHIOPIC : "ETHIOPIC",
			KHMER : "KHMER",
			MONGOLIAN : "MONGOLIAN",
			LATIN_EXTENDED_ADDITIONAL : "LATIN_EXTENDED_ADDITIONAL"
		},

		unicodeBlockOf : function(/* char */c) {
			// summary:
			// Returns the representation of the Unicode block
			// containing the
			// given character, or if the character is not a
			// member of a defined block.
			// c: char
			// The passed character
			// return:
			// Returns the representation of the Unicode block.

			return this.ofUnicodeCodePoint(c.charCodeAt(0));
		},

		ofUnicodeCodePoint : function(/* int */codePoint) {
			// summary:
			// Returns the representation of the Unicode block
			// containing the
			// given character, or if the character is not a
			// member of a defined block.
			// codePoint: int
			// The passed unicode code point

			var top;
			var bottom;
			var current;
			bottom = 0;
			top = this.blockStarts.length;
			current = parseInt(top / 2);
			// invariant: top > current >= bottom && codePoint
			// >= unicodeBlockStarts[bottom]
			while (top - bottom > 1) {
				if (codePoint >= this.blockStarts[current]) {
					bottom = current;
				} else {
					top = current;
				}
				current = parseInt((top + bottom) / 2);
			}
			return this.blocks[current];
		},

		getRanges : function() {
			// summary:
			// Return an integer representing all the languages
			// for which this shaper will shape.
			// The result is taken by "or"ing together the
			// constants representing the various languages

			return this.mask & this.ALL_RANGES;
		},

		isContextual : function() {
			// summary:
			// Return true if this shaper is contextual, false
			// if it is not.
			return this.mask > 0;
		},

		shape : function(/* String */text, /* int */start, /* int */
		count) {
			// summary:
			// Shape the text in the given string.
			// text: String
			// the text to be shaped
			// start: int
			// the index of the starting
			// count: int
			// number of charcters in the array

			return this.shapeWithContext(text, start, count, 1 << this.key);
		},

		classify : function(/* String */b) {
			// summary:
			// Given a unicode block object, return
			// corresponding language constant.
			// If the block is not recognized, returns zero.
			// Note that as there is no separate ARABIC block in
			// Character,
			// this case must be specially handled by the
			// caller; EASTERN_ARABIC is preferred
			// when both are specified.
			// b: String
			// unicode block that will be classified
			// return:
			// the language constant, or zero if not recognized
			if (b == null) {
				return 0;
			}
			// ARABIC is handled by the caller; from testing we
			// know
			// that EASTERN_ARABIC takes precedence.
			switch (b) {
			case this.blocksEnum.ARABIC:
				return this.EASTERN_ARABIC;
			case this.blocksEnum.BENGALI:
				return this.BENGALI;
			case this.blocksEnum.DEVANAGARI:
				return this.DEVANAGARI;
			case this.blocksEnum.ETHIOPIC:
				return this.ETHIOPIC;
			case this.blocksEnum.BASIC_LATIN:
			case this.blocksEnum.LATIN_1_SUPPLEMENT:
			case this.blocksEnum.LATIN_EXTENDED_A:
			case this.blocksEnum.LATIN_EXTENDED_ADDITIONAL:
			case this.blocksEnum.LATIN_EXTENDED_B:
				return this.EUROPEAN;
			case this.blocksEnum.GUJARATI:
				return this.GUJARATI;
			case this.blocksEnum.GURMUKHI:
				return this.GURMUKHI;
			case this.blocksEnum.KANNADA:
				return this.KANNADA;
			case this.blocksEnum.KHMER:
				return this.KHMER;
			case this.blocksEnum.LAO:
				return this.LAO;
			case this.blocksEnum.MALAYALAM:
				return this.MALAYALAM;
			case this.blocksEnum.MONGOLIAN:
				return this.MONGOLIAN;
			case this.blocksEnum.MYANMAR:
				return this.MYANMAR;
			case this.blocksEnum.ORIYA:
				return this.ORIYA;
			case this.blocksEnum.TAMIL:
				return this.TAMIL;
			case this.blocksEnum.TELUGU:
				return this.TELUGU;
			case this.blocksEnum.THAI:
				return this.THAI;
			case this.blocksEnum.TIBETAN:
				return this.TIBETAN;
			}
			return 0;
		},

		bitCount : function(/* int */num) {
			// summary:
			// counts the number of one-bits
			// num: int
			// The integer will be passed
			// return:
			// returns the sum of one-bits.
			if (num == 0) {
				return 0;
			}
			var K = 1;
			while ((num &= num - 1) != 0) {
				K++;
			}
			return K;
		},

		numberOfTrailingZeros : function(/* int */i) {
			// summary:
			// This method returns the number of zero bits
			// preceding the highest-order ("leftmost") one-bit
			// in the two's complement binary representation of
			// the specified int value,
			// or 32 if the value is equal to zero.
			// i: int
			// The integer will be passed
			// return:
			// the number of zero bits preceding the
			// highest-order ("leftmost") one-bit in the two's
			// complement binary representation

			var y;
			if (i == 0) {
				return 32;
			}
			var n = 31;
			y = i << 16;
			if (y != 0) {
				n = n - 16;
				i = y;
			}
			y = i << 8;
			if (y != 0) {
				n = n - 8;
				i = y;
			}
			y = i << 4;
			if (y != 0) {
				n = n - 4;
				i = y;
			}
			y = i << 2;
			if (y != 0) {
				n = n - 2;
				i = y;
			}
			return n - ((i << 1) >>> 31);
		},

		shapeNominal : function(/* string */text) {
			// summary:
			// Shape the given string to European
			// text: String
			// the text to be shaped
			// return:
			// the shaped string in European format

			var textArr = text.split("");
			var c = '';
			for ( var i = 0; i < text.length; ++i) {
				c = textArr[i];

				if (c >= '\u0660' && c <= '\u0669') {
					switch (c) {
					case '\u0660':
						c = '0';
						break;
					case '\u0661':
						c = '1';
						break;
					case '\u0662':
						c = '2';
						break;
					case '\u0663':
						c = '3';
						break;
					case '\u0664':
						c = '4';
						break;
					case '\u0665':
						c = '5';
						break;
					case '\u0666':
						c = '6';
						break;
					case '\u0667':
						c = '7';
						break;
					case '\u0668':
						c = '8';
						break;
					case '\u0669':
						c = '9';
						break;
					}
				}
				textArr[i] = c;
			}
			return textArr;
		},

		shapeWith : function(/* String */shaperValue, /* String */
		text) {
			// summary:
			// Shape the given text depends on the given shaper
			// value
			// shaperValue: String
			// the value of the shaper (National , Contextual,
			// Nominal)
			// text: String
			// the text to be shaped
			// return:
			// the shaped string

			if (shaperValue == "National") {
				return this.shape(text, 0, text.length);
			} else if (shaperValue == "Contextual") {
				var textArr = this.shapeNominal(text);
				return this.shape(textArr.join(""), 0, textArr.join("").length);
			} else if (shaperValue == "Nominal") {
				return this.shapeNominal(text);
			}
		},

		shapeWithContext : function(/* string */text, /* int */
		start, /* int */count, /* int */context) {
			// summary:
			// Shape the given text, using the indicated initial
			// context.
			// If this shaper is not a contextual shaper, then
			// the given context will be ignored
			// text: string
			// Text to be shaped
			// start: int
			// The index of the first character of the text to
			// shape
			// count: int
			// The number of characters to shape in the text
			// context: int
			// The intial context

			var textArr = text.split("");

			currentContext = 0;
			if (this.isContextual()) {
				if (this.bitCount(context) != 1 || (context & ~this.ALL_RANGES) != 0) {
					throw "IllegalArgumentException";
				}
				// If the indicated context is not one we are
				// handling, reset it.
				if ((context & this.mask) == 0) {
					currentContext = -1;
				} else {
					currentContext = this.numberOfTrailingZeros(context);
				}
			} else {
				currentContext = this.key;
			}

			for ( var i = 0; i < count; ++i) {
				var c = textArr[start + i];
				if (c != ' ') {
					if (c >= '0' && c <= '9') {
						if (currentContext >= 0) {
							// Shape into the current context.
							if (c == '0' && ((1 << currentContext) == this.TAMIL || (1 << currentContext) == this.ETHIOPIC)) {
								// No digit 0 in this context;
								// do nothing.
							} else {
								textArr[start + i] = String.fromCharCode(this.zeroDigitsArray[currentContext].charCodeAt(0) + parseInt(c));
							}
						}
					} else if (this.isContextual()) {
						// if c is in a group, set
						// currentContext; else reset it.
						var group = this.classify(this.unicodeBlockOf(c));
						// Specially handle ARABIC.
						if (group == this.EASTERN_ARABIC && (this.mask & this.EASTERN_ARABIC) == 0 && (this.mask & this.ARABIC) != 0)
							group = this.ARABIC;
						if (group == this.EUROPEAN) {
							if ((c >= '\u0041' && c <= '\u005A') || (c >= '\u0061' && c <= '\u007A')) {
								currentContext = -1;
							}
						}
						if ((this.mask & group) != 0) {
							// The character was classified as
							// being in a group
							// we recognize, and it was selected
							// by the shaper.
							// So, change the context.
							currentContext = this.numberOfTrailingZeros(group);
						}
					}
				}
			}
			return textArr;
		},

		shapeOnCtrl : function(/* String */shaperValue, /* String */
		text, /* Boolean */isRight) {
			if (shaperValue == "Contextual") {
				this.mask = 2;

				if (text != "") {
					var textArr = text.split("");

					for ( var i = 0; i < textArr.length; i++) {
						var c = textArr[i];
						if (c != ' ') {
							if (isRight) {
								if (c >= '0' && c <= '9') {
									textArr[i] = String.fromCharCode(this.zeroDigitsArray[1].charCodeAt(0) + parseInt(c));
								} else if (this.isContextual()) {
									return textArr.join("");
								}
							} else if (!isRight) {
								if (c >= '\u0660' && c <= '\u0669') {
									textArr[i] = this.shapeNominal(textArr[i]);
								} else if (this.isContextual()) {
									return textArr.join("");
								}
							}
						}
					}
					return textArr.join("");
				}
			}
			return text;
		},

		getDefaultContextualShaper : function(/* int */ranges) {
			// summary:
			// Return a default contextual shaper which can
			// shape to any of the indicated languages.
			// The default initial vacontext for this shaper is
			// EUROPEAN.
			// ranges: int
			// the ranges to shape

			if ((ranges & ~this.ALL_RANGES) != 0) {
				throw "IllegalArgumentException -- argument out of range";
			}
			this.key = this.numberOfTrailingZeros(this.EUROPEAN);
			this.mask = ranges;
		},

		getContextualShaper : function(/* int */ranges, /* int */
		defaultContext) {
			// summary:
			// Return a contextual shaper which can shape to any
			// of the indicated languages.
			// The default initial context for this shaper is
			// given as an argument.
			// ranges: int
			// The ranges to shape
			// defaultContext: int
			// the default initial context

			if (this.bitCount(defaultContext) != 1) {
				throw "IllegalArgumentException -- more than one bit set in context";
			}
			if ((ranges & ~this.ALL_RANGES) != 0 || (defaultContext & ~this.ALL_RANGES) != 0) {
				throw "IllegalArgumentException -- argument out of range";
			}
			this.key = this.numberOfTrailingZeros(defaultContext);
			this.mask = ranges;
		},

		getShaper : function(/* int */singleRange) {
			// summary:
			// Return a non-contextual shaper for the passed
			// single range (language)
			// which can shape to a single range.
			// All ASCII digits in the input text are translated
			// to this language
			// singleRange: int
			// The target language

			if (this.bitCount(singleRange) != 1) {
				throw "IllegalArgumentException -- more than one bit set in argument";
			}
			if ((singleRange & ~this.ALL_RANGES) != 0) {
				throw "IllegalArgumentException -- argument out of range";
			}
			this.key = this.numberOfTrailingZeros(singleRange);
			this.mask = this.INT_MIN_VALUE | singleRange;
		}

	});
});