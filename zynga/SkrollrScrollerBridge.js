document.body.style.overflow = 'hidden';

window.skrollrScrollerInstance = new EasyScroller(document.body, {
	scrollingX: false,
	scrollingY: true,
	zooming: false,
	bouncing: false
}).scroller;
