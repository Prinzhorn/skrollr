/*! skrollr v0.4.1 https://github.com/Prinzhorn/skrollr | free to use under terms of MIT license */
/*jshint smarttabs:true */
(function(window, document, undefined) {
	'use strict';

	//Minify optimization.
	var hasProp = Object.prototype.hasOwnProperty;
	var documentElement = document.documentElement;
	var body = document.body;

	var RENDERED_CLASS = 'rendered';
	var UNRENDERED_CLASS = 'un' + RENDERED_CLASS;
	var SKROLLABLE_CLASS = 'skrollable';

	var DEFAULT_EASING = 'linear';
	var DEFAULT_DURATION = 1000;

	var ANCHOR_START = 'start';
	var ANCHOR_END = 'end';
	var ANCHOR_TOP = 'top';
	var ANCHOR_CENTER = 'center';
	var ANCHOR_BOTTOM = 'bottom';

	var SKROLLABLE_HAS_RENDERED_CLASS_PROPERTY = '___has_rendered_class';

	//The property which will be added to the DOM element to hold the ID of the skrollable.
	var SKROLLABLE_ID_DOM_PROPERTY = '___skrollable_id';

	var requestAnimFrame =
		window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(fn) {
			//Just 30 fps, because that's enough for those legacy browsers
			window.setTimeout(fn, 1000 / 30);
		};

	var rxTrim = /^\s*(.+)\s*$/m;

	//Find all data-attributes. data-[offset]-[anchor]-[anchor].
	var rxKeyframeAttribute = /^data-(-?\d+)?(?:-?(start|end|top|center|bottom))?(?:-?(top|center|bottom))?$/;

	var rxPropSplit = /:|;/g;

	//Easing function names follow the property in square brackets.
	var rxPropEasing = /^([a-z\-]+)\[(\w+)\]$/;

	var rxCamelCase = /-([a-z])/g;
	var rxCamelCaseFn = function(str, letter) {
		return letter.toUpperCase();
	};

	//Numeric values with optional sign.
	var rxNumericValue = /(:?\+|-)?[\d.]+/g;

	//Finds rgb(a) colors, which don't use the percentage notation.
	var rxRGBAIntegerColor = /rgba?\(\s*-?\d+\s*,\s*-?\d+\s*,\s*-?\d+/g;

	//Finds all gradients.
	var rxGradient = /[a-z\-]+-gradient/g;

	//Only relevant prefixes. May be extended.
	//Could be dangerous if there will ever be a CSS property which actually starts with "ms". Don't hope so.
	var rxPrefixes = /^O|Moz|webkit|ms/;

	var theCSSPrefix;
	var theDashedCSSPrefix;

	//Detect prefix for current browser by finding the first property using a prefix.
	if(window.getComputedStyle) {
		var style = window.getComputedStyle(body, null);

		for(var k in style) {
			//We check the key and if the key is a number, we check the value as well, because safari's getComputedStyle returns some weird array-like thingy.
			theCSSPrefix = (k.match(rxPrefixes) || (+k == k && style[k].match(rxPrefixes)));

			if(theCSSPrefix) {
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
			return (-Math.cos(p * Math.PI) / 2) + 0.5;
		},
		//see https://www.desmos.com/calculator/tbr20s8vd2 for how I did this
		bounce: function(p) {
			var a;

			if(p <= 0.5083) {
				a = 3;
			} else if(p <= 0.8489) {
				a = 9;
			} else if(p <= 0.96208) {
				a = 27;
			} else if(p <= 0.99981) {
				a = 91;
			} else {
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
			beforerender: options.beforerender,

			//Function to be called right after finishing rendering.
			render: options.render
		};

		//true is default, thus undefined is true as well.
		_forceHeight = options.forceHeight !== false;

		if(_forceHeight) {
			_scale = options.scale || 1;
		}

		if(_forceHeight) {
			//Add a dummy element in order to get a large enough scrollbar.
			var dummy = document.createElement('div');
			var dummyStyle = dummy.style;

			dummyStyle.width = '1px';
			dummyStyle.position = 'absolute';
			dummyStyle.right = dummyStyle.top = dummyStyle.zIndex = '0';

			body.appendChild(dummy);

			//Update height of dummy div when window size is changed.
			_onResize = function() {
				dummyStyle.height = (_maxKeyFrame + documentElement.clientHeight) + 'px';
				_updateDependentKeyFrames();
			};
		} else {
			_onResize = function() {
				_maxKeyFrame = body.scrollHeight - documentElement.clientHeight;
				_updateDependentKeyFrames();
				_forceRender = true;
			};
		}

		_instance.refresh();

		_addEvent('resize', _onResize);

		//Let's go
		_render();

		return _instance;
	}

	/**
	 * (Re)parses some or all elements.
	 */
	Skrollr.prototype.refresh = function(elements) {
		var elementIndex;
		var ignoreID = false;

		//Completely reparse anything without argument.
		if(elements === undefined) {
			//Ignore that some elements may already have a skrollable ID.
			ignoreID = true;
			_skrollables = [];
			_skrollableIdCounter = 0;
			elements = document.getElementsByTagName('*');
		} else {
			//We accept a single element or an array of elements.
			elements = [].concat(elements);
		}

		for(elementIndex = 0; elementIndex < elements.length; elementIndex++) {
			var el = elements[elementIndex];
			var keyFrames = [];

			if(!el.attributes) {
				continue;
			}

			//Iterate over all attributes and search for key frame attributes.
			for (var attributeIndex = 0; attributeIndex < el.attributes.length; attributeIndex++) {
				var attr = el.attributes[attributeIndex];
				var match = attr.name.match(rxKeyframeAttribute);

				if(match !== null) {
					//Parse key frame offset. If undefined will be casted to 0.
					var offset = (match[1] | 0) * _scale;
					var anchor1 = match[2];
					//If second anchor is not set, the first will be taken for both.
					var anchor2 = match[3] || anchor1;

					var kf = {
						offset: offset,
						props: attr.value,
						//Point back to the element as well.
						element: el
					};

					keyFrames.push(kf);

					//"absolute" (or "classic") mode, where numbers mean absolute scroll offset.
					if(!anchor1 || anchor1 === ANCHOR_START || anchor1 === ANCHOR_END) {
						kf.mode = 'absolute';

						//data-end needs to be calculated after all key frames are know.
						if(anchor1 === ANCHOR_END) {
							kf.isEnd = true;
						} else {
							//For data-start we can already set the key frame w/o calculations.
							kf.frame = offset;
							delete kf.offset;

							if(kf.frame > _maxKeyFrame) {
								_maxKeyFrame = kf.frame;
							}
						}
					}
					//"relative" mode, where numbers are relative to anchors.
					else {
						kf.mode = 'relative';
						kf.anchors = [anchor1, anchor2];
					}
				}
			}

			//Does this element have key frames?
			if(keyFrames.length) {
				var id;

				if(!ignoreID && SKROLLABLE_ID_DOM_PROPERTY in el) {
					id = el[SKROLLABLE_ID_DOM_PROPERTY];
				} else {
					id = (el[SKROLLABLE_ID_DOM_PROPERTY] = _skrollableIdCounter++);
				}

				_skrollables[id] = {
					element: el,
					keyFrames: keyFrames
				};

				_updateClass(el, [SKROLLABLE_CLASS, UNRENDERED_CLASS], [RENDERED_CLASS]);
			}
		}

		//This is kinda hacky, but it's needed to update certain values.
		_onResize();

		//Now that we got all key frame numbers right, actually parse the properties.
		for(elementIndex = 0; elementIndex < elements.length; elementIndex++) {
			var sk = _skrollables[elements[elementIndex][SKROLLABLE_ID_DOM_PROPERTY]];

			if(sk === undefined) {
				continue;
			}

			//Make sure they are in order
			sk.keyFrames.sort(_keyFrameComparator);

			//Parse the property string to objects
			_parseProps(sk);

			//Fill key frames with missing properties from left and right
			_fillProps(sk);
		}

		return _instance;
	};

	/**
	 * Animates scroll top to new position.
	 */
	Skrollr.prototype.animateTo = function(top, options) {
		options = options || {};

		var now = _now();
		var scrollTop = _instance.getScrollTop();

		//Setting this to a new value will automatically prevent the current animation to stop, if any.
		_scrollAnimation = {
			startTop: scrollTop,
			topDiff: top - scrollTop,
			targetTop: top,
			duration: options.duration || DEFAULT_DURATION,
			startTime: now,
			endTime: now + (options.duration || DEFAULT_DURATION),
			easing: easings[options.easing || DEFAULT_EASING],
			done: options.done
		};

		//Don't queue the animation if there's nothing to animate.
		if(!_scrollAnimation.topDiff) {
			if(_scrollAnimation.done) {
				_scrollAnimation.done.call(_instance);
			}

			_scrollAnimation = undefined;
		}

		return _instance;
	};

	Skrollr.prototype.setScrollTop = function(top) {
		window.scroll(0, top);

		return _instance;
	};

	Skrollr.prototype.getScrollTop = function(top) {
		return window.pageYOffset || documentElement.scrollTop || body.scrollTop || 0;
	};

	Skrollr.prototype.on = function(name, fn) {
		_listeners[name] = fn;

		return _instance;
	};

	Skrollr.prototype.off = function(name) {
		delete _listeners[name];

		return _instance;
	};

	/*
		Private methods.
	*/

	/**
	 * Updates key frames which depend on others.
	 * That is "end" in "absolute" mode and all key frames in "relative" mode.
	 */
	var _updateDependentKeyFrames = function() {
		for(var skrollableIndex = 0; skrollableIndex < _skrollables.length; skrollableIndex++) {
			var keyFrames = _skrollables[skrollableIndex].keyFrames;

			for(var keyFrameIndex = 0; keyFrameIndex < keyFrames.length; keyFrameIndex++) {
				var kf = keyFrames[keyFrameIndex];

				if(kf.mode === 'relative') {
					kf.frame = _relativeToAbsolute(kf.element, kf.anchors[0], kf.anchors[1]) - kf.offset;
				} else if(kf.isEnd) {
					kf.frame = _maxKeyFrame - kf.offset;
				}
			}
		}
	};

	/**
	 * Transform "relative" mode to "absolute" mode.
	 * That is, calculate anchor position and offset of element.
	 */
	var _relativeToAbsolute = function(element, viewportAnchor, elementAnchor) {
		var viewportHeight = documentElement.clientHeight;
		var box = element.getBoundingClientRect();
		var absolute = box.top;

		if(viewportAnchor === ANCHOR_BOTTOM) {
			absolute -= viewportHeight;
		} else if(viewportAnchor === ANCHOR_CENTER) {
			absolute -= viewportHeight / 2;
		}

		if(elementAnchor === ANCHOR_BOTTOM) {
			absolute += box.height;
		} else if(elementAnchor === ANCHOR_CENTER) {
			absolute += box.height / 2;
		}

		//Compensate scrolling since getBoundingClientRect is relative to viewport.
		absolute += _instance.getScrollTop();

		return (absolute + 0.5) | 0;
	};

	/**
	 * Calculates and sets the style properties for the element at the given frame.
	 */
	var _calcSteps = function(frame) {
		//Iterate over all skrollables.
		for(var skrollableIndex = 0; skrollableIndex < _skrollables.length; skrollableIndex++) {
			var skrollable = _skrollables[skrollableIndex];
			var frames = skrollable.keyFrames;
			var firstFrame = frames[0].frame;
			var lastFrame = frames[frames.length - 1].frame;
			var atFirst = frame <= firstFrame;
			var atLast = frame >= lastFrame;
			var key;
			var value;

			//If we are before/after or exactly at the first/last frame, the element gets all props from this key frame.
			if(atFirst || atLast) {
				var props = frames[atFirst ? 0 : frames.length - 1].props;

				for(key in props) {
					if(hasProp.call(props, key)) {
						value = _interpolateString(props[key].value);

						_setStyle(skrollable.element, key, value);
					}
				}

				//Add the unrendered class when exactly at first/last frame.
				if(skrollable[SKROLLABLE_HAS_RENDERED_CLASS_PROPERTY] && (frame < firstFrame || frame > lastFrame)) {
					_updateClass(skrollable.element, [UNRENDERED_CLASS], [RENDERED_CLASS]);

					//Does a faster job than sth. like hasClass('string')
					skrollable[SKROLLABLE_HAS_RENDERED_CLASS_PROPERTY] = false;
				}

				continue;
			}

			//We are between two frames.
			if(!skrollable[SKROLLABLE_HAS_RENDERED_CLASS_PROPERTY]) {
				_updateClass(skrollable.element, [RENDERED_CLASS], [UNRENDERED_CLASS]);

				skrollable[SKROLLABLE_HAS_RENDERED_CLASS_PROPERTY] = true;
			}

			//Find out between which two key frames we are right now.
			for(var keyFrameIndex = 0; keyFrameIndex < frames.length - 1; keyFrameIndex++) {
				if(frame >= frames[keyFrameIndex].frame && frame <= frames[keyFrameIndex + 1].frame) {
					var left = frames[keyFrameIndex];
					var right = frames[keyFrameIndex + 1];

					for(key in left.props) {
						if(hasProp.call(left.props, key)) {
							var progress = (frame - left.frame) / (right.frame - left.frame);

							//Transform the current progress using the given easing function.
							progress = left.props[key].easing(progress);

							//Interpolate between the two values
							value = _calcInterpolation(left.props[key].value, right.props[key].value, progress);

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
		var afterAnimationCallback;

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
			var continueRendering = _listeners.beforerender && _listeners.beforerender.call(_instance, listenerParams);

			//The beforerender listener function is able the cancel rendering.
			if(continueRendering !== false) {
				//Now actually interpolate all the styles.
				_calcSteps(_curTop);

				//Remember when we last rendered.
				_lastTop = _curTop;

				if(_listeners.render) {
					_listeners.render.call(_instance, listenerParams);
				}
			}

			if(afterAnimationCallback) {
				afterAnimationCallback.call(_instance);
			}
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
		for(var keyFrameIndex = 0; keyFrameIndex < skrollable.keyFrames.length; keyFrameIndex++) {
			var frame = skrollable.keyFrames[keyFrameIndex];

			//Get all properties and values in an array
			var allProps = frame.props.split(rxPropSplit);

			var prop;
			var value;
			var easing;

			frame.props = {};

			//Iterate over all props and values (+2 because [prop,value,prop,value,...])
			for(var propertyIndex = 0; propertyIndex < allProps.length - 1; propertyIndex += 2) {
				prop = _trim(allProps[propertyIndex]);
				value = _trim(allProps[propertyIndex + 1]);
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
		var keyFrameIndex;

		//Iterate over all key frames from left to right
		for(keyFrameIndex = 0; keyFrameIndex < sk.keyFrames.length; keyFrameIndex++) {
			_fillPropForFrame(sk.keyFrames[keyFrameIndex], propList);
		}

		//Now do the same from right to fill the last gaps

		propList = {};

		//Iterate over all key frames from right to left
		for(keyFrameIndex = sk.keyFrames.length - 1; keyFrameIndex >= 0; keyFrameIndex--) {
			_fillPropForFrame(sk.keyFrames[keyFrameIndex], propList);
		}
	};

	var _fillPropForFrame = function(frame, propList) {
		var key;

		//For each key frame iterate over all right hand properties and assign them,
		//but only if the current key frame doesn't have the property by itself
		for(key in propList) {
			//The current frame misses this property, so assign it.
			if(!hasProp.call(frame.props, key)) {
				frame.props[key] = propList[key];
			}
		}

		//Iterate over all props of the current frame and collect them
		for(key in frame.props) {
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

		for(var valueIndex = 1; valueIndex < val1.length; valueIndex++) {
			//That's the line where the two numbers are actually interpolated.
			interpolated[valueIndex] = val1[valueIndex] + ((val2[valueIndex] - val1[valueIndex]) * progress);
		}

		return interpolated;
	};

	/**
	 * Interpolates the numeric values into the format string.
	 */
	var _interpolateString = function(val) {
		var valueIndex = 1;

		return val[0].replace(/\?/g, function() {
			return val[valueIndex++];
		});
	};

	/**
	 * Set the CSS property on the given element. Sets prefixed properties as well.
	 */
	var _setStyle = function(el, prop, val) {
		var style = el.style;

		//Camel case.
		prop = prop.replace(rxCamelCase, rxCamelCaseFn).replace('-', '');

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
			for(var pluginIndex = 0; pluginIndex < _plugins.setStyle.length; pluginIndex++) {
				_plugins.setStyle[pluginIndex].call(_instance, el, prop, val);
			}
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
	 * Adds and removes a CSS classes.
	 * Works with SVG as well.
	 */
	var _updateClass = function(el, add, remove) {
		var prop = 'className';

		//SVG support by using className.baseVal instead of just className
		if(window.SVGElement && el instanceof window.SVGElement) {
			el = el[prop];
			prop = 'baseVal';
		}

		//Cache current classes. We will work on a string before passing back to DOM.
		var val = el[prop];

		//All classes to be added.
		for(var classAddIndex = 0; classAddIndex < add.length; classAddIndex++) {
			//Only add if el not already has class.
			if(_untrim(val).indexOf(_untrim(add[classAddIndex])) === -1) {
				val += ' ' + add[classAddIndex];
			}
		}

		//All classes to be removed.
		for(var classRemoveIndex = 0; classRemoveIndex < remove.length; classRemoveIndex++) {
			val = _untrim(val).replace(_untrim(remove[classRemoveIndex]), ' ');
		}

		el[prop] = _trim(val);
	};

	/**
	 * Updates the CSS class of the element.
	 */

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

	var _keyFrameComparator = function(a, b) {
		return a.frame - b.frame;
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
					},
					mode: "absolute"
				},
				{
					frame: 200,
					props: {
						width: {
							value: ['?px', 20],
							easing: <reference to easing function>
						}
					},
					mode: "absolute"
				}
			]
		};
	*/
	var _skrollables = [];

	var _listeners;
	var _forceHeight;
	var _maxKeyFrame = 0;
	var _onResize;

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

	//Each skrollable gets an unique ID incremented for each skrollable.
	//The ID is the index in the _skrollables array.
	var _skrollableIdCounter = 0;

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
		VERSION: '0.4.1'
	};
}(window, document));
