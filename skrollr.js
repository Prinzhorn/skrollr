(function(document, undefined) {
	var noop = function() {};

	var M = Math;
	var intval = parseInt;
	var floatval = parseFloat;

	var rxTrim = /^\s*(.*)\s$/;
	var rxKeyframeAttribute = /^data-(\d+|(?:end))$/;
	var rxPropSplit = /:|;/g;
	var rxPropEasing = /^([a-z-]+)\[(\w+)\]$/;
	var rxCamelCase = /-([a-z])/g;
	var rxNumericValue = /(?:^|\s+)((?:-|\+)?[0-9.]+)(%|px|em|ex|pt|in|cm|mm|pc|deg)?/g;
	var rxTransformValue = /((?:rotate)|(?:scale(?:X|Y)?)|(?:skew(?:X|Y)?))\((.+?)\)/g;
	var rxColorValue = /^((?:rgba?)|(?:hsla?))\((\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*(?:,\s*([0-9.]+))?\)$/;

	var supportsCSS3Colors = true;
	try {
		//IE will throw an exception
		document.createElement('a').style.color = 'hsl(0,0%,0%,1)';
	} catch(e) {
		supportsCSS3Colors = false;
	}

	var bounceHelper = function f(x, a) {
		return 1 - M.abs(3 * M.cos(x * a * 1.028) / a);
	};

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
			return (-M.cos(p * M.PI) / 2) + .5;
		},
		//see https://www.desmos.com/calculator/tbr20s8vd2 for how I did this
		bounce: function(p, a) {
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

			return bounceHelper(p, a);
		}
	};

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

				return [floatval(match[1], 10), match[2] || ''];
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
			/**
			 * Calculates the new values by interpolating between the values in val1 and val2 using the given easing.
			 * See "numeric.step" for more info.
			 */
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
		//scale, roate, skew
		transform: {
			/**
			 * Parses a value which is composed of multiple transform functions.
			 * @return An array with an even number of entries. All odd entries contain the name of a transform function and all even entries contain the result of "numeric.parser"
			 */
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
			/**
			 * Interpolates between multiple transform functions by using "numeric.step" on each value.
			 */
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
		//rgb(a) and hsl(a) colors (no #fff or #ffffff)
		color: {
			/**
			 * Parses a rgba or hslv value.
			 * @return An array where the first entry is either the string "rgba" or "hsla" and the following four entries are results of "numeric.parser" on r,g,b,h,s,l or a values.
			 */
			parser: function(val) {
				//remove the first element, which is the fully matched string
				val.shift();

				//is there a alpha part?
				if(val[4] === undefined) {
					val[4] = 1;
				}

				//rgb or hsl without "a" at the end
				if(val[0].length === 3) {
					val[0] += 'a';
				}

				//turn them strings into numbers
				val[1] = intval(val[1], 10);
				val[2] = intval(val[2], 10);
				val[3] = intval(val[3], 10);
				val[4] = floatval(val[4], 10);

				var unit = '';

				//add percentage unit when using hsla
				if(val[0] === 'hsla') {
					unit = '%';
				}

				//add the unit (empty string is unit-less/no-unit)
				val[1] = [val[1], ''];
				val[2] = [val[2], unit];
				val[3] = [val[3], unit];
				val[4] = [val[4], ''];

				return val;
			},
			/**
			 * Interpolates between two colors. No matter if it's rgba or hsla, the interpolation is done by using "numeric.step" on any of r,g,b,h,s,l and a.
			 * For browsers that don't support rgba, hsl and hsla (IE, I'm looking at you), we will always return hex rgb.
			 */
			step: function(val1, val2, progress) {
				if(val2 === undefined) {
					return parsersAndSteps.color.toString(val1);
				}

				//now we are going to interpolate the colors
				//we don't care if it's rgba or hlsa, we just call it xyza
				var res = [val1[0]];

				//xyz
				for(var i = 1; i < 4; i++) {
					res[i] = [
						intval(parsersAndSteps.numeric.step(val1[i], val2[i], progress), 10),
						val1[i][1]
					];
				}

				//a
				res[4] = [
					floatval(parsersAndSteps.numeric.step(val1[4], val2[4], progress), 10),
					val1[4][1]
				];

				return parsersAndSteps.color.toString(res);
			},
			/**
			 * Will turn the color value into a property string.
			 * Return rgba values if hsla is unsupported.
			 */
			toString: function(val) {
				//make ie "support" hsla and rgba by mapping it to hex
				if(!supportsCSS3Colors) {
					if(val[0] === 'hsla') {
						return hsl2hex(val[1][0], val[2][0], val[3][0]);
					} else {
						return rgb2hex(val[1][0], val[2][0], val[3][0]);
					}
				}

				var res = val.slice(1);

				//concat values and units
				for(var i = 0; i < 4; i++) {
					res[i] = res[i].join('');
				}

				return val[0] + '(' + res.join(',') + ')';
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
				self.easings[e] = options.easing[e];
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

		/*
			A list of all elements which should be animated associated with their the metadata.
			Exmaple skrollable with two keyFrames animating from 100px width to 20px:

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

		//Will contain the max keyFrame value available.
		self.maxKeyFrame = 0;



		var
			allElements = self.container.getElementsByTagName('*'),
			atEndKeyFrames = [];

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
					var frame, kf;

					frame = (match[1] | 0) * self.scale;

					kf = {
						frame: frame,
						props: attr.value
					};

					keyFrames.push(kf);

					//special handling for data-end
					if(match[1] === 'end') {
						atEndKeyFrames.push(kf);
					}

					if(frame > this.maxKeyFrame) {
						self.maxKeyFrame = frame;
					}
				}
			}

			//Does this element have keyframes?
			if(keyFrames.length) {
				self.skrollables.push({
					element: el,
					keyFrames: keyFrames
				});

				addClass(el, 'skrollable');
			}
		}

		//Set all data-end keyFrames to max keyframe
		for(var i = 0; i < atEndKeyFrames.length; i++) {
			atEndKeyFrames[i].frame = self.maxKeyFrame;
		}

		atEndKeyFrames = null;

		//Now that we got all keyFrame numbers right, actually parse the properties.
		for(var i = 0; i < self.skrollables.length; i++) {
			var sk = self.skrollables[i];

			//Make sure they are in order
			sk.keyFrames.sort(function(a, b) {
				return a.frame - b.frame;
			});

			//Parse the property string to objects
			self._parseProps(sk);

			//Fill keyFrames with missing properties from left and right
			self._fillProps(sk);
		}


		//Add a dummy element in order to get a large enough scrollbar
		self.dummy = document.createElement('div');

		var s = self.dummy.style;

		s.width = '1px';
		s.height = (self.maxKeyFrame + getViewportHeight()) + 'px';
		s.position = 'absolute';
		s.right = s.top = '0px';
		s.zIndex = '0';

		s = null;

		self.container.appendChild(self.dummy);

		self.onScroll = function() {
			var top = getScrollTop();

			self.listeners.scroll(top);

			self._render(top);
		};

		//Make sure everything loads correctly
		self.onScroll(getScrollTop());

		//Let's go
		addEvent(window, 'scroll', throttle(self.onScroll, 20));

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
			addClass(skrollable.element, 'hidden');
		}
		//We are after the last frame, the element gets all props from last keyFrame
		else if(frame > frames[frames.length - 1].frame) {
			removeClass(skrollable.element, 'hidden');

			var last = frames[frames.length - 1], value;

			for(var key in last.props) {
				if(hasProp(last.props, key)) {
					value = last.props[key].step(last.props[key].value);

					setStyle(skrollable.element, key, value);
				}
			}
		}
		//We are between two frames
		else {
			removeClass(skrollable.element, 'hidden');

			//Find out between which two keyFrames we are right now
			for(var i = 0; i < frames.length - 1; i++) {
				if(frame >= frames[i].frame && frame <= frames[i + 1].frame) {
					var left, right;

					left = frames[i];
					right = frames[i + 1];

					for(var key in left.props) {
						if(hasProp(left.props, key)) {

							//If the left keyframe has a property which the right doesn't, we just set it without interprolating
							if(!hasProp(right.props, key)) {
								var value = left.props[key].step(left.props[key].value);

								setStyle(skrollable.element, key, value);
							} else {
								var progress = (frame - left.frame) / (right.frame - left.frame);

								progress = left.props[key].easing(progress);

								var value = left.props[key].step(left.props[key].value, right.props[key].value, progress);

								setStyle(skrollable.element, key, value);
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
		switch(false) {
			//Could be a transform value
			case !(m = val.match(rxTransformValue)):
				val = parsersAndSteps.transform.parser(m);

				return {
					value: val,
					step: parsersAndSteps.transform.step
				};
			//Could be a color
			case !(m = val.match(rxColorValue)):
				val = parsersAndSteps.color.parser(m);

				return {
					value: val,
					step: parsersAndSteps.color.step
				};
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
		//Will collect the properties keyFrame by keyFrame
		var propList = {};

		//Iterate over all keyFrames from left to right
		for(var i = 0; i < sk.keyFrames.length; i++) {
			this._fillPropForFrame(sk.keyFrames[i], propList);
		}

		//Now do the same from right to fill the last gaps

		propList = {};

		//Iterate over all keyFrames from right to left
		for(var i = sk.keyFrames.length - 1; i >= 0; i--) {
			this._fillPropForFrame(sk.keyFrames[i], propList);
		}
	};


	Skrollr.prototype._fillPropForFrame = function(frame, propList) {
		//For each keyframe iterate over all right hand properties and assign them,
		//but only if the current keyFrame doesn't have the property by itself
		for(var key in propList) {
			//The current frame misses this property, so assign it.
			if(!hasProp(frame.props, key)) {
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
	 * Gets the height of the viewport
	 */
	var getViewportHeight = function() {
		return document.documentElement.clientHeight;
	};

	/**
	 * Gets the window scroll top offset
	*/
	var getScrollTop = function() {
		return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
	};

	/**
		Attach an event handler to a DOM element
	*/
	var addEvent = function(el, type, fn) {
		if (el.addEventListener) {
			el.addEventListener(type, fn, false);
		} else if (el.attachEvent) {
			el.attachEvent('on' + type, fn);
		}
	};

	/**
	 * Set the css property on the given element. Sets prefixed properties as well.
	 */
	var setStyle = function(el, prop, val) {
		var style = el.style;

		//IE opacity
		if(prop === 'opacity') {
			style.zoom = 1;

			//Remove filter attribute in IE
			if(val >= 1 && style.removeAttribute) {
				style.removeAttribute( "filter" );
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
		prop = prop[0].toUpperCase() + prop.substr(1);

		//TODO maybe find some better way of doing this
		for(var i = 0, arr = ['O', 'Moz', 'webkit', 'ms']; i < arr.length; i++) {
			style[arr[i] + prop] = val;
		}
	};

	/**
	 * Adds a css class.
	 */
	var addClass = function(el, name) {
		if(untrim(el.className).indexOf(untrim(name)) === -1) {
			el.className = (el.className + ' ' + name).replace(rxTrim, '$1');
		}
	};

	/**
	 * Adds a css class.
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
	 * Returns true if the object has an own property with this name.
	 */
	var hasProp = function(obj, prop) {
		if(obj === undefined) {
			alert(1);
		}

		return Object.prototype.hasOwnProperty.call(obj, prop);
	};

	//Credits to aemkei, jed and others
	//Consists of https://gist.github.com/1325937 and https://gist.github.com/983535
	var hsl2hex = function(a,b,c){
		a/=60;c/=100;b=[c+=b*=(c<.5?c:1-c)/100,c-a%1*b*2,c-=b*=2,c,c+a%1*b,c+b];

		return'#'+((256+(b[~~a%6] * 255)<<8|(b[(a|16)%6] * 255))<<8|(b[(a|8)%6] * 255)).toString(16).slice(1)
	};

	//https://gist.github.com/983535
	var rgb2hex = function(a,b,c){return"#"+((256+a<<8|b)<<8|c).toString(16).slice(1)}

	/**
	 * Throttles the given function to not execute more than once in delay ms.
	 */
	var throttle = function(callback, delay) {
		var timer = null, lastTime = 0;

		var fn = function() {
			var now = new Date().getTime();

			//Was the last execution long enough ago?
			if(lastTime + delay < now) {
				lastTime = now;

				//No timer needed, we are about to execute it
				//clearTimeout(timer);
				//timer = null;

				//Execute the original function
				callback.apply(arguments);
			} else {
				if(timer === null) {
					var args = arguments;

					//Start a timer which will execute the function after a delay
					timer = setTimeout(function() {
						timer = null;
						lastTime = new Date().getTime();
						callback.apply(args);
					}, delay);
				}
			}
		};

		return fn;
	};


	//Global api
	window.skrollr = {
		//Main entry point
		init: function(options) {
			return new Skrollr(options);
		}
	};
}(document));
