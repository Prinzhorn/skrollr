/*!
 * skrollr core
 *
 * Alexander Prinzhorn - https://github.com/Prinzhorn/skrollr
 *
 * Free to use under terms of MIT license
 */
(function(window, document, undefined) {
	'use strict';

	/*
	 * Global api.
	 */
	window.skrollr = {
                instances: [],
		//Main entry point.
		init: function(options) {
                        var _instance =  new Skrollr(options);
                        this.instances.push(_instance);
			return _instance;
		},
		VERSION: '0.6.3'
	};

	//Minify optimization.
	var hasProp = Object.prototype.hasOwnProperty;
	var Math = window.Math;
	var getStyle = window.getComputedStyle;

	//They will be filled when skrollr gets initialized.
	var documentElement;
	var body;

	var EVENT_TOUCHSTART = 'touchstart';
	var EVENT_TOUCHMOVE = 'touchmove';
	var EVENT_TOUCHCANCEL = 'touchcancel';
	var EVENT_TOUCHEND = 'touchend';

	var SKROLLABLE_CLASS = 'skrollable';
	var SKROLLABLE_BEFORE_CLASS = SKROLLABLE_CLASS + '-before';
	var SKROLLABLE_BETWEEN_CLASS = SKROLLABLE_CLASS + '-between';
	var SKROLLABLE_AFTER_CLASS = SKROLLABLE_CLASS + '-after';

	var SKROLLR_CLASS = 'skrollr';
	var NO_SKROLLR_CLASS = 'no-' + SKROLLR_CLASS;
	var SKROLLR_DESKTOP_CLASS = SKROLLR_CLASS + '-desktop';
	var SKROLLR_MOBILE_CLASS = SKROLLR_CLASS + '-mobile';

	var DEFAULT_EASING = 'linear';
	var DEFAULT_DURATION = 1000;//ms
	var MOBILE_DECELERATION = 0.0006;//pixel/ms²

	var SMOOTH_SCROLLING_DURATION = 200;

	var ANCHOR_START = 'start';
	var ANCHOR_END = 'end';
	var ANCHOR_CENTER = 'center';
	var ANCHOR_BOTTOM = 'bottom';

	//The property which will be added to the DOM element to hold the ID of the skrollable.
	var SKROLLABLE_ID_DOM_PROPERTY = '___skrollable_id';

	var rxTrim = /^\s+|\s+$/g;

	//Find all data-attributes. data-[_constant]-[offset]-[anchor]-[anchor].
	var rxKeyframeAttribute = /^data(?:-(_\w+))?(?:-?(-?\d+))?(?:-?(start|end|top|center|bottom))?(?:-?(top|center|bottom))?$/;

	var rxPropValue = /\s*([\w\-\[\]]+)\s*:\s*(.+?)\s*(?:;|$)/gi;

	//Easing function names follow the property in square brackets.
	var rxPropEasing = /^([a-z\-]+)\[(\w+)\]$/;

	var rxCamelCase = /-([a-z])/g;
	var rxCamelCaseFn = function(str, letter) {
		return letter.toUpperCase();
	};

	//Numeric values with optional sign.
	var rxNumericValue = /[\-+]?[\d]*\.?[\d]+/g;

	//Used to replace occurences of {?} with a number.
	var rxInterpolateString = /\{\?\}/g;

	//Finds rgb(a) colors, which don't use the percentage notation.
	var rxRGBAIntegerColor = /rgba?\(\s*-?\d+\s*,\s*-?\d+\s*,\s*-?\d+/g;

	//Finds all gradients.
	var rxGradient = /[a-z\-]+-gradient/g;

	//Vendor prefix. Will be set once skrollr gets initialized.
	var theCSSPrefix;
	var theDashedCSSPrefix;

	//Will be called once (when skrollr gets initialized).
	var detectCSSPrefix = function() {
		//Only relevant prefixes. May be extended.
		//Could be dangerous if there will ever be a CSS property which actually starts with "ms". Don't hope so.
		var rxPrefixes = /^(?:O|Moz|webkit|ms)|(?:-(?:o|moz|webkit|ms)-)/;

		//Detect prefix for current browser by finding the first property using a prefix.
		if(!getStyle) {
			return;
		}

		var style = getStyle(body, null);

		for(var k in style) {
			//We check the key and if the key is a number, we check the value as well, because safari's getComputedStyle returns some weird array-like thingy.
			theCSSPrefix = (k.match(rxPrefixes) || (+k == k && style[k].match(rxPrefixes)));

			if(theCSSPrefix) {
				break;
			}
		}

		//Did we even detect a prefix?
		if(!theCSSPrefix) {
			return;
		}

		theCSSPrefix = theCSSPrefix[0];

		//We could have detected either a dashed prefix or this camelCaseish-inconsistent stuff.
		if(theCSSPrefix.slice(0,1) === '-') {
			theDashedCSSPrefix = theCSSPrefix;

			//There's no logic behind these. Need a look up.
			theCSSPrefix = ({
				'-webkit-': 'webkit',
				'-moz-': 'Moz',
				'-ms-': 'ms',
				'-o-': 'O'
			})[theCSSPrefix];
		} else {
			theDashedCSSPrefix = '-' + theCSSPrefix.toLowerCase() + '-';
		}
	};

	var polyfillRAF = function() {
		var requestAnimFrame = window.requestAnimationFrame || window[theCSSPrefix.toLowerCase() + 'RequestAnimationFrame'];

		var lastTime = _now();

		if(this._isMobile || !requestAnimFrame) {
			requestAnimFrame = function(callback) {
				//How long did it take to render?
				var deltaTime = _now() - lastTime;
				var delay = Math.max(0, 33 - deltaTime);

				window.setTimeout(function() {
					lastTime = _now();
					callback();
				}, delay);
			};
		}

		return requestAnimFrame;
	};

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
		sqrt: function(p) {
			return Math.sqrt(p);
		},
		outCubic: function(p) {
			return (Math.pow((p - 1), 3) + 1);
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
		documentElement = document.documentElement;
		body = document.body;

		detectCSSPrefix();

                this._skrollables = [];

                this._maxKeyFrame = 0;

                this._scale = 1;

                //Current direction (up/down).
                this._direction = 'down';

                //The last top offset value. Needed to determine direction.
                this._lastTop = -1;

                //The last time we called the render method (doesn't mean we rendered!).
                this._lastRenderCall = _now();

                //Each skrollable gets an unique ID incremented for each skrollable.
                //The ID is the index in the this._skrollables array.
                this._skrollableIdCounter = 0;

                //Mobile specific vars. Will be stripped by UglifyJS when not in use.
                this._isMobile = false;

                //The virtual scroll offset when using mobile scrolling.
                this._mobileOffset = 0;

		options = options || {};

                this.id = options.id || 'skrollr-'+window.skrollr.instances.length;

		this._constants = options.constants || {};

		//We allow defining custom easings or overwrite existing.
		if(options.easing) {
			for(var e in options.easing) {
				easings[e] = options.easing[e];
			}
		}

		this._edgeStrategy = options.edgeStrategy || 'ease';

		this._listeners = {
			//Function to be called right before rendering.
			beforerender: options.beforerender,

			//Function to be called right after finishing rendering.
			render: options.render
		};

		//forceHeight is true by default
		this._forceHeight = options.forceHeight !== false;

		if(this._forceHeight) {
			this._scale = options.scale || 1;
		}

		this._smoothScrollingEnabled = options.smoothScrolling !== false;

		//Dummy object. Will be overwritten in the _render method when smooth scrolling is calculated.
		this._smoothScrolling = {
			targetTop: this.getScrollTop()
		};

		//A custom check function may be passed.
		this._isMobile = ((options.mobileCheck || function() {
			return (/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera);
		})());

		if(this._isMobile) {
			this._skrollrBody = options.skrollrBody || document.getElementById( options.id || 'skrollr-body' );

			//Detect 3d transform if there's a skrollr-body (only needed for #skrollr-body).
			if(this._skrollrBody) {
				_detect3DTransforms.call(this);
			}

			_initMobile.call(this);
			_updateClass(documentElement, [SKROLLR_CLASS, SKROLLR_MOBILE_CLASS], [NO_SKROLLR_CLASS]);
		} else {
                        this._skrollrBody = options.skrollrBody || document.getElementById( options.id || 'skrollr-body' ) || document;

			_updateClass(documentElement, [SKROLLR_CLASS, SKROLLR_DESKTOP_CLASS], [NO_SKROLLR_CLASS]);
		}

		//Triggers parsing of elements and a first reflow.
		this.refresh();

		_addEvent(window, 'resize orientationchange', function(){
                    _reflow.call(this);
                });

		var requestAnimFrame = polyfillRAF.call(this);

                if (!options.disableAutoStart) {
                    //Let's go.
                    (function animloop(){
                            _render();
                            requestAnimFrame(animloop);
                    }());
                }

		return this;
	}

	/**
	 * (Re)parses some or all elements.
	 */
	Skrollr.prototype.refresh = function(elements) {
		var elementIndex;
		var elementsLength;
		var ignoreID = false;

		//Completely reparse anything without argument.
		if(elements === undefined) {
			//Ignore that some elements may already have a skrollable ID.
			ignoreID = true;

			this._skrollables = [];
			this._skrollableIdCounter = 0;

			elements = this._skrollrBody.getElementsByTagName('*');
		} else {
			//We accept a single element or an array of elements.
			elements = [].concat(elements);
		}

		elementIndex = 0;
		elementsLength = elements.length;

		for(; elementIndex < elementsLength; elementIndex++) {
			var el = elements[elementIndex];
			var anchorTarget = el;
			var keyFrames = [];

			//If this particular element should be smooth scrolled.
			var smoothScrollThis = this._smoothScrollingEnabled;

			//The edge strategy for this particular element.
			var edgeStrategy = this._edgeStrategy;

			if(!el.attributes) {
				continue;
			}

			//Iterate over all attributes and search for key frame attributes.
			var attributeIndex = 0;
			var attributesLength = el.attributes.length;

			for (; attributeIndex < attributesLength; attributeIndex++) {
				var attr = el.attributes[attributeIndex];

				if(attr.name === 'data-anchor-target') {
					anchorTarget = document.querySelector(attr.value);

					if(anchorTarget === null) {
						throw 'Unable to find anchor target "' + attr.value + '"';
					}

					continue;
				}

				//Global smooth scrolling can be overridden by the element attribute.
				if(attr.name === 'data-smooth-scrolling') {
					smoothScrollThis = attr.value !== 'off';

					continue;
				}

				//Global edge strategy can be overridden by the element attribute.
				if(attr.name === 'data-edge-strategy') {
					edgeStrategy = attr.value;

					continue;
				}

				var match = attr.name.match(rxKeyframeAttribute);

				if(match === null) {
					continue;
				}

				var constant = match[1];

				//If there is a constant, get it's value or fall back to 0.
				constant = constant && this._constants[constant.substr(1)] || 0;

				//Parse key frame offset. If undefined will be casted to 0.
				var offset = (match[2] | 0) + constant;
				var anchor1 = match[3];
				//If second anchor is not set, the first will be taken for both.
				var anchor2 = match[4] || anchor1;

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
						//#59: "scale" options should only affect absolute mode.
						kf.frame = offset * this._scale;

						delete kf.offset;
					}
				}
				//"relative" mode, where numbers are relative to anchors.
				else {
					kf.mode = 'relative';
					kf.anchors = [anchor1, anchor2];
				}
			}

			//Does this element have key frames?
			if(!keyFrames.length) {
				continue;
			}

			//Will hold the original style and class attributes before we controlled the element (see #80).
			var styleAttr, classAttr;

			var id;

			if(!ignoreID && SKROLLABLE_ID_DOM_PROPERTY in el) {
				//We already have this element under control. Grab the corresponding skrollable id.
				id = el[SKROLLABLE_ID_DOM_PROPERTY];
				styleAttr = this._skrollables[id].styleAttr;
				classAttr = this._skrollables[id].classAttr;
			} else {
				//It's an unknown element. Asign it a new skrollable id.
				id = (el[SKROLLABLE_ID_DOM_PROPERTY] = this._skrollableIdCounter++);
				styleAttr = el.style.cssText;
				classAttr = _getClass(el);
			}

			this._skrollables[id] = {
				element: el,
				styleAttr: styleAttr,
				classAttr: classAttr,
				anchorTarget: anchorTarget,
				keyFrames: keyFrames,
				smoothScrolling: smoothScrollThis,
				edgeStrategy: edgeStrategy
			};

			_updateClass(el, [SKROLLABLE_CLASS], []);
		}

		//Reflow for the first time.
		_reflow.call(this);

		//Now that we got all key frame numbers right, actually parse the properties.
		elementIndex = 0;
		elementsLength = elements.length;

		for(; elementIndex < elementsLength; elementIndex++) {
			var sk = this._skrollables[elements[elementIndex][SKROLLABLE_ID_DOM_PROPERTY]];

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

		return this;
	};

	/**
	 * Transform "relative" mode to "absolute" mode.
	 * That is, calculate anchor position and offset of element.
	 */
	Skrollr.prototype.relativeToAbsolute = function(element, viewportAnchor, elementAnchor) {
		var viewportHeight = documentElement.clientHeight;
		var box = element.getBoundingClientRect();
		var absolute = box.top;

		//#100: IE doesn't supply "height" with getBoundingClientRect.
		var boxHeight = box.bottom - box.top;

		if(viewportAnchor === ANCHOR_BOTTOM) {
			absolute -= viewportHeight;
		} else if(viewportAnchor === ANCHOR_CENTER) {
			absolute -= viewportHeight / 2;
		}

		if(elementAnchor === ANCHOR_BOTTOM) {
			absolute += boxHeight;
		} else if(elementAnchor === ANCHOR_CENTER) {
			absolute += boxHeight / 2;
		}

		//Compensate scrolling since getBoundingClientRect is relative to viewport.
		absolute += this.getScrollTop();

		return (absolute + 0.5) | 0;
	};

	/**
	 * Animates scroll top to new position.
	 */
	Skrollr.prototype.animateTo = function(top, options) {
		options = options || {};

		var now = _now();
		var scrollTop = this.getScrollTop();

		//Setting this to a new value will automatically cause the current animation to stop, if any.
		this._scrollAnimation = {
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
		if(!this._scrollAnimation.topDiff) {
			if(this._scrollAnimation.done) {
				this._scrollAnimation.done.call(this, false);
			}

			this._scrollAnimation = undefined;
		}

		return this;
	};

	/**
	 * Stops animateTo animation.
	 */
	Skrollr.prototype.stopAnimateTo = function() {
		if(this._scrollAnimation && this._scrollAnimation.done) {
			this._scrollAnimation.done.call(this, true);
		}

		this._scrollAnimation = undefined;
	};

	/**
	 * Returns if an animation caused by animateTo is currently running.
	 */
	Skrollr.prototype.isAnimatingTo = function() {
		return !!this._scrollAnimation;
	};

	Skrollr.prototype.setScrollTop = function(top, force) {
		//Don't do smooth scrolling (last top === new top).
		if(force === true) {
			this._lastTop = top;
			this._forceRender = true;
		}

		if(this._isMobile) {
			this._mobileOffset = Math.min(Math.max(top, 0), this._maxKeyFrame);

			//That's were we actually "scroll" on mobile.
			if(this._skrollrBody) {
				//Set the transform ("scroll it").
				_setStyle(this._skrollrBody, 'transform', 'translate(0, ' + -(this._mobileOffset) + 'px) ' + this._translateZ);
			}
                } else if(this.iscroll) {
			//Notice the minus.
			this.iscroll.scrollTo(0, -top);
		} else {
			window.scrollTo(0, top);
		}

		return this;
	};

	Skrollr.prototype.getScrollTop = function() {
		if(this._isMobile) {
			return this._mobileOffset;
                } else if(this.iscroll) {
			return -this.iscroll.y;
		} else {
			return window.pageYOffset || documentElement.scrollTop || body.scrollTop || 0;
		}
	};

	Skrollr.prototype.on = function(name, fn) {
		this._listeners[name] = fn;

		return this;
	};

	Skrollr.prototype.off = function(name) {
		delete this._listeners[name];

		return this;
	};

	Skrollr.prototype.render = function() {
                _render.call(this);

		return this;
	};

        Skrollr.prototype.setConstants = function(constants) {
		this._constants = constants;

		return this;
	};

	/*
		Private methods.
	*/

	var _initMobile = function() {
		var initialElement;
		var initialTouchY;
		var initialTouchX;
		var currentTouchY;
		var currentTouchX;
		var lastTouchY;
		var deltaY;

		var initialTouchTime;
		var currentTouchTime;
		var lastTouchTime;
		var deltaTime;

                var _this = this;

		_addEvent(documentElement, [EVENT_TOUCHSTART, EVENT_TOUCHMOVE, EVENT_TOUCHCANCEL, EVENT_TOUCHEND].join(' '), function(e) {
			e.preventDefault();

			var touch = e.changedTouches[0];

			currentTouchY = touch.clientY;
			currentTouchX = touch.clientX;
			currentTouchTime = e.timeStamp;

			switch(e.type) {
				case EVENT_TOUCHSTART:
					//The last element we tapped on.
					if(initialElement) {
						initialElement.blur();
					}

					initialElement = e.target;
					initialTouchY = lastTouchY = currentTouchY;
					initialTouchX = currentTouchX;
					initialTouchTime = currentTouchTime;

					break;
				case EVENT_TOUCHMOVE:
					deltaY = currentTouchY - lastTouchY;
					deltaTime = currentTouchTime - lastTouchTime;

					_this.setScrollTop(_this._mobileOffset - deltaY);

					lastTouchY = currentTouchY;
					lastTouchTime = currentTouchTime;
					break;
				default:
				case EVENT_TOUCHCANCEL:
				case EVENT_TOUCHEND:
					var distanceY = initialTouchY - currentTouchY;
					var distanceX = initialTouchX - currentTouchX;
					var distance2 = distanceX * distanceX + distanceY * distanceY;

					//Check if it was more like a tap (moved less than 7px).
					if(distance2 < 49) {
						//It was a tap, click the element.
						initialElement.focus();
                                                if (typeof initialElement.click === 'function') {
                                                    initialElement.click();
                                                }

						return;
					}

					initialElement = undefined;

					var speed = deltaY / deltaTime;

					//Cap speed at 3 pixel/ms.
					speed = Math.max(Math.min(speed, 3), -3);

					var duration = Math.abs(speed / MOBILE_DECELERATION);
					var targetOffset = speed * duration + 0.5 * MOBILE_DECELERATION * duration * duration;
					var targetTop = _this.getScrollTop() - targetOffset;

					//Relative duration change for when scrolling above bounds.
					var targetRatio = 0;

					//Change duration proportionally when scrolling would leave bounds.
					if(targetTop > _this._maxKeyFrame) {
						targetRatio = (_this._maxKeyFrame - targetTop) / targetOffset;

						targetTop = _this._maxKeyFrame;
					} else if(targetTop < 0) {
						targetRatio = -targetTop / targetOffset;

						targetTop = 0;
					}

					duration = duration * (1 - targetRatio);

					_this.animateTo(targetTop, {easing: 'outCubic', duration: duration});
					break;
			}
		});

		//Just in case there has already been some native scrolling, reset it.
		window.scrollTo(0, 0);
		documentElement.style.overflow = body.style.overflow = 'hidden';
	};

	/**
	 * Updates key frames which depend on others.
	 * That is "end" in "absolute" mode and all key frames in "relative" mode.
	 */
	var _updateDependentKeyFrames = function() {
		var skrollable;
		var element;
		var anchorTarget;
		var keyFrames;
		var keyFrameIndex;
		var keyFramesLength;
		var kf;
		var skrollableIndex;
		var skrollablesLength;

		//First process all relative-mode elements and find the max key frame.
		skrollableIndex = 0;
		skrollablesLength = this._skrollables.length;

		for(; skrollableIndex < skrollablesLength; skrollableIndex++) {
			skrollable = this._skrollables[skrollableIndex];
			element = skrollable.element;
			anchorTarget = skrollable.anchorTarget;
			keyFrames = skrollable.keyFrames;

			keyFrameIndex = 0;
			keyFramesLength = keyFrames.length;

			for(; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
				kf = keyFrames[keyFrameIndex];

				if(kf.mode === 'relative') {
					_reset(element);

					kf.frame = this.relativeToAbsolute(anchorTarget, kf.anchors[0], kf.anchors[1]) - kf.offset;

					_reset(element, true);
				}

				//Only search for max key frame when forceHeight is enabled.
				if(this._forceHeight) {
					//Find the max key frame, but don't use one of the data-end ones for comparison.
					if(!kf.isEnd && kf.frame > this._maxKeyFrame) {
						this._maxKeyFrame = kf.frame;
					}
				}
			}
		}

		//#133: The document can be larger than the maxKeyFrame we found.
		this._maxKeyFrame = Math.max(this._maxKeyFrame, _getDocumentHeight.call(this));

		//Now process all data-end keyframes.
		skrollableIndex = 0;
		skrollablesLength = this._skrollables.length;

		for(; skrollableIndex < skrollablesLength; skrollableIndex++) {
			skrollable = this._skrollables[skrollableIndex];
			keyFrames = skrollable.keyFrames;

			keyFrameIndex = 0;
			keyFramesLength = keyFrames.length;

			for(; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
				kf = keyFrames[keyFrameIndex];

				if(kf.isEnd) {
					kf.frame = this._maxKeyFrame - kf.offset;
				}
			}
		}
	};

	/**
	 * Calculates and sets the style properties for the element at the given frame.
	 * @param fakeFrame The frame to render at when smooth scrolling is enabled.
	 * @param actualFrame The actual frame we are at.
	 */
	var _calcSteps = function(fakeFrame, actualFrame) {
		//Iterate over all skrollables.
		var skrollableIndex = 0;
		var skrollablesLength = this._skrollables.length;

		for(; skrollableIndex < skrollablesLength; skrollableIndex++) {
			var skrollable = this._skrollables[skrollableIndex];
			var element = skrollable.element;
			var frame = skrollable.smoothScrolling ? fakeFrame : actualFrame;
			var frames = skrollable.keyFrames;
			var firstFrame = frames[0].frame;
			var lastFrame = frames[frames.length - 1].frame;
			var beforeFirst = frame < firstFrame;
			var afterLast = frame > lastFrame;
			var firstOrLastFrame = frames[beforeFirst ? 0 : frames.length - 1];
			var key;
			var value;

			//If we are before/after the first/last frame, set the styles according to the given edge strategy.
			if(beforeFirst || afterLast) {
				//Check if we already handled this edge case last time.
				//Note: using setScrollTop it's possible that we jumped from one edge to the other.
				if(beforeFirst && skrollable.edge === -1 || afterLast && skrollable.edge === 1) {
					continue;
				}

				//Add the skrollr-before or -after class.
				_updateClass(element, [beforeFirst ? SKROLLABLE_BEFORE_CLASS : SKROLLABLE_AFTER_CLASS], [SKROLLABLE_BETWEEN_CLASS]);

				//Remember that we handled the edge case (before/after the first/last keyframe).
				skrollable.edge = beforeFirst ? -1 : 1;

				switch(skrollable.edgeStrategy) {
					case 'reset':
						_reset(element);
						continue;
					case 'set':
						var props = firstOrLastFrame.props;

						for(key in props) {
							if(hasProp.call(props, key)) {
								value = _interpolateString(props[key].value);

								_setStyle(element, key, value);
							}
						}

						continue;
					default:
					case 'ease':
						//Handle this case like it would be exactly at first/last keyframe and just pass it on.
						frame = firstOrLastFrame.frame;
						break;
				}
			} else {
				//Did we handle an edge last time?
				if(skrollable.edge !== 0) {
					_updateClass(element, [SKROLLABLE_CLASS, SKROLLABLE_BETWEEN_CLASS], [SKROLLABLE_BEFORE_CLASS, SKROLLABLE_AFTER_CLASS]);
					skrollable.edge = 0;
				}
			}

			//Find out between which two key frames we are right now.
			var keyFrameIndex = 0;
			var framesLength = frames.length - 1;

			for(; keyFrameIndex < framesLength; keyFrameIndex++) {
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

							_setStyle(element, key, value);
						}
					}

					break;
				}
			}
		}
	};

	/**
	 * Renders all elements.
	 */
	var _render = function() {
		//We may render something else than the actual scrollbar position.
		var renderTop = this.getScrollTop();

		//If there's an animation, which ends in current render call, call the callback after rendering.
		var afterAnimationCallback;
		var now = _now();
		var progress;

		//Before actually rendering handle the scroll animation, if any.
		if(this._scrollAnimation) {
			//It's over
			if(now >= this._scrollAnimation.endTime) {
				renderTop = this._scrollAnimation.targetTop;
				afterAnimationCallback = this._scrollAnimation.done;
				this._scrollAnimation = undefined;
			} else {
				//Map the current progress to the new progress using given easing function.
				progress = this._scrollAnimation.easing((now - this._scrollAnimation.startTime) / this._scrollAnimation.duration);

				renderTop = (this._scrollAnimation.startTop + progress * this._scrollAnimation.topDiff) | 0;
			}

			this.setScrollTop(renderTop);
		}
		//Smooth scrolling only if there's no animation running and if we're not on mobile.
		else if(!this._isMobile) {
			var smoothScrollingDiff = this._smoothScrolling.targetTop - renderTop;

			//The user scrolled, start new smooth scrolling.
			if(smoothScrollingDiff) {
				this._smoothScrolling = {
					startTop: this._lastTop,
					topDiff: renderTop - this._lastTop,
					targetTop: renderTop,
					startTime: this._lastRenderCall,
					endTime: this._lastRenderCall + SMOOTH_SCROLLING_DURATION
				};
			}

			//Interpolate the internal scroll position (not the actual scrollbar).
			if(now <= this._smoothScrolling.endTime) {
				//Map the current progress to the new progress using easing function.
				progress = easings.sqrt((now - this._smoothScrolling.startTime) / SMOOTH_SCROLLING_DURATION);

				renderTop = (this._smoothScrolling.startTop + progress * this._smoothScrolling.topDiff) | 0;
			}
		}

		//Did the scroll position even change?
		if(this._forceRender || this._lastTop !== renderTop) {
			//Remember in which direction are we scrolling?
			this._direction = (renderTop >= this._lastTop) ? 'down' : 'up';

			this._forceRender = false;

			var listenerParams = {
				curTop: renderTop,
				lastTop: this._lastTop,
				maxTop: this._maxKeyFrame,
				direction: this._direction
			};

			//Tell the listener we are about to render.
			var continueRendering = this._listeners.beforerender && this._listeners.beforerender.call(this, listenerParams);

			//The beforerender listener function is able the cancel rendering.
			if(continueRendering !== false) {
				//Now actually interpolate all the styles.
				_calcSteps.call(this, renderTop, this.getScrollTop());

				//Remember when we last rendered.
				this._lastTop = renderTop;

				if(this._listeners.render) {
					this._listeners.render.call(this, listenerParams);
				}
			}

			if(afterAnimationCallback) {
				afterAnimationCallback.call(this, false);
			}
		}

		this._lastRenderCall = now;
	};

	/**
	 * Parses the properties for each key frame of the given skrollable.
	 */
	var _parseProps = function(skrollable) {
		//Iterate over all key frames
		var keyFrameIndex = 0;
		var keyFramesLength = skrollable.keyFrames.length;

		for(; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
			var frame = skrollable.keyFrames[keyFrameIndex];
			var easing;
			var value;
			var prop;
			var props = {};

			var match;

			while((match = rxPropValue.exec(frame.props)) !== null) {
				prop = match[1];
				value = match[2];

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
				props[prop] = {
					value: value,
					easing: easings[easing]
				};
			}

			frame.props = props;
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
		if(theDashedCSSPrefix) {
			rxGradient.lastIndex = 0;
			val = val.replace(rxGradient, function(s) {
				return theDashedCSSPrefix + s;
			});
		}

		//Now parse ANY number inside this string and create a format string.
		val = val.replace(rxNumericValue, function(n) {
			numbers.push(+n);
			return '{?}';
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
		var keyFramesLength;

		//Iterate over all key frames from left to right
		keyFrameIndex = 0;
		keyFramesLength = sk.keyFrames.length;

		for(; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
			_fillPropForFrame(sk.keyFrames[keyFrameIndex], propList);
		}

		//Now do the same from right to fill the last gaps

		propList = {};

		//Iterate over all key frames from right to left
		keyFrameIndex = sk.keyFrames.length - 1;

		for(; keyFrameIndex >= 0; keyFrameIndex--) {
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
		var valueIndex;
		var val1Length = val1.length;

		//They both need to have the same length
		if(val1Length !== val2.length) {
			throw 'Can\'t interpolate between "' + val1[0] + '" and "' + val2[0] + '"';
		}

		//Add the format string as first element.
		var interpolated = [val1[0]];

		valueIndex = 1;

		for(; valueIndex < val1Length; valueIndex++) {
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

		rxInterpolateString.lastIndex = 0;

		return val[0].replace(rxInterpolateString, function() {
			return val[valueIndex++];
		});
	};

	/**
	 * Resets the class and style attribute to what it was before skrollr manipulated the element.
	 * Also remembers the values it had before reseting, in order to undo the reset.
	 */
	var _reset = function(elements, undo) {
		//We accept a single element or an array of elements.
		elements = [].concat(elements);

		var skrollable;
                var skrollables = this._skrollables;
		var element;
		var elementsIndex = 0;
		var elementsLength = elements.length;

		for(; elementsIndex < elementsLength; elementsIndex++) {
			element = elements[elementsIndex];
			skrollable = skrollables[element[SKROLLABLE_ID_DOM_PROPERTY]];

			//Couldn't find the skrollable for this DOM element.
			if(!skrollable) {
				continue;
			}

			if(undo) {
				//Reset class and style to the "dirty" (set by skrollr) values.
				element.style.cssText = skrollable.dirtyStyleAttr;
				_updateClass(element, skrollable.dirtyClassAttr);
			} else {
				//Remember the "dirty" (set by skrollr) class and style.
				skrollable.dirtyStyleAttr = element.style.cssText;
				skrollable.dirtyClassAttr = _getClass(element);

				//Reset class and style to what it originally was.
				element.style.cssText = skrollable.styleAttr;
				_updateClass(element, skrollable.classAttr);
			}
		}
	};

	/**
	 * Detects support for 3d transforms by applying it to the skrollr-body.
	 */
	var _detect3DTransforms = function() {
		this._translateZ = 'translateZ(0)';
		_setStyle(this._skrollrBody, 'transform', this._translateZ);

		var computedStyle = getStyle(this._skrollrBody);
		var computedTransform = computedStyle.getPropertyValue('transform');
		var computedTransformWithPrefix = computedStyle.getPropertyValue(theDashedCSSPrefix + 'transform');
		var has3D = (computedTransform && computedTransform !== 'none') || (computedTransformWithPrefix && computedTransformWithPrefix !== 'none');

		if(!has3D) {
			this._translateZ = '';
		}
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
		//#64: "float" can't be set across browsers. Needs to use "cssFloat" for all except IE.
		else if(prop === 'float') {
			style.styleFloat = style.cssFloat = val;
		}
		else {
			//Need try-catch for old IE.
			try {
				//Set prefixed property if there's a prefix.
				if(theCSSPrefix) {
					style[theCSSPrefix + prop.slice(0,1).toUpperCase() + prop.slice(1)] = val;
				}

				//Set unprefixed.
				style[prop] = val;
			} catch(ignore) {}
		}
	};

	/**
	 * Cross browser event handling.
	 */
	var _addEvent = function(element, names, callback) {
		var intermediate = function(e) {
			//Normalize IE event stuff.
			e = e || window.event;

			if(!e.target) {
				e.target = e.srcElement;
			}

			if(!e.preventDefault) {
				e.preventDefault = function() {
					e.returnValue = false;
				};
			}

			return callback.call(this, e);
		};

		names = names.split(' ');

		var nameCounter = 0;
		var namesLength = names.length;

		for(; nameCounter < namesLength; nameCounter++) {
			if(element.addEventListener) {
				element.addEventListener(names[nameCounter], callback, false);
			} else {
				element.attachEvent('on' + names[nameCounter], intermediate);
			}
		}
	};

	var _reflow = function() {
		var pos = this.getScrollTop();

		//Will be recalculated by _updateDependentKeyFrames.
		this._maxKeyFrame = 0;

		if(this._forceHeight && !this._isMobile) {
			//un-"force" the height to not mess with the calculations in _updateDependentKeyFrames (#216).
			body.style.height = 'auto';
		}

		_updateDependentKeyFrames.call(this);

		if(this._forceHeight && !this._isMobile) {
			//"force" the height.
			body.style.height = (this._maxKeyFrame + documentElement.clientHeight) + 'px';
		}

		//The scroll offset may now be larger than needed (on desktop the browser/os prevents scrolling farther than the bottom).
		if(this._isMobile) {
			this.setScrollTop(Math.min(this.getScrollTop(), this._maxKeyFrame));
		} else {
			//Remember and reset the scroll pos (#217).
			this.setScrollTop(pos, true);
		}

		this._forceRender = true;

                if (this.iscroll) {
                        var _iscroll = this.iscroll;
                        window.setTimeout(function () {
                                _iscroll.refresh();
                        }, 0);
                }
	};

	/*
	 * Returns the height of the document.
	 */
	var _getDocumentHeight = function() {
		var skrollrBodyHeight = (this._skrollrBody && this._skrollrBody.offsetHeight || 0);
		var bodyHeight = Math.max(skrollrBodyHeight, body.scrollHeight, body.offsetHeight, documentElement.scrollHeight, documentElement.offsetHeight, documentElement.clientHeight);

		return bodyHeight - documentElement.clientHeight;
	};

	/**
	 * Returns a string of space separated classnames for the current element.
	 * Works with SVG as well.
	 */
	var _getClass = function(element) {
		var prop = 'className';

		//SVG support by using className.baseVal instead of just className.
		if(window.SVGElement && element instanceof window.SVGElement) {
			element = element[prop];
			prop = 'baseVal';
		}

		return element[prop];
	};

	/**
	 * Adds and removes a CSS classes.
	 * Works with SVG as well.
	 * add and remove are arrays of strings,
	 * or if remove is ommited add is a string and overwrites all classes.
	 */
	var _updateClass = function(element, add, remove) {
		var prop = 'className';

		//SVG support by using className.baseVal instead of just className.
		if(window.SVGElement && element instanceof window.SVGElement) {
			element = element[prop];
			prop = 'baseVal';
		}

		//When remove is ommited, we want to overwrite/set the classes.
		if(remove === undefined) {
			element[prop] = add;
			return;
		}

		//Cache current classes. We will work on a string before passing back to DOM.
		var val = element[prop];

		//All classes to be added.
		var classAddIndex = 0;
		var addLength = add.length;

		for(; classAddIndex < addLength; classAddIndex++) {
			//Only add if el not already has class.
			if(_untrim(val).indexOf(_untrim(add[classAddIndex])) === -1) {
				val += ' ' + add[classAddIndex];
			}
		}

		//All classes to be removed.
		var classRemoveIndex = 0;
		var removeLength = remove.length;

		for(; classRemoveIndex < removeLength; classRemoveIndex++) {
			val = _untrim(val).replace(_untrim(remove[classRemoveIndex]), ' ');
		}

		element[prop] = _trim(val);
	};

	var _trim = function(a) {
		return a.replace(rxTrim, '');
	};

	/**
	 * Adds a space before and after the string.
	 */
	var _untrim = function(a) {
		return ' ' + a + ' ';
	};

	var _now = Date.now || function() {
		return +new Date();
	};

	var _keyFrameComparator = function(a, b) {
		return a.frame - b.frame;
	};

	/*
	 * Private variables.
	 */

	/*
		A list of all elements which should be animated associated with their the metadata.
		Exmaple skrollable with two key frames animating from 100px width to 20px:

		skrollable = {
			element: <the DOM element>,
			styleAttr: <style attribute of the element before skrollr>,
			classAttr: <class attribute of the element before skrollr>,
			keyFrames: [
				{
					frame: 100,
					props: {
						width: {
							value: ['{?}px', 100],
							easing: <reference to easing function>
						}
					},
					mode: "absolute"
				},
				{
					frame: 200,
					props: {
						width: {
							value: ['{?}px', 20],
							easing: <reference to easing function>
						}
					},
					mode: "absolute"
				}
			]
		};
	*/

}(window, document));
