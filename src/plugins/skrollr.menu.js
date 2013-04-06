/*!
 * Plugin for skrollr.
 * This plugin makes hashlinks scroll nicely to their target position.
 *
 * Alexander Prinzhorn - https://github.com/Prinzhorn/skrollr
 *
 * Free to use under terms of MIT license
 */
(function(document, skrollr) {
  var DEFAULT_DURATION = 500;
  var DEFAULT_EASING = 'sqrt';

  var MENU_TOP_ATTR    = 'data-menu-top';
  var MENU_OFFSET_ATTR = 'data-menu-offset';

  /*
    Since we are using event bubbling, the element that has been clicked
    might not acutally be the link but a child.
  */
  var findParentLink = function(element) {
    //Yay, it's a link!
    if (element.tagName === 'A') {
      return element;
    }

    //We reached the top, no link found.
    if (element === document) {
      return false;
    }

    //Maybe the parent is a link.
    return findParentLink(element.parentNode);
  };

  var scroll = function(offset) {
    _lastOffset = offset;

    //Now finally scroll there.
    if (_animate) {
      _skrollrInstance.animateTo(offset, {
        duration: _duration,
        easing: _easing
      });
    } else {
      _skrollrInstance.setScrollTop(offset);
    }
  };

  /*
    Do the actual scrolling given an anchor and an offset
  */
  var navigate = function(link) {
    var offset = 0;
    var hash = null;

    if (link) {
      //Don't use the href property because it contains the absolute url.
      hash = link.getAttribute('href');

      //Check if it's a hashlink.
      if (hash.indexOf('#') === 0) {

        if (link.hasAttribute(MENU_TOP_ATTR)) {
          offset = +link.getAttribute(MENU_TOP_ATTR);
          scroll(offset);
        } else if (hash) {

          var scrollTarget = document.getElementById(hash.substr(1));

          //Ignore the click if no target is found.
          if (scrollTarget) {

            offset = _skrollrInstance.relativeToAbsolute(scrollTarget, 'top', 'top');

            // add/subtract using the scrollTarget's offset attr val
            if (scrollTarget.hasAttribute(MENU_OFFSET_ATTR)) {
              offset += +scrollTarget.getAttribute(MENU_OFFSET_ATTR);
            }

            scroll(offset);
          }
        }
      } else {
        // scroll to the top
        scroll(0);
      }

    } else {
      // scroll to the top
      scroll(0);
    }

    return hash;
  };

  /*
      Handle the click event on the document.
    */
  var handleClick = function(e) {
    var link = findParentLink(e.target);

    //The click did not happen inside a link.
    if (!link) {
      return;
    }

    hash = navigate(link);

    if (hash) {
      // Check if browser supports pushstate + we're visiting a different hash
      if (_hasPushState && location.hash !== hash) {
        history.pushState({}, "", hash);
      }

      e.preventDefault();
    }
  };

  /*
    Handle the popstate event
  */
  var handlePopState = function(e) {
    if (location.hash.length > 1) {
      // override browser's auto scroll by resetting to current position
      window.scrollTo(0, _lastOffset);

      var link = document.querySelector('a[href^="' + location.hash + '"]');

      if (link) {
        navigate(link);
      }
    } else if (_lastOffset > 0) {
      // override browser's auto scroll by resetting to current position
      window.scrollTo(0, _lastOffset);

      navigate(null);
    }
  };

  /*
    Global menu function accessible through window.skrollr.menu.init.
  */
  skrollr.menu = {};
  skrollr.menu.init = function(skrollrInstance, options) {
    _skrollrInstance = skrollrInstance;

    options = options || {};
    _duration = options.duration || DEFAULT_DURATION;
    _easing = options.easing || DEFAULT_EASING;
    _animate = options.animate !== false;

    //Use event bubbling and attach a single listener to the document.
    skrollr.addEvent(document, 'click', handleClick);
    skrollr.addEvent(window, 'popstate', handlePopState);
  };

  //Private reference to the initialized skrollr.
  var _skrollrInstance;

  var _easing;
  var _duration;
  var _animate;
  var _hasPushState = !! (this.history && this.history.pushState);
  var _lastOffset = 0;

  // In case the page was opened with a hash, prevent jumping to it.
  // http://stackoverflow.com/questions/3659072/jquery-disable-anchor-jump-when-loading-a-page
  window.setTimeout(function() {
    if (location.hash) {
      window.scrollTo(0, 0);
    }
  }, 1);

}(document, window.skrollr));