/*!
 * Plugin for skrollr.
 * This plugin brings opacity and hsl colors to IE < 9.
 *
 * https://github.com/Prinzhorn/skrollr
 *
 * free to use under terms of MIT license
 */
(function(document, skrollr) {
	var rxHSLAColor = /hsla?\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)%\s*,\s*(-?[\d.]+)%.*?\)/g;
	var rxRGBAColor = /rgba?\(\s*(-?[\d.]+%?)\s*,\s*(-?[\d.]+%?)\s*,\s*(-?[\d.]+%?).*?\)/g;
	var rxID = /^#[^\s]+$/;

	var _setStyle = skrollr.setStyle;

	//Monkeypatch the setStyle function.
	skrollr.setStyle = function(el, prop, val) {
		//Original function call.
		_setStyle.apply(this, arguments);

		var style = el.style;
		var matched;

		//IE opacity
		if(prop === 'opacity') {
			style.zoom = 1;

			//Remove filter attribute in IE
			if(val >= 1 && style.removeAttribute) {
				style.removeAttribute('filter');
			} else {
				style.filter = 'alpha(opacity=' + val * 100 + ')';
			}

			return;
		}

		//Fast pre check
		if(val.indexOf('hsl') > -1) {
			matched = false;

			//Replace hsl(a) with hex if needed (ignoring alpha).
			val = val.replace(rxHSLAColor, function(x, h, s, l) {
				matched = true;

				return toHex.hsl(parseFloat(h), parseFloat(s), parseFloat(l));
			});

			if(matched) {
				try {
					style[prop] = val;
				} catch(ignore) {}

				return;
			}
		}

		//Fast pre check
		if(val.indexOf('rgb') > -1) {
			matched = false;

			//Replace rgba with hex if needed (ignoring alpha).
			val = val.replace(rxRGBAColor, function(s, r, g, b) {
				matched = true;

				r = parseFloat(r, 10);
				g = parseFloat(g, 10);
				b = parseFloat(b, 10);

				//rgba allows percentage notation.
				if(s.indexOf('%') > -1) {
					r = (r / 100) * 255;
					g = (g / 100) * 255;
					b = (b / 100) * 255;
				}

				return toHex.rgb(r | 0, g | 0, b | 0);
			});

			if(matched) {
				try {
					style[prop] = val;
				} catch(ignore) {}

				return;
			}
		}
	};


	/**
	 * Converts rgb or hsl color to hex color.
	 */
	var toHex = {
		//Credits to aemkei, jed and others
		//Based on https://gist.github.com/1325937 and https://gist.github.com/983535
		hsl: function(a,b,c,y){
			a%=360;
			a=a/60;c=c/100;b=[c+=b*=(c<0.5?c:1-c)/100,c-a%1*b*2,c-=b*=2,c,c+a%1*b,c+b];

			y = [b[~~a%6],b[(a|16)%6],b[(a|8)%6]];

			return toHex.rgb(parseInt(y[0] * 255, 10), parseInt(y[1] * 255, 10), parseInt(y[2] * 255, 10));
		},
		//https://gist.github.com/983535
		rgb: function(a,b,c){
			return'#' + ((256+a<<8|b)<<8|c).toString(16).slice(1);
		}
	};

	/*
		A really bad polyfill. But the main use-case for data-anchor-target are IDs.
	*/
	document.querySelector = document.querySelector || function(selector) {
		if(!rxID.test(selector)) {
			throw 'Unsupported selector "' + selector + '". The querySelector polyfill only works for IDs.';
		}

		return document.getElementById(selector.substr(1));
	};
}(document, window.skrollr));
