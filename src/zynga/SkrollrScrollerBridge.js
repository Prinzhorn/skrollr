/*
 * This file is the bridge between zynga/scroller and skrollr.
 * It configures the page so that both work together
 * and exposes an instance of zynga/scroller to skrollr.
 */

//Disable native scrolling
document.body.style.overflow = 'hidden';


skrollr.scrollerInstance = new EasyScroller(document.body, {
	scrollingX: false,
	scrollingY: true,
	zooming: false,
	bouncing: false
}).scroller;
