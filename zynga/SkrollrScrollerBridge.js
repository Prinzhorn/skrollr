document.body.style.overflow = 'hidden';
window.scroll(0,0);

window.skrollrScrollerInstance = new EasyScroller(document.body, {
	scrollingX: false,
	scrollingY: true,
	zooming: false,
	bouncing: false
}).scroller;
