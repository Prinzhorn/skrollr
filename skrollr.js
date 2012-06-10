/*! skrollr v0.3.10 https://github.com/Prinzhorn/skrollr | free to use under terms of MIT license */
(function(window, document, undefined) {
	'use strict';

	//Used as a dummy function for event listeners.
	var NOOP = function() {};

	//Minify optimization.
	var hasProp = Object.prototype.hasOwnProperty;
	var documentElement = document.documentElement;
	var body = document.body;

	var HIDDEN_CLASS = 'hidden';
	var SKROLLABLE_CLASS = 'skrollable';
	var DEFAULT_EASING = 'linear';
	var DEFAULT_DURATION = 1000;

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

	//Finds rgb(a) colors, which don't use the percentage notation.
	var rxRGBAIntegerColor = /rgba?\(\s*-?\d+\s*,\s*-?\d+\s*,\s*-?\d+/g;

	//Finds all gradients.
	var rxGradient = /[a-z-]+-gradient/g;

	//Only relevant prefixes. May be extended.
	//Could be dangerous if there will ever be a CSS property which actually starts with "ms". Don't hope so.
	var rxPrefixes = /^O|Moz|webkit|ms/;

	var theCSSPrefix;
	var theDashedCSSPrefix;

	//Detect prefix for current browser by finding the first property using a prefix.
	if(window.getComputedStyle) {
		var style = window.getComputedStyle(body, null);

		for(var k in style) {
			//Yes, this is meant to be an assignment.
			//We check the key and if the key is a number, we check the value as well, because safari's getComputedStyle returns some weird array-like thingy.
			if(theCSSPrefix = (k.match(rxPrefixes) || (+k == k && style[k].match(rxPrefixes)))) {
				break;
			}
		}
	}

	//Empty string if no prefix detected
	theCSSPrefix = (theCSSPrefix || [''])[0];

	//Will be "--" if no prefix detected. No problem, browser will ignore "--transform" and stuff.
	theDashedCSSPrefix = '-' + theCSSPrefix.toLowerCase() + '-';

	//Cleanup.
	rxPrefixes = undefined;

	//Built-in easing functions.
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
			return p * p * p;
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
	 * Constructor.
	 */
	function Skrollr(options) {
		_instance = this;

		options = options || {};

		//We allow defining custom easings or overwrite existing
		if(options.easing) {
			for(var e in options.easing) {
				easings[e] = options.easing[e];
			}
		}

		_listeners = {
			//Function to be called right before rendering.
			beforerender: options.beforerender || NOOP,

			//Function to be called right after finishing rendering.
			render: options.render || NOOP
		};

		//true is default, thus undefined is true as well.
		_forceHeight = options.forceHeight !== false;

		if(_forceHeight) {
			_scale = options.scale || 1;
		}

		var allElements = document.getElementsByTagName('*');

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
					var frame = (match[2] | 0) * _scale;

					var kf = {
						frame: frame,
						props: attr.value
					};

					keyFrames.push(kf);

					//special handling for data-end.
					if(match[1] === '-end') {
						kf.dataEnd = kf.frame;
						_dataEndKeyFrames.push(kf);
					}

					if(frame > _maxKeyFrame) {
						_maxKeyFrame = frame;
					}
				}
			}

			//Does this element have key frames?
			if(keyFrames.length) {
				_skrollables.push({
					element: el,
					keyFrames: keyFrames
				});

				_addClass(el, SKROLLABLE_CLASS);
			}
		}

		var updateDataEnd = function() {
			//Set all data-end key frames to max key frame
			for(var i = 0; i < _dataEndKeyFrames.length; i++) {
				var kf = _dataEndKeyFrames[i];
				kf.frame = _maxKeyFrame - kf.dataEnd;
			}
		};

		var onResize;

		if(_forceHeight) {
			//Add a dummy element in order to get a large enough scrollbar.
			var dummy = document.createElement('div');
			var dummyStyle = dummy.style;

			dummyStyle.width = '1px';
			dummyStyle.position = 'absolute';
			dummyStyle.right = dummyStyle.top = dummyStyle.zIndex = '0';

			body.appendChild(dummy);

			//Update height of dummy div when window size is changed.
			onResize = function() {
				dummyStyle.height = (_maxKeyFrame + documentElement.clientHeight) + 'px';
				updateDataEnd();
			};
		} else {
			onResize = function() {
				_maxKeyFrame = body.scrollHeight - documentElement.clientHeight;
				updateDataEnd();
				_forceRender = true;
			};
		}

		_addEvent('resize', onResize);
		onResize();

		//Now that we got all key frame numbers right, actually parse the properties.
		for(var i = 0; i < _skrollables.length; i++) {
			var sk = _skrollables[i];

			//Make sure they are in order
			sk.keyFrames.sort(function(a, b) {
				return a.frame - b.frame;
			});

			//Parse the property string to objects
			_parseProps(sk);

			//Fill key frames with missing properties from left and right
			_fillProps(sk);
		}

		//Stop scroll animation when user scrolls.
		_addEvent('scroll', function() {
			_scrollAnimation = undefined;
		});

		//Clean up
		allElements = options = undefined;

		//Let's go
		_render();

		return _instance;
	}

	/**
	 * Animates scroll top to new position.
	 */
	Skrollr.prototype.animateTo = function(top, options) {
		options = options || {};

		var now = _now();

		//Setting this to a new value will automatically prevent the current animation to stop, if any.
		_scrollAnimation = {
			startTop: _instance.getScrollTop(),
			topDiff: top - _instance.getScrollTop(),
			targetTop: top,
			duration: options.duration || DEFAULT_DURATION,
			startTime: now,
			endTime: now + (options.duration || DEFAULT_DURATION),
			easing: easings[options.easing || DEFAULT_EASING],
			done: options.done || NOOP
		};

		//Don't queue the animation if there's nothing to animate.
		if(!_scrollAnimation.topDiff) {
			_scrollAnimation.done.call(_instance);
			_scrollAnimation = undefined;
		}
	};

	Skrollr.prototype.setScrollTop = function(top) {
		window.scroll(0, top);
	};

	Skrollr.prototype.getScrollTop = function(top) {
		return window.pageYOffset || documentElement.scrollTop || body.scrollTop || 0;
	};

	Skrollr.prototype.on = function(name, fn) {
		_listeners[name] = fn || NOOP;
	};

	Skrollr.prototype.off = function(name) {
		_listeners[name] = NOOP;
	};

	/*
		Private methods.
	*/

	/**
	 * Calculate and sets the style properties for the element at the given frame
	 */
	var _calcSteps = function(skrollable, frame) {
		var frames = skrollable.keyFrames;

		//We are before the first frame, don't do anything
		if(frame < frames[0].frame) {
			_addClass(skrollable.element, HIDDEN_CLASS);
		}
		//We are after or at the last frame, the element gets all props from last key frame
		else if(frame >= frames[frames.length - 1].frame) {
			_removeClass(skrollable.element, HIDDEN_CLASS);

			var last = frames[frames.length - 1];
			var value;

			for(var key in last.props) {
				if(hasProp.call(last.props, key)) {
					value = _interpolateString(last.props[key].value);

					_setStyle(skrollable.element, key, value);
				}
			}
		}
		//We are between two frames
		else {
			_removeClass(skrollable.element, HIDDEN_CLASS);

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
							var value = _calcInterpolation(left.props[key].value, right.props[key].value, progress);

							value = _interpolateString(value);

							_setStyle(skrollable.element, key, value);
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
	var _render = function() {
		//If there's an animation, which ends in current render call, call the callback after rendering;
		var afterAnimationCallback = NOOP;

		//Before actually rendering handle the scroll animation, if any.
		if(_scrollAnimation) {
			var now = _now();

			//It's over
			if(now >= _scrollAnimation.endTime) {
				_instance.setScrollTop(_scrollAnimation.targetTop);
				afterAnimationCallback = _scrollAnimation.done;
				_scrollAnimation = undefined;
			} else {
				//Map the current progress to the new progress using given easing function.
				var progress = _scrollAnimation.easing((now - _scrollAnimation.startTime) / _scrollAnimation.duration);

				_instance.setScrollTop((_scrollAnimation.startTop + progress * _scrollAnimation.topDiff) | 0);
			}
		}

		_curTop = _instance.getScrollTop();

		//In OSX it's possible to have a negative scrolltop, so, we set it to zero.
		if(_curTop < 0) {
			_curTop = 0;
		}

		//Did the scroll position even change?
		if(_forceRender || _lastTop !== _curTop) {
			//Remember in which direction are we scrolling?
			_direction = (_curTop >= _lastTop) ? 'down' : 'up';

			_forceRender = false;

			var listenerParams = {
				curTop: _curTop,
				lastTop: _lastTop,
				maxTop: _maxKeyFrame,
				direction: _direction
			};

			//Tell the listener we are about to render.
			var continueRendering = _listeners.beforerender.call(_instance, listenerParams);

			//The beforerender listener function is able the cancel rendering.
			if(continueRendering !== false) {
				for(var i = 0; i < _skrollables.length; i++) {
					_calcSteps(_skrollables[i], _curTop);
				}

				//Remember when we last rendered.
				_lastTop = _curTop;

				_listeners.render.call(_instance, listenerParams);
			}

			afterAnimationCallback.call(_instance);
		}

		requestAnimFrame(function() {
			_render();
		});
	};

	/**
	 * Parses the properties for each key frame of the given skrollable.
	 */
	var _parseProps = function(skrollable) {
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
					easing = DEFAULT_EASING;
				}

				//Exclamation point at first position forces the value to be taken literal.
				value = value.indexOf('!') ? _parseProp(value) : [value.slice(1)];

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
	 * @param val The CSS value to be parsed.
	 * @return Something like ["rgba(?%,?%, ?%,?)", 100, 50, 0, .7]
	 * where the first element is the format string later used
	 * and all following elements are the numeric value.
	 */
	var _parseProp = function(val) {
		var numbers = [];

		//One special case, where floats don't work.
		//We replace all occurences of rgba colors
		//which don't use percentage notation with the percentage notation.
		rxRGBAIntegerColor.lastIndex = 0;
		val = val.replace(rxRGBAIntegerColor, function(rgba) {
			return rgba.replace(rxNumericValue, function(n) {
				return n / 255 * 100 + '%';
			});
		});

		//Handle prefixing of "gradient" values.
		//For now only the prefixed value will be set. Unprefixed isn't supported anyway.
		rxGradient.lastIndex = 0;
		val = val.replace(rxGradient, function(s) {
			return theDashedCSSPrefix + s;
		});


		//Now parse ANY number inside this string and create a format string.
		val = val.replace(rxNumericValue, function(n) {
			numbers.push(+n);
			return '?';
		});

		//Add the formatstring as first value.
		numbers.unshift(val);

		return numbers;
	};

	/**
	 * Fills the key frames with missing left and right hand properties.
	 * If key frame 1 has property X and key frame 2 is missing X,
	 * but key frame 3 has X again, then we need to assign X to key frame 2 too.
	 *
	 * @param sk A skrollable.
	 */
	var _fillProps = function(sk) {
		//Will collect the properties key frame by key frame
		var propList = {};

		//Iterate over all key frames from left to right
		for(var i = 0; i < sk.keyFrames.length; i++) {
			_fillPropForFrame(sk.keyFrames[i], propList);
		}

		//Now do the same from right to fill the last gaps

		propList = {};

		//Iterate over all key frames from right to left
		for(var i = sk.keyFrames.length - 1; i >= 0; i--) {
			_fillPropForFrame(sk.keyFrames[i], propList);
		}
	};

	var _fillPropForFrame = function(frame, propList) {
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

	/**
	 * Calculates the new values for two given values array.
	 */
	var _calcInterpolation = function(val1, val2, progress) {
		//They both need to have the same length
		if(val1.length !== val2.length) {
			throw 'Can\'t interpolate between "' + val1[0] + '" and "' + val2[0] + '"';
		}

		//Add the format string as first element.
		var interpolated = [val1[0]];

		for(var i = 1; i < val1.length; i++) {
			//That's the line where the two numbers are actually interpolated.
			interpolated[i] = val1[i] + ((val2[i] - val1[i]) * progress);
		}

		return interpolated;
	};

	/**
	 * Interpolates the numeric values into the format string.
	 */
	var _interpolateString = function(val) {
		var i = 1;

		return val[0].replace(/\?/g, function() {
			return val[i++];
		});
	};

	/**
	 * Set the CSS property on the given element. Sets prefixed properties as well.
	 */
	var _setStyle = function(el, prop, val) {
		var style = el.style;

		//Camel case.
		prop = prop.replace(rxCamelCase, function(str, p1) {
			return p1.toUpperCase();
		}).replace('-', '');

		//Make sure z-index gets a <integer>.
		//This is the only <integer> case we need to handle.
		if(prop === 'zIndex') {
			//Floor
			style[prop] = '' + (val | 0);
		}
		else {
			//Need try-catch for old IE.
			try {
				//Set prefixed property.
				style[theCSSPrefix + prop.slice(0,1).toUpperCase() + prop.slice(1)] = val;

				//Set unprefixed.
				style[prop] = val;
			} catch(ignore) {}
		}

		//Plugin entry point.
		if(_plugins.setStyle) {
			for(var i = 0; i < plugins.setStyle.length; i++) {
				_plugins.setStyle[0].call(this, el, prop, val);
			}
		}
	};

	/**
	 * Adds a CSS class.
	 */
	var _addClass = function(el, name) {
		if(_untrim(el.className).indexOf(_untrim(name)) === -1) {
			el.className = _trim((el.className + ' ' + name));
		}
	};

	/**
	 * Cross browser event handling.
	 */
	var _addEvent = function(name, fn) {
		if(window.addEventListener) {
			window.addEventListener(name, fn, false);
		} else {
			window.attachEvent('on' + name, fn);
		}
	};

	/**
	 * Removes a CSS class.
	 */
	var _removeClass = function(el, name) {
		el.className = _trim((_untrim(el.className)).replace(_untrim(name), ' '));
	};

	var _trim = function(a) {
		return a.replace(rxTrim, '$1');
	};

	/**
	 * Adds a space before and after the string.
	 */
	var _untrim = function(a) {
		return ' ' + a + ' ';
	};

	var _now = function() {
		return +new Date();
	};

	/*
	 * Private variables.
	 */
	//Singleton
	var _instance;

	//Will contain all plugin-functions.
	var _plugins = {};

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
							value: ['?px', 100],
							easing: <reference to easing function>
						}
					}
				},
				{
					frame: 200,
					props: {
						width: {
							value: ['?px', 20],
							easing: <reference to easing function>
						}
					}
				}
			]
		};
	*/
	var _skrollables = [];

	//Will contain references to all "data-end" key frames.
	var _dataEndKeyFrames = [];

	var _listeners;
	var _forceHeight;
	var _maxKeyFrame = 0;

	var _scale = 1;

	//Current direction (up/down).
	var _direction = 'down';

	//The last top offset value. Needed to determine direction.
	var _lastTop = -1;

	//The current top offset, needed for async rendering.
	var _curTop = 0;

	//Will contain data about a running scrollbar animation, if any.
	var _scrollAnimation;

	//Can be set by any operation/event to force rendering even if the scrollbar didn't move.
	var _forceRender;

	/*
	 * Global api.
	 */
	window.skrollr = {
		//Main entry point.
		init: function(options) {
			return _instance || new Skrollr(options);
		},
		//Plugin api.
		plugin: function(entryPoint, fn) {
			//Each entry point may contain multiple plugin-functions.
			if(_plugins[entryPoint]) {
				_plugins[entryPoint].push(fn);
			} else {
				_plugins[entryPoint] = [fn];
			}
		},
		VERSION: '0.3.10'
	};
}(window, document));
