$(window).on('load', function() {

//Initialize skrollr and save the instance.
var s = skrollr.init({
	edgeStrategy: 'set',
	constants: {
		myconst: 300,
		my500: function() {
			return 500;
		}
	},
	easing: {
		half1: function() {
			return 0.5
		}
	}
});

//Counts how many assertions will be needed for the tests.
var countAssertions = function(tests) {
	var counter = 0;

	for(var i = 0; i < tests.length; i++) {
		var curTest = tests[i];

		if(curTest.styles) {
			$.each(curTest.styles, function() {
				counter++;
			});
		}

		if(curTest.attributes) {
			$.each(curTest.attributes, function() {
				counter++;
			});
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
		s.setScrollTop(offset, true);

		s.on('render', function(info) {
			//Prevent another render event. Only need one for test.
			s.off('render');

			for(var i = 0; i < tests.length; i++) {
				var curTest = tests[i];

				if(curTest.styles) {
					$.each(curTest.styles, function(k) {
						QUnit.numericCSSPropertyEquals(curTest.element.css(k), curTest.styles[k], curTest.message || 'element\'s (#' + curTest.element[0].id + ') "' + k + '" CSS property is correct');
					});
				}

				if(curTest.attributes) {
					$.each(curTest.attributes, function(k, value) {
						console.log(curTest.element.prop(k));
						QUnit.numericCSSPropertyEquals(curTest.element.attr(k), curTest.attributes[k], curTest.message || 'element\'s (#' + curTest.element[0].id + ') "' + k + '" attribute is correct');
					});
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

test('CSS classes present', function() {
	strictEqual($('.skrollable').length, 23, 'All elements have the .skrollable class');

	ok($('html').is('.skrollr'), 'HTML element has skrollr class');
	ok($('html').is(':not(.no-skrollr)'), 'HTML element does not have no-skrollr class');
});

scrollTests(500, [
	{
		message: 'colons inside urls are preserved (#73)',
		element: $('#colon-url'),
		styles: {
			backgroundImage: 'url(https://secure.travis-ci.org/Prinzhorn/skrollr.png)'
		}
	},
	{
		message: 'a single period is no number (#74)',
		element: $('#period-number'),
		styles: {
			backgroundImage: 'url(https://secure.travis-ci.org/Prinzhorn/skrollr.png?1337)'
		}
	},
	{
		element: $('#simple-numeric'),
		styles: {
			left: '100px',
			top: '50px'
		}
	},
	{
		element: $('#easing'),
		styles: {
			left: '25px'
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
		element: $('#foreign-anchor'),
		styles: {
			paddingTop: '100px',
			paddingRight: '100px',
			paddingBottom: '100px',
			paddingLeft: '100px'
		}
	},
	{
		element: $('#float'),
		styles: {
			float: 'left'
		}
	},
	{
		message: 'z-index "auto" is no converted to a number (#351)',
		element: $('#auto-z-index'),
		styles: {
			zIndex: 'auto'
		}
	},
	{
		message: 'attribute interpolation',
		element: $('#attr'),
		attributes: {
			title: '0'
		}
	}
]);

scrollTests(0, [
	{
		element: $('#simple-numeric'),
		styles: {
			left: '-100px',
			top: '0px'
		}
	},
	{
		element: $('#easing'),
		styles: {
			left: '25px'
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
	},
	{
		element: $('#float'),
		styles: {
			float: 'none'
		}
	},
	{
		message: 'z-index "auto" is no converted to a number (#351)',
		element: $('#auto-z-index'),
		styles: {
			zIndex: '1'
		}
	},
	{
		message: 'attribute interpolation',
		element: $('#attr'),
		attributes: {
			title: '500',
			'data-test': 'skrollr'
		}
	}
]);

scrollTests(250, [
	{
		element: $('#simple-numeric'),
		styles: {
			left: '0px',
			top: '25px'
		}
	},
	{
		element: $('#easing'),
		styles: {
			left: '25px'
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
		element: newElement,
		styles: {
			bottom: '100px'
		}
	},
	{
		element: $('#foreign-anchor'),
		styles: {
			paddingTop: '150px',
			paddingRight: '150px',
			paddingBottom: '150px',
			paddingLeft: '150px'
		}
	},
	{
		element: $('#float'),
		styles: {
			float: 'none'
		}
	},
	{
		message: 'attribute interpolation',
		element: $('#attr'),
		attributes: {
			title: '250',
			'data-test': 'skrollr'
		}
	}
]);

//bottom-top + 50%
scrollTests(150, [
	{
		element: $('#relative-percentage-offset'),
		styles: {
			left: '250px'
		}
	}
]);

//200%
scrollTests(600, [
	{
		element: $('#percentage-offset'),
		styles: {
			left: '500px'
		}
	},
	{
		message: 'attribute interpolation',
		element: $('#attr'),
		attributes: {
			'data-test': 'skrollr-test'
		}
	}
]);

//100%
scrollTests(300, [
	{
		element: $('#percentage-offset'),
		styles: {
			left: '250px'
		}
	}
]);

//We scroll to a ridiculous large position so that the browser cuts it at the actual position.
var maxScrollHeight = s.setScrollTop(1e5) && s.getScrollTop();

scrollTests(maxScrollHeight, [
	{
		element: $('#anchor-1'),
		styles: {
			right: '100px'
		}
	},
	{
		element: $('#easing'),
		styles: {
			left: '50px'
		}
	},
	{
		element: $('#easing_with_easing_strategy'),
		styles: {
			left: '25px'
		}
	},
	{
		element: $('#reset-strategy'),
		styles: {
			left: '1337px'
		}
	}
]);


});//DOM ready
