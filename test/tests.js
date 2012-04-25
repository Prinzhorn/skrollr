$(function() {


var w = $(window);
var s = skrollr.init();
var x;

/*
<div id="visible-after-100" data-100="">TEST</div>
<div id="simple-numeric" data-0="left:0px;" data-500="left:100px;">TEST</div>
<div id="compound-numeric" data-0="margin:0px 10px 20px 30px;" data-500="margin:30px 20px 10px 0px;">TEST</div>
<div id="rgb-color" data-0="color:rgb(0,0,0);" data-500="color:rgb(50,100,150);">TEST</div>
<div id="rgba-color" data-0="color:rgb(0,0,0,.0);" data-500="color:rgb(50,100,150,.5);">TEST</div>
<div id="hsl-color" data-0="color:hsl(0,0%,0%);" data-500="color:hsl(3600,50%,50%);">TEST</div>
<div id="hsla-color" data-0="color:hsla(0,0%,0%,.0);" data-500="color:hsla(3600,50%,50%,.5);">TEST</div>
<div id="simple-transform" data-0="transform:rotate(0deg);" data-500="transform:rotate(3600deg);">TEST</div>
<div id="compound-transform" data-0="transform:rotate(0deg) scale(1);" data-500="transform:rotate(3600deg) scale(10);">TEST</div>
*/

module('basic stuff');

test('skrollables have the .skrollable class', function() {
	var x = $('.skrollable').length;

	ok(x === 9, 'not enough or too many .skrollable elements');
});


module('at different scroll positions');

//Needs to be async because scrolling and rendering is decoupled
asyncTest('at position 1', function() {
	//We need to run them in serial because we have to wait for rendering
	stop();

	s.on('scroll', function() {
		s.off('scroll');

		s.on('render', function() {
			//Prevent another render event. Only need one for test.
			s.off('render');

			x = $('#visible-100-to-400');

			ok(x.is('.hidden'), 'element should be hidden before 100');

			start(2);
		});
	});

	//Scroll to 1, which will cause rendering (sooner or later)
	s.setScrollTop(1);
});


//Needs to be async because scrolling and rendering is decoupled
asyncTest('at position 250', function() {
	//We need to run them in serial because we have to wait for rendering
	stop();

	s.on('scroll', function() {
		s.off('scroll');

		s.on('render', function() {
			//Prevent another render event. Only need one for test.
			s.off('render');

			x = $('#visible-100-to-400');

			ok(x.is(':not(.hidden)'), 'element should be visible after 100');

			start(2);
		});
	});

	//Scroll to 250, which will cause rendering (sooner or later)
	s.setScrollTop(250);
});


});//DOM ready
