$(window).on('load', function() {


//Initialize skrollr and save the instance.
var s = skrollr.init();

//Counts how many assertions will be needed for the tests.
var countAssertions = function(tests) {
	var counter = 0;

	for(var i = 0; i < tests.length; i++) {
		var curTest = tests[i];

		if(curTest.styles) {
			for(var k in curTest.styles) {
				counter += Object.prototype.hasOwnProperty.call(curTest.styles, k);
			}
		}

		counter += !!curTest.selector;
	}

	return counter;
};

//A meta-test which runs common tests
//which need synchronization of scrolling and rendering.
var scrollTests = function(offset, tests) {
	module('at scroll position ' + offset);

	asyncTest('rendering', function() {
		//We can't run them in parallel,
		//because they would interfere with each others scroll top offset.
		stop();

		expect(countAssertions(tests));

		//Scroll to offset, which will cause rendering (sooner or later)
		s.setScrollTop(offset);

		s.on('render', function() {
			//Prevent another render event. Only need one for test.
			s.off('render');

			for(var i = 0; i < tests.length; i++) {
				var curTest = tests[i];

				if(curTest.styles) {
					for(var k in curTest.styles) {
						if(Object.prototype.hasOwnProperty.call(curTest.styles, k)) {
							QUnit.numericCSSPropertyEquals(curTest.element.css(k), curTest.styles[k], 'element\'s (#' + curTest.element[0].id + ') "' + k + '" CSS property is correct')
						}
					}
				}

				if(curTest.selector) {
					ok(curTest.element.is(curTest.selector), 'element matches "' + curTest.selector + '"');
				}
			}

			start(2);
		});
	});
};

//
// Now the actual tests.
//

//Add one element dynamically
var newElement = $('<div id="dynamic" data-0="bottom:0px;" data-250="bottom:100px;">TEST</div>').appendTo('body');
s.refresh(newElement[0]);

module('basic stuff');

test('skrollables have the .skrollable class', function() {
	x = $('.skrollable').length;

	ok(x === 11, 'not enough or too many .skrollable elements');
});

scrollTests(500, [
	{
		element: $('#simple-numeric'),
		styles: {
			left: '100px',
			top: '50px'
		}
	},
	{
		element: $('#compound-numeric'),
		styles: {
			marginTop: '30px',
			marginRight: '20px',
			marginBottom: '10px',
			marginLeft: '0px'
		}
	},
	{
		element: $('#rgb-color'),
		styles: {
			color: 'rgb(50, 100, 150)'
		}
	},
	{
		element: $('#rgba-color'),
		styles: {
			color: 'rgba(50, 100, 150, 0.5)'
		}
	},
	{
		element: $('#hsl-color'),
		styles: {
			color: 'rgb(191, 63, 63)'
		}
	},
	{
		element: $('#no-interpolation'),
		styles: {
			right: '100px'
		}
	},
	{
		element: $('#anchor-2'),
		styles: {
			right: '200px'
		}
	},
	{
		element: $('#end'),
		styles: {
			fontSize: '90px'
		}
	}
]);

scrollTests(0, [
	{
		element: $('#simple-numeric'),
		styles: {
			left: '0px',
			top: '0px'
		}
	},
	{
		element: $('#compound-numeric'),
		styles: {
			marginTop: '0px',
			marginRight: '10px',
			marginBottom: '20px',
			marginLeft: '30px'
		}
	},
	{
		element: $('#rgb-color'),
		styles: {
			color: 'rgb(0, 0, 0)'
		}
	},
	{
		element: $('#rgba-color'),
		styles: {
			color: 'rgba(0, 0, 0, 0.2)'
		}
	},
	{
		element: $('#hsl-color'),
		styles: {
			color: 'rgb(0, 0, 0)'
		}
	},
	{
		element: $('#no-interpolation'),
		styles: {
			right: '0px'
		}
	},
	{
		element: $('#end'),
		styles: {
			fontSize: '10px'
		}
	},
	{
		element: newElement,
		styles: {
			bottom: '0px'
		}
	}
]);

scrollTests(250, [
	{
		element: $('#simple-numeric'),
		styles: {
			left: '50px',
			top: '25px'
		}
	},
	{
		element: $('#compound-numeric'),
		styles: {
			marginTop: '15px',
			marginRight: '15px',
			marginBottom: '15px',
			marginLeft: '15px'
		}
	},
	{
		element: $('#rgb-color'),
		styles: {
			color: 'rgb(25, 50, 75)'
		}
	},
	{
		element: $('#rgba-color'),
		styles: {
			color: 'rgba(25, 50, 75, 0.35)'
		}
	},
	{
		element: $('#hsl-color'),
		styles: {
			color: 'rgb(79, 47, 47)'
		}
	},
	{
		element: $('#no-interpolation'),
		styles: {
			right: '0px'
		}
	},
	{
		element: $('#anchor-2'),
		styles: {
			right: '100px'
		}
	},
	{
		element: $('#end'),
		styles: {
			fontSize: '50px'
		}
	},
	{
		element: newElement,
		styles: {
			bottom: '100px'
		}
	}
]);

scrollTests(1000, [
	{
		element: $('#anchor-1'),
		styles: {
			right: '100px'
		}
	}
]);


});//DOM ready
