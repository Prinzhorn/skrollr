/*!
 * skrollr v0.2.4
 * parallax scrolling for the masses.
 *
 * Copyright 2012, Alexander Prinzhorn (@Prinzhorn) and contributors.
 *
 * skrollr can be used by everyone under the terms of the MIT license.
 *
 * Demo: http://prinzhorn.github.com/skrollr/
 * Source: https://github.com/Prinzhorn/skrollr
*/
(function(window, document, undefined) {
	//Used as a dummy function for event listeners.
	var noop = function() {};

	//Minify optimizations.
	var _parseInt = parseInt;
	var _parseFloat = parseFloat;
	var hasProp = Object.prototype.hasOwnProperty;

	var requestAnimFrame =
		window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(fn) {
			//Just 30 fps, because that's enough for those legacy browsers
			setTimeout(fn, 1000 / 30);
		};

	var rxTrim = /^\s*(.*)\s$/;

	//Find data-<number>, as well as data-end and data-end-<number>
	var rxKeyframeAttribute = /^data(-end)?-?(\d+)?$/;

	var rxPropSplit = /:|;/g;

	//Easing function names follow the property in square brackets.
	var rxPropEasing = /^([a-z-]+)\[(\w+)\]$/;

	var rxCamelCase = /-([a-z])/g;

	//Numeric values with optional sign.
	var rxNumericValue = /(:?\+|-)?[\d.]+/g;

	var prefixes = ['O', 'Moz', 'webkit', 'ms'];

	var supportsCSS3Colors = (function(s) {
		try {
			s.backgroundColor = 'hsla(180,50%,50%,.5)';
			return s.backgroundColor.indexOf('hsla') !== -1 || s.backgroundColor.indexOf('rgba') !== -1;
		} catch(e) {
			return false;
		}
	}(document.createElement('a').style));

	//Built in easing functions.
	var easings = {
		begin: function() {
			return 0;
		},
		end: function() {
			return 1;
		},
		linear: function(p) {
			return p;
		},
		quadratic: function(p) {
			return p * p;
		},
		cubic: function(p) {
			return p * p * p * p;
		},
		swing: function(p) {
			return (-Math.cos(p * Math.PI) / 2) + .5;
		},
		//see https://www.desmos.com/calculator/tbr20s8vd2 for how I did this
		bounce: function(p) {
			var a;

			switch(true) {
				case (p <= .5083):
					a = 3; break;
				case (p <= .8489):
					a = 9; break;
				case (p <= .96208):
					a = 27; break;
				case (p <= .99981):
					a = 91; break;
				default:
					return 1;
			}

			return 1 - Math.abs(3 * Math.cos(p * a * 1.028) / a);
		}
	};

	/**
	 * Calculates the new values for two given values structures.
	 */
	var calcInterpolation = function(val1, val2, progress) {
		//They both need to have the same length
		if(val1.length !== val2.length) {
			throw 'Can\'t interpolate between "' + val1[0] + '" and "' + val2[0] + '"';
		}

		var interpolated = [];

		for(var i = 1; i < val1.length; i++) {
			interpolated[i - 1] = [val1[i][0] + ((val2[i][0] - val1[i][0]) * progress)];

			//Floor if the <integer> flag is set
			if(val1[i][1]) {
				interpolated[i - 1] = interpolated[i - 1] | 0;
			}
		}

		//Add the format string as first element.
		interpolated.unshift(val1[0]);

		return interpolated;
	};

	/**
	 * Interpolates the numeric values into the format string.
	 */
	var interpolateString = function(val) {
		var i = 1;

		return val[0].replace(/\?/g, function() {
			return val[i++][0];
		});
	};

	/**
	 * Will turn the color value into a property string.
	 * Return hex values if hsla is unsupported.
	 */
	/*
	toString: function(val) {
		//Make browsers "support" hsl, hsla and rgba by mapping it to hex.
		//Sadly, alpha is lost. But more important, you can use hsl!
		if(!supportsCSS3Colors) {
			return toHex[val[0]](val[1][0], val[2][0], val[3][0]);
		}

		var res = val.slice(1);

		//concat values and units
		for(var i = 0; i < 4; i++) {
			res[i] = res[i].join('');
		}

		return val[0] + '(' + res.join(',') + ')';
	}
	*/



	/**
	 * Constructor.
	 */
	function Skrollr(options) {
		var self = this;

		options = options || {};

		//We allow defining custom easings or overwrite existing
		if(options.easing) {
			for(var e in options.easing) {
				easings[e] = options.easing[e];
			}
		}

		//Scale factor to scale key frames.
		self.scale = options.scale || 1;

		self.listeners = {
			//Function to be called right before rendering.
			beforerender: options.beforerender || noop,

			//Function to be called right after finishing rendering.
			render: options.render || noop
		};

		/*
			A list of all elements which should be animated associated with their the metadata.
			Exmaple skrollable with two key frames animating from 100px width to 20px:

			skrollable = {
				element: <the DOM element>,
				keyFrames: [
					{
						frame: 100,
						props: {
							width: {
								value: [100, 'px'],
								step: <reference to step function calculating the interpolation>,
								easing: <reference to easing function>
							}
						}
					},
					{
						frame: 200,
						props: {
							width: {
								value: [20, 'px'],
								step: <reference to step function calculating the interpolation>,
								easing: <reference to easing function>
							}
						}
					}
				]
			};
		*/
		self.skrollables = [];

		//Will contain the max key frame value available.
		self.maxKeyFrame = options.maxKeyFrame || 0;

		//Current direction (up/down).
		self.dir = 'down';

		//The last top offset value. Needed to determine direction.
		self.lastTop = -1;

		//The current top offset, needed for async rendering.
		self.curTop = 0;

		var allElements = document.getElementsByTagName('*');

		//Will contain references to all "data-end" key frames.
		var atEndKeyFrames = [];

		//Iterate over all elements in document.
		for(var i = 0; i < allElements.length; i++) {
			var el = allElements[i];
			var keyFrames = [];

			if(!el.attributes) {
				continue;
			}

			//Iterate over all attributes and search for key frame attributes.
			for (var k = 0; k < el.attributes.length; k++) {
				var attr = el.attributes[k];
				var match = attr.name.match(rxKeyframeAttribute);

				if(match !== null) {
					var frame;
					var kf;

					frame = (match[2] | 0) * self.scale;

					kf = {
						frame: frame,
						props: attr.value
					};

					keyFrames.push(kf);

					//special handling for data-end
					if(match[1] === '-end') {
						atEndKeyFrames.push(kf);
					}

					if(frame > this.maxKeyFrame) {
						self.maxKeyFrame = frame;
					}
				}
			}

			//Does this element have key frames?
			if(keyFrames.length) {
				self.skrollables.push({
					element: el,
					keyFrames: keyFrames
				});

				addClass(el, 'skrollable');
			}
		}

		//Set all data-end key frames to max key frame
		for(var i = 0; i < atEndKeyFrames.length; i++) {
			var kf = atEndKeyFrames[i];
			kf.frame = self.maxKeyFrame - kf.frame;
		}

		//Now that we got all key frame numbers right, actually parse the properties.
		for(var i = 0; i < self.skrollables.length; i++) {
			var sk = self.skrollables[i];

			//Make sure they are in order
			sk.keyFrames.sort(function(a, b) {
				return a.frame - b.frame;
			});

			//Parse the property string to objects
			self._parseProps(sk);

			//Fill key frames with missing properties from left and right
			self._fillProps(sk);
		}


		//Add a dummy element in order to get a large enough scrollbar
		var dummy = document.createElement('div');
		var dummyStyle = dummy.style;

		dummyStyle.width = '1px';
		dummyStyle.height = (self.maxKeyFrame + document.documentElement.clientHeight) + 'px';
		dummyStyle.position = 'absolute';
		dummyStyle.right = dummyStyle.top = dummyStyle.zIndex = '0';

		document.getElementsByTagName('body')[0].appendChild(dummy);

		//Let's go
		self._render();

		//Clean up
		dummy = undefined;
		dummyStyle = undefined;
		atEndKeyFrames = undefined;
		options = undefined;

		return self;
	}

	Skrollr.prototype.setScrollTop = function(top) {
		pageYOffset = top;
		document.body.scrollTop = top;
		document.documentElement.scrollTop = top;
	};

	Skrollr.prototype.on = function(name, fn) {
		this.listeners[name] = fn || noop;
	};

	Skrollr.prototype.off = function(name) {
		this.listeners[name] = noop;
	};

	/**
	 * Calculate and sets the style properties for the element at the given frame
	 */
	Skrollr.prototype._calcSteps = function(skrollable, frame) {
		var frames = skrollable.keyFrames;

		//We are before the first frame, don't do anything
		if(frame < frames[0].frame) {
			addClass(skrollable.element, 'hidden');
		}
		//We are after the last frame, the element gets all props from last key frame
		else if(frame > frames[frames.length - 1].frame) {
			removeClass(skrollable.element, 'hidden');

			var last = frames[frames.length - 1];
			var value;

			for(var key in last.props) {
				if(hasProp.call(last.props, key)) {
					value = interpolateString(last.props[key].value);

					setStyle(skrollable.element, key, value);
				}
			}
		}
		//We are between two frames
		else {
			removeClass(skrollable.element, 'hidden');

			//Find out between which two key frames we are right now
			for(var i = 0; i < frames.length - 1; i++) {
				if(frame >= frames[i].frame && frame <= frames[i + 1].frame) {
					var left = frames[i];
					var right = frames[i + 1];

					for(var key in left.props) {
						if(hasProp.call(left.props, key)) {
							var progress = (frame - left.frame) / (right.frame - left.frame);

							//Transform the current progress using the given easing function.
							progress = left.props[key].easing(progress);

							//Interpolate between the two values
							var value = calcInterpolation(left.props[key].value, right.props[key].value, progress);

							value = interpolateString(value);

							setStyle(skrollable.element, key, value);
						}
					}

					break;
				}
			}
		}
	};

	/**
	 * Renders all elements
	 */
	Skrollr.prototype._render = function() {
		var self = this;

		self.curTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

		//Does the scroll position event change?
		if(self.lastTop !== self.curTop) {
			//Remember in which direction are we scrolling?
			self.dir = (self.curTop >= self.lastTop) ? 'down' : 'up';

			//Tell the listener we are about to render.
			var continueRendering = self.listeners.beforerender.call(self, {
				curTop: self.curTop,
				lastTop: self.lastTop,
				maxTop: self.maxKeyFrame,
				direction: self.dir
			});

			//The beforerender listener function is able the cancel rendering.
			if(continueRendering !== false) {
				for(var i = 0; i < self.skrollables.length; i++) {
					self._calcSteps(self.skrollables[i], self.curTop);
				}

				//Remember when we last rendered.
				self.lastTop = self.curTop;

				self.listeners.render.call(self);
			}
		}

		requestAnimFrame(function() {
			self._render();
		});
	};

	/**
	 * Parses the properties for each key frame of the given skrollable.
	 */
	Skrollr.prototype._parseProps = function(skrollable) {
		var self = this;

		//Iterate over all key frames
		for(var i = 0; i < skrollable.keyFrames.length; i++) {
			var frame = skrollable.keyFrames[i];

			//Get all properties and values in an array
			var allProps = frame.props.split(rxPropSplit);

			var prop;
			var value;
			var easing;

			frame.props = {};

			//Iterate over all props and values (+2 because [prop,value,prop,value,...])
			for(var k = 0; k < allProps.length - 1; k += 2) {
				prop = allProps[k];
				value = allProps[k + 1];
				easing = prop.match(rxPropEasing);

				//Is there an easing specified for this prop?
				if(easing !== null) {
					prop = easing[1];
					easing = easing[2];
				} else {
					easing = 'linear';
				}

				value = self._parseProp(value);

				//Save the prop for this key frame with his value and easing function
				frame.props[prop] = {
					value: value,
					easing: easings[easing]
				};
			}
		}
	};

	/**
	 * Parses a value extracting numeric values and generating a format string
	 * for later interpolation of the new values in old string.
	 *
	 * Returns something like ["rgba(?,?,?,?)", [100,true], [50,true], [0,true], [.7,false]]
	 * where the first element is the format string later used and all following elements
	 * contain the numeric value and a <integer> flag.
	 */
	Skrollr.prototype._parseProp = function(val) {
		var numbers = [];

		val = val.replace(rxNumericValue, function(n) {
			//TODO: Add some logic to detect if it is a <integer>, which needs special handling in CSS
			numbers.push([_parseFloat(n, 10), false]);
			return '?';
		});

		//Add the formatstring as first value
		numbers.unshift(val);

		return numbers;
	};

	/**
	 * Fills the key frames with missing left hand properties.
	 * If key frame 1 has property X and key frame 2 is missing X,
	 * but key frame 3 has X again, then we need to assign X to key frame 2 too.
	 *
	 * @param sk A skrollable.
	 */
	Skrollr.prototype._fillProps = function(sk) {
		//Will collect the properties key frame by key frame
		var propList = {};

		//Iterate over all key frames from left to right
		for(var i = 0; i < sk.keyFrames.length; i++) {
			this._fillPropForFrame(sk.keyFrames[i], propList);
		}

		//Now do the same from right to fill the last gaps

		propList = {};

		//Iterate over all key frames from right to left
		for(var i = sk.keyFrames.length - 1; i >= 0; i--) {
			this._fillPropForFrame(sk.keyFrames[i], propList);
		}
	};


	Skrollr.prototype._fillPropForFrame = function(frame, propList) {
		//For each key frame iterate over all right hand properties and assign them,
		//but only if the current key frame doesn't have the property by itself
		for(var key in propList) {
			//The current frame misses this property, so assign it.
			if(!hasProp.call(frame.props, key)) {
				frame.props[key] = propList[key];
			}
		}

		//Iterate over all props of the current frame and collect them
		for(var key in frame.props) {
			propList[key] = frame.props[key];
		}
	};


	/*
		Helpers
	*/

	/**
	 * Set the CSS property on the given element. Sets prefixed properties as well.
	 */
	var setStyle = function(el, prop, val) {
		var style = el.style;

		//IE opacity
		if(prop === 'opacity') {
			style.zoom = 1;

			//Remove filter attribute in IE
			if(val >= 1 && style.removeAttribute) {
				style.removeAttribute('filter');
			} else {
				style.filter = 'alpha(opacity=' + val * 100 + ')';
			}
		}

		//Camel case
		prop = prop.replace(rxCamelCase, function(str, p1) {
			return p1.toUpperCase();
		}).replace('-', '');

		//Unprefixed
		style[prop] = val;

		//Make first letter upper case for prefixed values
		prop = prop.slice(0,1).toUpperCase() + prop.slice(1);

		//TODO maybe find some better way of doing this
		for(var i = 0; i < prefixes.length; i++) {
			style[prefixes[i] + prop] = val;
		}
	};

	/**
	 * Adds a CSS class.
	 */
	var addClass = function(el, name) {
		if(untrim(el.className).indexOf(untrim(name)) === -1) {
			el.className = (el.className + ' ' + name).replace(rxTrim, '$1');
		}
	};

	/**
	 * Removes a CSS class.
	 */
	var removeClass = function(el, name) {
		el.className = (untrim(el.className)).replace(untrim(name), '').replace(rxTrim, '$1');
	};

	/**
	 * Adds a space before and after the string.
	 */
	var untrim = function(a) {
		return ' ' + a + ' ';
	};

	/**
	 * Converts rgb or hsl color to hex color.
	 */
	var toHex = {
		//Credits to aemkei, jed and others
		//Based on https://gist.github.com/1325937 and https://gist.github.com/983535
		hsla: function(a,b,c,y){
			a%=360;
			a/=60;c/=100;b=[c+=b*=(c<.5?c:1-c)/100,c-a%1*b*2,c-=b*=2,c,c+a%1*b,c+b];

			y = [b[~~a%6],b[(a|16)%6],b[(a|8)%6]];

			return toHex.rgba(_parseInt(y[0] * 255), _parseInt(y[1] * 255), _parseInt(y[2] * 255));
		},
		//https://gist.github.com/983535
		rgba: function(a,b,c){
			return'#' + ((256+a<<8|b)<<8|c).toString(16).slice(1);
		}
	}


	//Global api
	window.skrollr = {
		//Main entry point
		init: function(options) {
			return new Skrollr(options);
		},
		VERSION: '0.2.3'
	};
}(window, document));
