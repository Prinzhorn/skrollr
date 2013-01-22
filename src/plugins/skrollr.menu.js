/*!
 * Plugin for skrollr.
 * This plugin makes hashlinks scroll nicely to their target position.
 *
 * https://github.com/Prinzhorn/skrollr
 *
 * free to use under terms of MIT license
 */
(function(document, skrollr) {
	var DEFAULT_DURATION = 500;
	var DEFAULT_EASING = 'sqrt';

	/*
		Since we are using event bubbling, the element that has been clicked
		might not acutally be the link but a child.
	*/
	var findParentLink = function(element) {
		//Yay, it's a link!
		if(element.tagName === 'A') {
			return element;
		}

		//We reached the top, no link found.
		if(element === document) {
			return false;
		}

		//Maybe the parent is a link.
		return findParentLink(element.parentNode);
	};

	/*
		Animate to the element.
	*/
	var scrollToId = function(id, duration, easing) {
		//Grab the target element.
		var scrollTarget = document.getElementById(id);

		if(!scrollTarget) {
			return false;
		}

		//Get the position to scroll to.
		var offset = _skrollrInstance.relativeToAbsolute(scrollTarget, 'top', 'top');

		//Now finally scroll there.
		_skrollrInstance.animateTo(offset, {
			duration: duration,
			easing: easing
		});

		return true;
	};

	/*
		Handle the click event on the document.
	*/
	var handleClick = function(e) {
		var link = findParentLink(e.target);

		//The click did not happen inside a link.
		if(!link) {
			return;
		}

		//Don't use the href property because it contains the full url.
		var href = link.getAttribute('href');

		//Check if it's a hashlink.
		if(href.indexOf('#') !== 0) {
			return;
		}

		//Great, it's a hashlink. Scroll to the element.
		var id = href.substr(1);
		var scollSuccess = scrollToId(id, DEFAULT_DURATION, DEFAULT_EASING);

		if(scollSuccess) {
			e.preventDefault();
		}
	};

	/*
		Global menu function accessible through window.skrollr.menu.init.
	*/
	skrollr.menu = {};
	skrollr.menu.init = function(skrollrInstance) {
		_skrollrInstance = skrollrInstance;

		//Use event bubbling and attach a single listener to the document.
		skrollr.addEvent(document, 'click', handleClick);
	};

	//Private reference to the initialized skrollr.
	var _skrollrInstance;

	//In case the page was opened with a hash, prevent jumping to it.
	//http://stackoverflow.com/questions/3659072/jquery-disable-anchor-jump-when-loading-a-page
	window.setTimeout(function() {
		if(location.hash) {
			window.scrollTo(0, 0);
		}
	}, 1);
}(document, window.skrollr));