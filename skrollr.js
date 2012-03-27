/*
 * TODO
 * -add a scale factor to scale the timeline
 */

(function(undefined) {
	var
		rxKeyframeAttribute = /^data-(\d+)$/,
		rxNumericValue = /^((-|\+)?[0-9.]+)(%|px|em|ex|pt|in|cm|mm|pc|deg)?$/,
		rxTransform
		rxCamelCase = /-([a-z])/g;
		parsers = {},
		steps = {};


	var parsersAndSteps = {
		constant: {
			/**
			 * Doesn't actually parse something. Will just return the value.
			 * @return The value.
			 */
			parser: function(val) {
				return val;
			},
			/**
			 * Doesn't interpolate at all.
			 */
			step: function(val) {
				return val;
			}
		},
		numeric: {
			/**
			 * Parses a single numeric value with optional unit.
			 * @return An array with the numeric value at first position and the unit at second position.
			 */
			parser: function(val) {
				var match = val.match(rxNumericValue);

				if(match === null) {
					return null;
				}

				return [parseFloat(match[1], 10), match[3] || ''];
			},
			/**
			 * Calculates the new value by interpolating between val1 and val2 using the given easing.
			 * If only the first parameter is specified, it just sets the value.
			 */
			step: function(val1, val2, progress, easing) {
				if(val2 === undefined) {
					return val1[0] + val1[1];
				}

				//Check if the units are the same
				if(val1[1] !== val2[1]) {
					throw "Can't interpolate between '" + val1[1] + "' and '" + val2[1] + "'";
				}

				easing = easing || 'linear';

				return (val1[0] + ((val2[0] - val1[0]) * progress)) + val1[1];
			}
		},
		transform: {
			parsers: function(val) {

			},
			step: function(val1, val2, progress, easing) {

			}
		}
	};

	//All supported properties which have constant values
	for(var i = 0, p = ['display', 'visibility']; i < p.length; i++) {
		parsers[p[i]] = parsersAndSteps.constant.parser;
		steps[p[i]] = parsersAndSteps.constant.step;
	}

	//All supported properties which have single numeric values
	for(var i = 0, p = ['opacity', 'top', 'right', 'bottom', 'left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'rotation', 'font-size', 'width', 'height', 'border-width']; i < p.length; i++) {
		parsers[p[i]] = parsersAndSteps.numeric.parser;
		steps[p[i]] = parsersAndSteps.numeric.step;
	}

	/**
	 * Constructor.
	 * @param container The DOM Element where the magic should happen.
	 */
	function Skrollr(options) {
		var self = this;

		options = options || {};

		//The container element. The parent of all skrollables.
		this.container = document.getElementsByTagName('body')[0];

		//Scale factor to scale keyFrames.
		this.scale = options.scale || 1;

		//All event listeners
		this.listeners = {};

		//A list of all elements which should be animated associated with their the data.
		this.skrollables = [];

		//Will contain the max data-end value available.
		this.maxKeyFrame = 0;



		var allElements = this.container.getElementsByTagName('*');

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
					var frame = (match[1] | 0) * this.scale;

					keyFrames.push({
						frame: frame,
						props: attr.value
					});

					if(frame > this.maxKeyFrame) {
						this.maxKeyFrame = frame;
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

				self._parseProps(sk);

				this.skrollables.push(sk);

				el.className += ' skrollable';
			}
		}

		this.container.style.overflow = 'auto';
		this.container.style.overflowX = 'hidden';
		this.container.style.position = 'relative';

		//Add a dummy element in order to get a large enough scrollbar
		this.dummy = document.createElement('div');

		var dummyStyle = this.dummy.style;

		dummyStyle.width = '1px';
		dummyStyle.height = this.maxKeyFrame + 'px';
		dummyStyle.position = 'absolute';
		dummyStyle.left = '0px';
		dummyStyle.top = '0px';
		dummyStyle.zIndex = '0';
		dummyStyle.background = 'transparent';

		this.container.appendChild(this.dummy);

		//TODO add some throttle to scroll event
		this.onScroll = function() {
			var top = Skrollr.getScrollTop(self.container);

			self.trigger('scroll', top);

			self.trigger('beforerender', top);

			self._render(top);

			self.trigger('afterrender', top);
		};

		this.setScrollTop(0);

		//Let's go
		Skrollr.addEventListener(document, 'scroll', this.onScroll);

		return this;
	}

	/**
		Triggers an event, calls each listener function
	*/
	Skrollr.prototype.trigger = function(type) {
		var fns = this.listeners[type];

		if(fns !== undefined) {
			var args = Array.prototype.slice.call(arguments, 1);

			for(var i = 0; i < fns.length; i++) {
				fns[i].apply(this, args);
			}
		}
	};

	/**
	 * Add a new event listener
	 */
	Skrollr.prototype.on = function(type, fn) {
		(this.listeners[type] = this.listeners[type] || []).push(fn);

		return this;
	};


	Skrollr.prototype.setScrollTop = function(top) {
		pageYOffset = top;
		document.body.scrollTop = top;
		document.documentElement.scrollTop = top;
		this.onScroll();
	};

	/**
	 * Calculate and sets the style properties for the element at the given frame
	 */
	Skrollr.prototype._step = function(skrollable, frame) {
		var frames = skrollable.keyFrames, last;

		//We are before the first frame, the element is not visible
		if(frame < frames[0].frame) {
			this._setStyle(skrollable.element, 'display', 'none');
		//We are after the last frame, the element gets all props from last keyFrame
		} else if(frame > (last = frames[frames.length - 1]).frame) {
			for(var key in last.props) {
				if(Object.prototype.hasOwnProperty.call(last.props, key)) {
					this._setStyle(skrollable.element, key, steps[key](last.props[key]));
				}
			}

			this._setStyle(skrollable.element, 'display', 'block');
		//We are between two frames
		} else {
			//Find out between which two keyFrames we are right now
			for(var i = 0; i < frames.length - 1; i++) {
				if(frame >= frames[i].frame && frame <= frames[i + 1].frame) {
					var left, right;

					left = frames[i];
					right = frames[i + 1];

					for(var key in left.props) {
						if(Object.prototype.hasOwnProperty.call(left.props, key)) {
							//If the left keyframe has a property which the right doesn't, we just set it without interprolating
							if(!Object.prototype.hasOwnProperty.call(right.props, key)) {
								this._setStyle(skrollable.element, key, steps[key](left.props[key]));
							} else {
								var progress = (frame - left.frame) / (right.frame - left.frame);

								this._setStyle(skrollable.element, key, steps[key](left.props[key], right.props[key], progress, left.props['easing']));
							}
						}
					}

					break;
				}
			}

			this._setStyle(skrollable.element, 'display', 'block');
		}
	};

	/**
	 * Renders all elements
	 */
	Skrollr.prototype._render = function(top) {
		//Compensate scrolling
		//this.container.style.paddingTop = this.dummy.style.top = top + 'px';

		for(var i = 0; i < this.skrollables.length; i++) {
			var sk = this.skrollables[i];

			this._step(sk, top);
		}

		return this;
	};


	Skrollr.prototype._setStyle = function(el, prop, val) {
		//TODO add prefixes
		el.style[Skrollr.camelCase(prop)] = val;
	};


	Skrollr.prototype._parseProps = function(skrollable) {
		for(var i = 0; i < skrollable.keyFrames.length; i++) {
			var
				frame = skrollable.keyFrames[i],
				allProps = frame.props.split(/:|;/g);

			frame.props = {};

			for(var k = 0; k < allProps.length - 1; k += 2) {
				frame.props[allProps[k]] = parsers[allProps[k]](allProps[k + 1]);
			}
		}
	};


	/*
		Public static helpers
	*/
	/**
		Ommiting "val": getter
		Setting "val" null: remove
		Passing non-null: setter
	*/
	Skrollr.data = function(el, key, val) {
		if(val === undefined) {
			return el.getAttribute('data-' + key);
		} else if(val === null) {
			el.removeAttribute('data-' + key);
		} else {
			el.setAttribute('data-' + key, val);
		}
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
	}

	Skrollr.camelCase = function(text) {
		return text.replace(rxCamelCase, function(str, p1) {
			return p1.toUpperCase();
		});
	};


	window.skrollr = {
		//Main entry point
		init: function(options) {
			return new Skrollr(options);
		}
	};
}());
