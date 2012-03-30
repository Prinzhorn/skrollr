/*
 * TODO
 *	-foreach skrollabls
 *		-iterate over all keyFrames in order (small to large)
 *		-set properties from small keyFrames to large keyFrames if missing to allow starting from !== 0
 * 			Otherwise when starting from e.g. 500, and there are keyFrames for 100 and 300 we miss the values from 100
 *
 *	-Did this. Now I think it would make more sense to interpolate the frames in between.
 *	-And what about other direction (right hand)?
 */

(function(document, undefined) {
	var noop = function() {};

	var rxKeyframeAttribute = /^data-(\d+)$/;
	var rxPropSplit = /:|;/g;
	var rxPropEasing = /([a-z-]+)\[(\w+)\]/;
	var rxCamelCase = /-([a-z])/g;
	var rxNumericValue = /(?:^|\s+)((?:-|\+)?[0-9.]+)(%|px|em|ex|pt|in|cm|mm|pc|deg)?/g;
	var rxTransformValue = /((?:rotate)|(?:scale(?:X|Y)?)|(?:skew(?:X|Y)?))\((.+?)\)/g;

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
			return (-Math.cos(p * Math.PI) / 2) + 0.5;
		}
	};

	//Bounce easing
	(function() {
		function f(x, a) {
			return 1 - Math.abs(3 * Math.cos(x * a * 1.028) / a);
		};

		easings['bounce'] = function(p, a) {
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

			return f(p, a);
		}
	})();

	/**
	 * List of parser and steps for different kind of value types.
	 * Parser: Parses a value to a specific format which a Step can handle.
	 * Step: A function which gets the output of two Parsers and interpolates the value for a given progress.
	 */
	var parsersAndSteps = {
		//Simple constant values which won't be interpolated.
		constant: {
			/**
			* Doesn't interpolate at all.
			*/
			step: function(val) {
				return val;
			}
		},
		//Simple numeric values with unit which can easily be interpolated.
		//Not used directly, only by composedNumeric.
		numeric: {
			/**
			 * Parses a single numeric value with optional unit.
			 * @return An array with the numeric value at first position and the unit at second position.
			 */
			parser: function(val, match) {
				rxNumericValue.lastIndex = 0;

				match = rxNumericValue.exec(val);

				if(match === null) {
					throw 'Can\'t parse "' + val + '" as numeric value.'
				}

				return [parseFloat(match[1], 10), match[2] || ''];
			},
			/**
			 * Calculates the new value by interpolating between val1 and val2 using the given easing.
			 * If only the first parameter is specified, it just sets the value.
			 */
			step: function(val1, val2, progress) {
				if(val2 === undefined) {
					return val1[0] + val1[1];
				}

				//Check if the units are the same
				if(val1[1] !== val2[1]) {
					throw "Can't interpolate between '" + val[0] + val1[1] + "' and '" + val1[0] + val2[1] + "'";
				}

				return (val1[0] + ((val2[0] - val1[0]) * progress)) + val1[1];
			}
		},
		//Values which are composed of multipe numeric values like "0% 0%"
		composedNumeric: {
			/**
			 * Parses a value which is composed of multiple numeric values separated by a single space.
			 * @return An array of arrays. See "numeric.parser" for info about the individual arrays.
			 */
			parser: function(all, values) {
				values = [];

				for(var i = 0; i < all.length; i++) {
					//Use the simple numeric parser for the indiviual values
					values.push(parsersAndSteps.numeric.parser(all[i]));
				}

				return values;
			},
			step: function(val1, val2, progress, stepped) {
				stepped = [];

				if(val2 === undefined) {
					for(var i = 0; i < val1.length; i++) {
						stepped.push(parsersAndSteps.numeric.step(val1[i]));
					}
				} else {
					if(val1.length !== val2.length) {
						throw "Can't interpolate between two composed values with different number of values.";
					}

					for(var i = 0; i < val1.length; i++) {
						stepped.push(parsersAndSteps.numeric.step(val1[i], val2[i], progress));
					}
				}

				return stepped.join(' ');
			}
		},
		transform: {
			parser: function(all, values, match) {
				values = [];

				for(var i = 0; i < all.length; i++) {
					rxTransformValue.lastIndex = 0;

					match = rxTransformValue.exec(all[i]);

					//The transform function
					values.push(match[1]);

					//Use the simple numeric parser for the indiviual values
					values.push(parsersAndSteps.numeric.parser(match[2]));
				}

				return values;
			},
			step: function(val1, val2, progress, ret) {
				ret = [];

				if(val2 === undefined) {
					for(var i = 0; i < val1.length - 1; i += 2) {
						ret.push(val1[i] + '(' + val1[i + 1].join('') + ')');
					}
				} else {
					for(var i = 0; i < val1.length - 1; i += 2) {
						ret.push(val1[i] + '(' + parsersAndSteps.numeric.step(val1[i + 1], val2[i + 1], progress) + ')');
					}
				}

				return ret.join(' ');
			}
		},
		color: {
			parser: function(val) {
				return val;
			},
			step: function(val1, val2, progress, easing) {
				return val1;
			}
		}
	};

	/**
	 * Constructor.
	 */
	function Skrollr(options) {
		var self = this;

		options = options || {};

		self.easings = easings;

		//We allow defining custom easings or overwrite existing
		if(options.easing) {
			for(var e in options.easing) {
				if(Skrollr.hasProp(options.easing, e)) {
					self.easings[e] = options.easing[e];
				}
			}
		}

		//The container element. The parent of all skrollables.
		self.container = document.getElementsByTagName('body')[0];

		//Scale factor to scale keyFrames.
		self.scale = options.scale || 1;

		self.listeners = {
			//Function to be called when scolling
			scroll: options.scroll || noop
		};

		//A list of all elements which should be animated associated with their the data.
		self.skrollables = [];

		//Will contain the max data-end value available.
		self.maxKeyFrame = 0;



		var allElements = self.container.getElementsByTagName('*');

		//Iterate over all elements inside the container.
		for(var i = 0; i < allElements.length; i++) {
			var
				el = allElements[i];
				fx = {},
				keyFrames = [];


			//Iterate over all attributes and search for keyframe attributes.
			for (var k = 0; k < el.attributes.length; k++) {
				var
					attr = el.attributes[k],
					match = attr.name.match(rxKeyframeAttribute);

				if(match !== null) {
					var frame = (match[1] | 0) * self.scale;

					keyFrames.push({
						frame: frame,
						props: attr.value
					});

					if(frame > this.maxKeyFrame) {
						self.maxKeyFrame = frame;
					}
				}
			}


			//Does this element have keyframes?
			if(keyFrames.length) {
				keyFrames.sort(function(a, b) {
					return a.frame - b.frame;
				});

				var sk = {
					element: el,
					keyFrames: keyFrames
				};

				//Parse the property string into objects
				self._parseProps(sk);

				//Fill keyFrames with missing left hand properties
				self._fillProps(sk);

				self.skrollables.push(sk);

				el.className += ' skrollable';
			}
		}

		var s = self.container.style;

		s.overflow = 'auto';
		s.overflowX = 'hidden';
		s.position = 'relative';

		//Add a dummy element in order to get a large enough scrollbar
		self.dummy = document.createElement('div');

		s = self.dummy.style;

		s.width = '1px';
		s.height = (self.maxKeyFrame + Skrollr.getViewportHeight()) + 'px';
		s.position = 'absolute';
		s.left = '0px';
		s.top = '0px';
		s.zIndex = '0';
		s.background = 'transparent';

		self.container.appendChild(self.dummy);

		//TODO add some throttle to scroll event
		self.onScroll = function() {
			var top = Skrollr.getScrollTop();

			self.listeners.scroll(top);

			self._render(top);
		};

		//Make sure everything loads correctly
		self.onScroll(Skrollr.getScrollTop());

		//Let's go
		Skrollr.addEventListener(document, 'scroll', self.onScroll);

		return self;
	}

	Skrollr.prototype.setScrollTop = function(top) {
		pageYOffset = top;
		document.body.scrollTop = top;
		document.documentElement.scrollTop = top;

		this.onScroll();
	};

	/**
	 * Calculate and sets the style properties for the element at the given frame
	 */
	Skrollr.prototype._calcSteps = function(skrollable, frame) {
		var frames = skrollable.keyFrames;

		//We are before the first frame, don't do anything
		if(frame < frames[0].frame) {
			//Skrollr.setStyle(skrollable.element, 'display', 'none');
		}
		//We are after the last frame, the element gets all props from last keyFrame
		else if(frame > frames[frames.length - 1].frame) {
			Skrollr.setStyle(skrollable.element, 'display', 'block');

			var last = frames[frames.length - 1], value;

			for(var key in last.props) {
				if(Skrollr.hasProp(last.props, key)) {
					value = last.props[key].step(last.props[key].value);

					Skrollr.setStyle(skrollable.element, key, value);
				}
			}
		}
		//We are between two frames
		else {
			Skrollr.setStyle(skrollable.element, 'display', 'block');

			//Find out between which two keyFrames we are right now
			for(var i = 0; i < frames.length - 1; i++) {
				if(frame >= frames[i].frame && frame <= frames[i + 1].frame) {
					var left, right;

					left = frames[i];
					right = frames[i + 1];

					for(var key in left.props) {
						if(Skrollr.hasProp(left.props, key)) {

							//If the left keyframe has a property which the right doesn't, we just set it without interprolating
							if(!Skrollr.hasProp(right.props, key)) {
								var value = left.props[key].step(left.props[key].value);

								Skrollr.setStyle(skrollable.element, key, value);
							} else {
								var progress = (frame - left.frame) / (right.frame - left.frame);

								progress = left.props[key].easing(progress);

								var value = left.props[key].step(left.props[key].value, right.props[key].value, progress);

								Skrollr.setStyle(skrollable.element, key, value);
							}
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
	Skrollr.prototype._render = function(top) {
		for(var i = 0; i < this.skrollables.length; i++) {
			this._calcSteps(this.skrollables[i], top);
		}

		return this;
	};

	/**
	 * Parses the properties for each keyFrame of the given skrollable.
	 */
	Skrollr.prototype._parseProps = function(skrollable) {
		var self = this;

		//Iterate over all keyframes
		for(var i = 0; i < skrollable.keyFrames.length; i++) {
			var
				frame = skrollable.keyFrames[i],
				//Get all properties and values in an array
				allProps = frame.props.split(rxPropSplit),
				prop, value, easing;

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

				//Save the prop for this keyframe with his value and easing function
				frame.props[prop] = {
					value: value.value,
					step: value.step,
					easing: self.easings[easing]
				};
			}
		}
	};

	/**
	 * Parses a value using a parser. Tries to guess which parser to use.
	 */
	Skrollr.prototype._parseProp = function(val) {
		//Guess what type of value it is
		switch (false) {
			//Could be a transform value
			case !(m = val.match(rxTransformValue)):
				val = parsersAndSteps.transform.parser(m);

				return {
					value: val,
					step: parsersAndSteps.transform.step
				};
			//Could be a color
			case !(m = val.match(/bbbbbbbbbbbbbbbbbbbbbb/)):
				break;
			//Could be a numeric value
			case !(m = val.match(rxNumericValue)):
				val = parsersAndSteps.composedNumeric.parser(m);

				return {
					value: val,
					step: parsersAndSteps.composedNumeric.step
				};
			//Must be a constant value
			default:
				return {
					value: val,
					step: parsersAndSteps.constant.step
				}
		}
	}

	/**
	 * Fills the keyFrames with missing left hand properties.
	 * If keyFrame 1 has property X and keyFrame 2 is missing X,
	 * but keyFrame 3 has X again, then we need to assign X to keyFrame 2 too.
	 *
	 * @param sk A skrollable.
	 */
	Skrollr.prototype._fillProps = function(sk) {
		//Will collect the properties keyFrame by keyFrame from left to right
		var leftProps = {}, frame;

		//Iterate over all keyFrames
		for(var i = 0; i < sk.keyFrames.length; i++) {
			frame = sk.keyFrames[i];

			//For each keyframe iterate over all left hand properties and assign them,
			//but only if the current keyFrame doesn't have the property by itself
			for(var key in leftProps) {
				//The current frame misses this property, so assign it.
				if(!Skrollr.hasProp(frame.props, key)) {
					frame.props[key] = leftProps[key];
				}
			}

			//Iterate over all props of the current frame and collect them
			for(var key in frame.props) {
				leftProps[key] = frame.props[key];
			}
		}
	};


	/*
		Public static helpers
	*/
	Skrollr.getViewportHeight = function() {
		return document.documentElement.clientHeight;
	};

	/**
		Get an elements top scrollbar offset.
	*/
	Skrollr.getScrollTop = function() {
		return pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

		/*
		if(typeof pageYOffset!= 'undefined'){
			//most browsers
			return pageYOffset;
		}
		else{
			var B= document.body; //IE 'quirks'
			var D= document.documentElement; //IE with doctype
			D= (D.clientHeight)? D: B;
			return D.scrollTop;
		}
		*/
	};

	/**
		Attach an event handler to a DOM element
	*/
	Skrollr.addEventListener = function(el, type, fn) {
		if (el.addEventListener) {
			el.addEventListener(type, fn, false);
		} else if (elem.attachEvent) {
			el.attachEvent('on' + type, fn);
		}
	};

	/**
	 * Set the style property on the given element. Adds prefixes where needed.
	 */
	Skrollr.setStyle = function(el, prop, val) {
		prop = Skrollr.camelCase(prop);

		el.style[prop] = val;

		//TODO find some intelligent way to not hardcode those
		if(prop === 'transform' || prop === 'transformOrigin') {
			prop = prop.substr(1);

			for(var i = 0, arr = ['OT', 'MozT', 'webkitT', 'msT', 't']; i < arr.length; i++) {
				el.style[arr[i] + prop] = val;
			}
		}
	};


	Skrollr.camelCase = function(text) {
		return text.replace(rxCamelCase, function(str, p1) {
			return p1.toUpperCase();
		}).replace('-', '');
	};

	/**
	 * Returns true if the object has an own property with this name.
	 */
	Skrollr.hasProp = function(obj, prop) {
		return Object.prototype.hasOwnProperty.call(obj, prop);
	};


	//Global api
	window.skrollr = {
		//Main entry point
		init: function(options) {
			return new Skrollr(options);
		}
	};
}(document));
