/*
 * This file is the bridge between iscroll and skrollr.
 * It configures the page so that both work together
 * and exposes an instance of iscroll to skrollr.
 */

(function(window, document, undefined) {
	document.addEventListener('DOMContentLoaded', function () {
		window.setTimeout(function() {
			skrollr.iscroll = new iScroll(document.body, {
				bounce: false,
				useTransform: false
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