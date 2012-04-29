$(function() {


var w = $(window);
var s = skrollr.init();
var x;

module('basic stuff');

test('skrollables have the .skrollable class', function() {
	x = $('.skrollable').length;

	ok(x === 9, 'not enough or too many .skrollable elements');
});


module('at different scroll positions');

//Needs to be async because scrolling and rendering is decoupled
asyncTest('at position 1', function() {
	//We need to run them in serial because we have to wait for rendering
	stop();

	//Scroll to 1, which will cause rendering (sooner or later)
	s.setScrollTop(1);

	s.on('render', function() {
		//Prevent another render event. Only need one for test.
		s.off('render');

		x = $('#visible-100-to-400');

		ok(x.is('.hidden'), 'element should be hidden before 100');

		start(2);
	});
});


//Needs to be async because scrolling and rendering is decoupled
asyncTest('at position 250', function() {
	//We need to run them in serial because we have to wait for rendering
	stop();

	//Scroll to 250, which will cause rendering (sooner or later)
	s.setScrollTop(250);

	s.on('render', function() {
		//Prevent another render event. Only need one for test.
		s.off('render');

		x = $('#visible-100-to-400');

		ok(x.is(':not(.hidden)'), 'element should be visible after 100');

		start(2);
	});
});


});//DOM ready
