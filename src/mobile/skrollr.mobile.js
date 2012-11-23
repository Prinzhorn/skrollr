/*
 * This file is the bridge between iscroll and skrollr.
 * It configures the page so that both work together
 * and exposes an instance of iscroll to skrollr.
 */

(function(window, document, undefined) {

	/**
	 * Map iScroll events to custom skrollr events, to allow binding
	 * document.addEventListener('skrollrOnScrollMove', function(e) { // var iScroll = e.context });
	 */
	function emitEvent(name, context) {
	    var evt = document.createEvent("Events")
	    evt.initEvent(name, true, true); //true for can bubble, true for cancelable
	    evt.context = context;
	    document.dispatchEvent(evt);
	}

	document.addEventListener('DOMContentLoaded', function () {
		window.setTimeout(function() {
			skrollr.iscroll = new iScroll(document.body, {
				bounce: false,
				useTransform: false,
				onScrollMove: function() {
					emitEvent('skrollrOnScrollMove', this);
				},
				onScrollEnd: function() {
					emitEvent('skrollrOnScrollEnd', this);
				}
			});

			document.documentElement.style.overflow = document.body.style.overflow = 'hidden';

			var skrollrBody = document.getElementById('skrollr-body');

			if(!skrollrBody) {
				throw "For mobile support skrollr needs a #skrollr-body element";
			}

			skrollrBody.style.cssText += 'overflow:hidden;position:absolute;width:100%;';

			window.scroll(0, 0);
		}, 200);
	},false);
}(window, document));