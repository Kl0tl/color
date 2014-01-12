/* TODO hsv support ?

 1 void hsv_to_hsl(double h, double s, double v,
 2 double* hh, double* ss, double *ll)
 3 {
 4     *hh = h;
 5     *ll = (2 - s) * v;
 6     *ss = s * v;
 7     *ss /= (*ll <= 1) ? (*ll) : 2 - (*ll);
 8     *ll /= 2;
 9 }
10
11 void hsl_to_hsv(double hh, double ss, double ll,
12 double* h, double* s, double *v)
13 {
14     *h = hh;
15     ll *= 2;
16     ss *= (ll <= 1) ? ll : 2 - ll;
17     *v = (ll + ss) / 2;
18     *s = (2 * ss) / (ll + ss);
19 }

*/

! function (factory, root) {
	if (typeof define === 'function' && define.amd) {
		define(function () { return factory(root); });
	} else if (typeof module === 'object' && module && module.exports) {
		module.exports = factory(root);
	} else if (typeof exports === 'object' && exports) {
		exports.color = factory(root);
	} else {
		root.color = factory(root);
	}
}(function (root) {
	'use strict';

	var HSL_OBJECT = {h: 0, s: 0, l: 0},

		HEX3 = /^\s*#([0-9a-f])([0-9a-f])([0-9a-f])\s*$/,
		HEX6 = /^\s*#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})\s*$/,

		RGB255 = /^\s*rgb\(\s*(-?[0-9]+(?:\.[0-9]+)?)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?)\s*\)\s*$/,
		RGB100 = /^\s*rgb\(\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*\)\s*$/,

		RGBA255 = /^\s*rgba\(\s*(-?[0-9]+(?:\.[0-9]+)?)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?)\s*\)\s*$/,
		RGBA100 = /^\s*rgba\(\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?)\s*\)\s*$/,

		HSL = /^\s*hsl\(\s*(-?[0-9]+(?:\.[0-9]+)?)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*\)\s*$/,
		HSLA = /^\s*hsla\(\s*(-?[0-9]+(?:\.[0-9]+)?)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?%)\s*,\s*(-?[0-9]+(?:\.[0-9]+)?)\)\s*$/;


	function color(x) {
		return new Color(x);
	}


	color.rgb = function rgb(r, g, b) {
		return color.rgba(r, g, b, 1);
	};

	color.rgba = function rgba(r, g, b, a) {
		a = clamp(parsePercent(a, 1), 0, 1);
		r = clamp(parsePercent(r, 255), 0, 255) * a;
		g = clamp(parsePercent(g, 255), 0, 255) * a;
		b = clamp(parsePercent(b, 255), 0, 255) * a;

		return (r << 16) + (g << 8) + b;
	};

	color.float3 = function float3(r, g, b) {
		return color.rgba(r * 255, g * 255, b * 255, 1);
	};

	color.float4 = function float4(r, g, b, a) {
		return color.rgba(r * 255, g * 255, b * 255, a);
	};

	color.hsl = function hsl(h, s, l) {
		return color.hsla(h, s, l, 1);
	};

// from http://en.wikipedia.org/wiki/HSL_and_HSV
	color.hsla = function hsla(h, s, l, a) {
		h = clampDegrees(parsePercent(h, 360)) / 60;
		s = clamp(parsePercent(s, 1), 0, 1);
		l = clamp(parsePercent(l, 1), 0, 1);

		var chroma = (1 - Math.abs(2 * l - 1)) * s,
			x = chroma * (1 - Math.abs(h % 2 - 1)),
			m = l - chroma * 0.5,
			r = 0, g = 0, b = 0;

		if (h < 1) {
			r = chroma; g = x;
		} else if (h < 2) {
			r = x; g = chroma;
		} else if (h < 3) {
			g = chroma; b = x;
		} else if (h < 4) {
			g = x; b = chroma;
		} else if (h < 5) {
			r = x; b = chroma;
		} else if (h < 6) {
			r = chroma; b = x;
		}

		return color.rgba(r + m, g + m, b + m, a);
	};

/* http://www.w3.org/TR/css3-color/#hsl-color
	color.hsla = function hsla(h, s, l, a) {
		h = clampDegrees(parsePercent(h, 360)) / 60;
		s = clamp(parsePercent(s, 1), 0, 1);
		l = clamp(parsePercent(l, 1), 0, 1);

		var m1, m2, r, g, b;

		if (l <= 0.5) m2 = l * (s + 1);
		else m2 = l + s - l * s;

		m1 = l * 2 - m2;

		if (s === 0) {
			r = g = b = l;
		} else {
			r = hue2rgb(h + 1 / 3, m1, m2);
			g = hue2rgb(h, m1, m2);
			b = hue2rgb(h - 1 / 3, m1, m2);
		}

		return color.rgba(r * 255, g * 255, b * 255, a);
	};

	function hue2rgb(h, m1, m2) {
		if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;

		if (h * 2 < 1) return m2;

		if (h * 3 < 2) return m1 + (m2 - m1) * (2 / 3 - h) * 6;

		return m1;
	}
//*/

	color.css = function css(style) {
		style = style.toLowerCase();

		if (NAMES_TO_HEX.hasOwnProperty(style)) {
			return NAMES_TO_HEX[style];
		}

		var matches;

		if ((matches = style.match(HEX3)) || (matches = style.match(HEX6))) {
			return color.rgba(parseInt(matches[1], 16), parseInt(matches[2], 16), parseInt(matches[3], 16), 1);
		}

		if ((matches = style.match(RGB255)) || (matches = style.match(RGB100))) {
			return color.rgba(matches[1], matches[2], matches[3], 1);
		}

		if ((matches = style.match(RGBA255)) || (matches = style.match(RGBA100))) {
			return color.rgba(matches[1], matches[2], matches[3], matches[4]);
		}

		if ((matches = style.match(HSL))) {
			return color.hsla(matches[1], matches[2], matches[3], 1);
		}

		if ((matches = style.match(HSLA))) {
			return color.hsla(matches[1], matches[2], matches[3], matches[4]);
		}

		return 0;
	};


	color.red = function red(hex, amount) {
		if (amount === undefined) {
			return Math.max(hex, 0) >> 16 & 0xff;
		}

		hex = clamp(hex, 0, 0xffffff);
		amount = clamp(parsePercent(amount, 255), 0, 255);

		return ((hex ^ 0xff0000) + amount) | 0;
	};

	color.green = function green(hex, amount) {
		if (amount === undefined) {
			return Math.max(hex, 0) >> 8 & 0xff;
		}

		hex = clamp(hex, 0, 0xffffff);
		amount = clamp(parsePercent(amount, 255), 0, 255);

		return ((hex ^ 0x00ff00) + amount) | 0;
	};

	color.blue = function blue(hex, amount) {
		if (amount === undefined) {
			return Math.max(hex, 0) & 0xff;
		}

		hex = clamp(hex, 0, 0xffffff);
		amount = clamp(parsePercent(amount, 255), 0, 255);

		return ((hex ^ 0x0000ff) + amount) | 0;
	};

	color.hue = function hue(hex, amount) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff);

		if (amount === undefined) {
			return hsl.h;
		}

		return color.hsla(amount, hsl.s, hsl.l, 1);
	};

	color.saturation = function saturation(hex, amount) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff);

		if (amount === undefined) {
			return hsl.h;
		}

		return color.hsla(hsl.h, amount, hsl.l, 1);
	};

	color.lightness = function lightness(hex, amount) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff);

		if (amount === undefined) {
			return hsl.h;
		}

		return color.hsla(hsl.h, hsl.s, amount, 1);
	};

	color.grayscale = function grayscale(hex, amount) {
		if (hex < 0) return 0;

		var r = hex >> 16 & 0xff,
			g = hex >> 8 & 0xff,
			b = hex & 0xff;

		if (amount === undefined) {
			return (r + g + b) / 3;
		}

		amount = clamp(parsePercent(amount, 255), 0, 255);

		return (amount << 16) + (amount << 8) + amount;
	};

	color.greyscale = color.grayscale;

	color.luminance601 = function luminance601(hex, amount) {
		if (hex < 0) return 0;

		var r = hex >> 16 & 0xff,
			g = hex >> 8 & 0xff,
			b = hex & 0xff;

		if (amount === undefined) {
			return (r * 0.3 + g * 0.59 + b * 0.11) / 255;
		}

		amount = clamp(parsePercent(amount, 255), 0, 255);

		return (amount * 0.3 << 16) + (amount * 0.59 << 8) + amount * 0.11;
	};

	color.luminance709 = function luminance709(hex, amount) {
		if (hex < 0) return 0;

		var r = hex >> 16 & 0xff,
			g = hex >> 8 & 0xff,
			b = hex & 0xff;

		if (amount === undefined) {
			return (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
		}

		amount = clamp(parsePercent(amount, 255), 0, 255);

		return (amount * 0.2126 << 16) + (amount * 0.7152 << 8) + amount * 0.0722;
	};

	color.luminance = color.luminance709;


	color.rotate = function rotate(hex, amount) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff),
			h = hsl.h + parsePercent(amount, 360);

		return color.hsla(h, hsl.s, hsl.l, 1);
	};

	color.saturate = function saturate(hex, amount) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff),
			s = hsl.s + parsePercent(amount, 1);

		return color.hsla(hsl.h, s, hsl.l, 1);
	};

	color.desaturate = function desaturate(hex, amount) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff),
			s = hsl.s - parsePercent(amount, 1);

		return color.hsla(hsl.h, s, hsl.l, 1);
	};

	color.lighten = function lighten(hex, amount) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff),
			l = hsl.l + parsePercent(amount, 1);

		return color.hsla(hsl.h, hsl.s, l, 1);
	};

	color.darken = function darken(hex, amount) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff),
			l = hsl.l - parsePercent(amount, 1);

		return color.hsla(hsl.h, hsl.s, l, 1);
	};


	color.blend = function blend(from, to, w) {
		if (from < 0) from = 0;
		if (to < 0) to = 0;

		if (w === undefined) return to;

		w = clamp(parsePercent(w, 1), 0, 1);

		var r = (from >> 16 & 0xff) * (1 - w) + (to >> 16 & 0xff) * w,
			g = (from >> 8 & 0xff) * (1 - w) + (to >> 8 & 0xff) * w,
			b = (from & 0xff) * (1 - w) + (to & 0xff) * w;

		return (r << 16) + (g << 8) + b;
	};

	color.sepia = function sepia(hex, w) {
		if (hex < 0) hex = 0;

		var r = hex >> 16 & 0xff,
			g = hex >> 8 & 0xff,
			b = hex & 0xff,
			sepiaR = (r * 0.393 + g * 0.769 + b * 0.189) | 0,
			sepiaG = (r * 0.349 + g * 0.686 + b * 0.168) | 0,
			sepiaB = (r * 0.272 + g * 0.534 + b * 0.131) | 0;

		return color.blend(hex, (sepiaR << 16) + (sepiaG << 8) + sepiaB, w);
	};

	color.invert = function invert(hex, w) {
		return color.blend(hex, ~Math.max(hex, 0) & 0xffffff, w);
	};

	color.tint = function tint(hex, w) {
		return color.blend(hex, 0xffffff, w);
	};

	color.shade = function shade(hex, w) {
		return color.blend(hex, 0, w);
	};

	color.tone = function tone(hex, w) {
		return color.blend(hex, 0x7f7f7f, w);
	};


	color.gammaToLinear = function gammaToLinear(hex, e) {
		if (hex < 0) return 0;

		if (e === undefined) e = 2.2;

		var r = Math.pow(hex >> 16 & 0xff, e),
			g = Math.pow(hex >> 8 & 0xff, e),
			b = Math.pow(hex & 0xff, e);

		return (r << 16) + (g << 8) + b;
	};

	color.linearToGamma = function linearToGamma(hex, e) {
		if (e === undefined) e = 2.2;

		return color.gammaToLinear(hex, 1 / e);
	};


	color.isColor = function isColor(x) {
		return x instanceof Color;
	};


	color.define = function define(name, x) {
		if (x instanceof Color) x = x._hex;

		NAMES_TO_HEX[name] = x;
		HEX_TO_NAMES[x] = name;
	};

	color.undefine = function undefine(name) {
		if (!color.isdef(name)) return false;

		var hex = NAMES_TO_HEX[name];

		delete NAMES_TO_HEX[name];
		delete HEX_TO_NAMES[hex];

		return true;
	};

	color.isDefined = function isDefined(x) {
		return (isString(x) ? NAMES_TO_HEX.hasOwnProperty(name) : HEX_TO_NAMES.hasOwnProperty(x));
	};


	color.toName = function name(hex) {
		return (color.isdef(hex) ? HEX_TO_NAMES[hex] : '');
	};

	color.toHexString = function toHexString(hex) {
		return '#' + padr((hex & 0xffffff).toString(16) || 0, 6, '0');
	};

	color.toRgbString = function toRgbString(hex) {
		if (hex < 0) hex = 0;

		var r = hex >> 16 & 0xff,
			g = hex >> 8 & 0xff,
			b = hex & 0xff;

		return 'rgb(' + r + ', ' + g + ', ' + b + ')';
	};

	color.toRgbaString = function toRgbaString(hex, alpha) {
		if (hex < 0) hex = 0;

		var r = hex >> 16 & 0xff,
			g = hex >> 8 & 0xff,
			b = hex & 0xff,
			a = clamp(parsePercent(alpha, 1), 0, 1);

		return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
	};

	color.toHslString = function toHslString(hex) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff);

		return 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
	};

	color.toHslaString = function toHslaString(hex, alpha) {
		if (hex < 0) hex = 0;

		var hsl = rgb2hsl(hex >> 16 & 0xff, hex >> 8 & 0xff, hex & 0xff),
			a = clamp(parsePercent(alpha, 1), 0, 1);

		return 'hsla(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%, ' + a + ')';
	};


	function Color(x) {
		if (x instanceof Color) this._hex = x._hex;
		else this._hex = clamp(x, 0, 0xffffff) | 0;
	}


	Color.prototype = color.fn = {

		constructor: Color,

		clone: function clone() {
			return new Color(this);
		},

		hex: function hex(x) {
			if (x === undefined) return this._hex;

			if (x instanceof Color) return x.clone();

			var _hex = clamp(x, 0, 0xffffff) | 0;

			return new Color(_hex);
		},

		equals: function equals(x) {
			if (x instanceof Color) x = x._hex;

			return (this._hex === x);
		},

		rgb: function rgb(r, g, b) {
			var _hex = color.rgba(r, g, b, 1);

			return new Color(_hex);
		},

		rgba: function rgba(r, g, b, a) {
			var _hex = color.rgba(r, g, b, a);

			return new Color(_hex);
		},

		hsl: function hsl(h, s, l) {
			var _hex = color.hsla(h, s, l, 1);

			return new Color(_hex);
		},

		hsla: function hsla(h, s, l, a) {
			var _hex = color.hsla(h, s, l, a);

			return new Color(_hex);
		},

		css: function css(style) {
			var _hex = color.css(style);

			return new Color(_hex);
		},


		red: function red(amount) {
			var x = color.red(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		green: function green(amount) {
			var x = color.green(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		blue: function blue(amount) {
			var x = color.blue(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		hue: function hue(amount) {
			var x = color.hue(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		saturation: function saturation(amount) {
			var x = color.saturation(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		lightness: function lightness(amount) {
			var x = color.lightness(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		grayscale: function grayscale(amount) {
			var x = color.grayscale(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		greyscale: function greyscale(amount) {
			var x = color.greyscale(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		luminance601: function luminance601(amount) {
			var x = color.luminance601(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		luminance709: function luminance709(amount) {
			var x = color.luminance709(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},

		luminance: function luminance(amount) {
			var x = color.luminance(this._hex, amount);

			if (amount === undefined) return x;

			return new Color(x);
		},


		rotate: function rotate(amount) {
			var _hex = color.rotate(this._hex, amount);

			return new Color(_hex);
		},

		saturate: function saturate(amount) {
			var _hex = color.saturate(this._hex, amount);

			return new Color(_hex);
		},

		desaturate: function desaturate(amount) {
			var _hex = color.desaturate(this._hex, amount);

			return new Color(_hex);
		},

		lighten: function lighten(amount) {
			var _hex = color.lighten(this._hex, amount);

			return new Color(_hex);
		},

		darken: function darken(amount) {
			var _hex = color.darken(this._hex, amount);

			return new Color(_hex);
		},


		blend: function blend(to, w) {
			if (to instanceof Color) to = to._hex;

			var _hex = color.blend(this._hex, to, w);

			return new Color(_hex);
		},

		sepia: function sepia(w) {
			var _hex = color.sepia(this._hex, w);

			return new Color(_hex);
		},

		invert: function invert(w) {
			var _hex = color.blend(this._hex, ~Math.max(this._hex, 0) & 0xffffff, w);

			return new Color(_hex);
		},

		tint: function tint(w) {
			var _hex = color.blend(this._hex, 0xffffff, w);

			return new Color(_hex);
		},

		shade: function shade(w) {
			var _hex = color.blend(this._hex, 0, w);

			return new Color(_hex);
		},

		tone: function tone(w) {
			var _hex = color.blend(this._hex, 0x7f7f7f, w);

			return new Color(_hex);
		},


		gammaToLinear: function gammaToLinear(e) {
			var _hex = color.gammaToLinear(this._hex, e);

			return new Color(_hex);
		},

		linearToGamma: function linearToGamma(e) {
			if (e === undefined) e = 2.2;

			var _hex = color.gammaToLinear(this._hex, 1 / e);

			return new Color(_hex);
		},


		toName: function toName() {
			return color.toName(this._hex);
		},

		toRgbString: function toRgbString() {
			return color.toRgbString(this._hex);
		},

		toRgbaString: function toRgbaString(alpha) {
			return color.toRgbaString(this._hex, alpha);
		},

		toHslString: function toHslString() {
			return color.toHslString(this._hex);
		},

		toHslaString: function toHslaString(alpha) {
			return color.toHslaString(this._hex, alpha);
		},

		toString: function toString(format, alpha) {
			switch (format) {
				case 'name':
					return color.toName(this._hex);
				case 'rgb':
					return color.toRgbString(this._hex);
				case 'rgba':
					return color.toRgbaString(this._hex, alpha);
				case 'hsl':
					return color.toHslString(this._hex);
				case 'hsla':
					return color.toHslaString(this._hex, alpha);
				case 'hex':
					return color.toHexString(this._hex);
				default:
					return Object.prototype.toString.apply(this, arguments);
			}
		}

	};


// from http://www.w3.org/TR/css3-color/#svg-color
	var NAMES_TO_HEX = {
			aliceblue:						15792383,
			antiquewhite:					16444375,
			aqua:									65535,
			aquamarine:						8388564,
			azure:								15794175,
			beige:								16119260,
			bisque:								16770244,
			black:								0,
			blanchedalmond:				16772045,
			blue:									255,
			blueviolet:						9055202,
			brown:								10824234,
			burlywood:						14596231,
			cadetblue:						6266528,
			chartreuse:						8388352,
			chocolate:						13789470,
			coral:								16744272,
			cornflowerblue:				6591981,
			cornsilk:							16775388,
			crimson:							14423102,
			cyan:									65535,
			darkblue:							139,
			darkcyan:							35723,
			darkgoldenrod:				12092939,
			darkgray:							11119017,
			darkgreen:						25600,
			darkgrey:							11119017,
			darkkhaki:						12433259,
			darkmagenta:					9109643,
			darkolivegreen:				5597999,
			darkorange:						16747520,
			darkorchid:						10040012,
			darkred:							9109504,
			darksalmon:						15308410,
			darkseagreen:					9419919,
			darkslateblue:				4734347,
			darkslategray:				3100495,
			darkslategrey:				3100495,
			darkturquoise:				52945,
			darkviolet:						9699539,
			deeppink:							16716947,
			deepskyblue:					49151,
			dimgray:							6908265,
			dimgrey:							6908265,
			dodgerblue:						2003199,
			firebrick:						11674146,
			floralwhite:					16775920,
			forestgreen:					2263842,
			fuchsia:							16711935,
			gainsboro:						14474460,
			ghostwhite:						16316671,
			gold:									16766720,
			goldenrod:						14329120,
			gray:									8421504,
			green:								32768,
			greenyellow:					11403055,
			grey:									8421504,
			honeydew:							15794160,
			hotpink:							16738740,
			indianred:						13458524,
			indigo:								4915330,
			ivory:								16777200,
			khaki:								15787660,
			lavender:							15132410,
			lavenderblush:				16773365,
			lawngreen:						8190976,
			lemonchiffon:					16775885,
			lightblue:						11393254,
			lightcoral:						15761536,
			lightcyan:						14745599,
			lightgoldenrodyellow:	16448210,
			lightgray:						13882323,
			lightgreen:						9498256,
			lightgrey:						13882323,
			lightpink:						16758465,
			lightsalmon:					16752762,
			lightseagreen:				2142890,
			lightskyblue:					8900346,
			lightslategray:				7833753,
			lightslategrey:				7833753,
			lightsteelblue:				11584734,
			lightyellow:					16777184,
			lime:									65280,
			limegreen:						3329330,
			linen:								16445670,
			magenta:							16711935,
			maroon:								8388608,
			mediumaquamarine:			6737322,
			mediumblue:						205,
			mediumorchid:					12211667,
			mediumpurple:					9662683,
			mediumseagreen:				3978097,
			mediumslateblue:			8087790,
			mediumspringgreen:		64154,
			mediumturquoise:			4772300,
			mediumvioletred:			13047173,
			midnightblue:					1644912,
			mintcream:						16121850,
			mistyrose:						16770273,
			moccasin:							16770229,
			navajowhite:					16768685,
			navy:									128,
			oldlace:							16643558,
			olive:								8421376,
			olivedrab:						7048739,
			orange:								16753920,
			orangered:						16729344,
			orchid:								14315734,
			palegoldenrod:				15657130,
			palegreen:						10025880,
			paleturquoise:				11529966,
			palevioletred:				14381203,
			papayawhip:						16773077,
			peachpuff:						16767673,
			peru:									13468991,
			pink:									16761035,
			plum:									14524637,
			powderblue:						11591910,
			purple:								8388736,
			red:									16711680,
			rosybrown:						12357519,
			royalblue:						4286945,
			saddlebrown:					9127187,
			salmon:								16416882,
			sandybrown:						16032864,
			seagreen:							3050327,
			seashell:							16774638,
			sienna:								10506797,
			silver:								12632256,
			skyblue:							8900331,
			slateblue:						6970061,
			slategray:						7372944,
			slategrey:						7372944,
			snow:									16775930,
			springgreen:					65407,
			steelblue:						4620980,
			tan:									13808780,
			teal:									32896,
			thistle:							14204888,
			tomato:								16737095,
			transparent:					0,
			turquoise:						4251856,
			violet:								15631086,
			wheat:								16113331,
			white:								16777215,
			whitesmoke:						16119285,
			yellow:								16776960,
			yellowgreen:					10145074
		},
		HEX_TO_NAMES = {};

	for (var name in NAMES_TO_HEX) {
		HEX_TO_NAMES[NAMES_TO_HEX[name]] = name;
	}


	return color;


	function clamp(x, min, max) {
		return x > max ? max : x < min ? min : x;
	}

	function clampDegrees(x) {
		return ((x % 360) + 360) % 360;
	}

	function padr(str, length, c) {
		var delta = length - str.length;

		if (delta > 0) {
			while (delta--) str += c;
		}

		return str;
	}

	function isString(x) {
		return '[object String]' === Object.prototype.toString.call(x);
	}

	function parsePercent(amount, x) {
		if (isString(amount) && amount.indexOf('%') > -1) {
			return parseInt(amount, 10) / 100 * x || 0;
		}

		if (isNaN(amount)) return 0;

		return +amount;
	}

// from http://en.wikipedia.org/wiki/HSL_and_HSV
	function rgb2hsl(r, g, b) {
		var min = Math.min(r, g, b),
			max = Math.max(r, g, b),
			chroma = max - min,
			hsl = HSL_OBJECT;

		hsl.l = 0.5 * (max + min);

		if (chroma === 0) {
			hsl.h = hsl.s = 0;
		} else {
			if (max === r) hsl.h = (g - b) / chroma % 6;
			else if (max === g) hsl.h = (b - r) / chroma + 2;
			else if (max === b) hsl.h = (r - g) / chroma + 4;

			hsl.h *= 60;
			hsl.s = chroma / (1 - Math.abs(2 * l - 1));

			/*
			if (l > 0.5) s = chroma / (2 - max - min);
			else s = chroma / (max + min);//*/
		}

		return hsl;
	}

}, this);
