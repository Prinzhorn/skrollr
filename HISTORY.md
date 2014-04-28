0.6.24 (2014-04-25)
-------------------

* Fixed some issue with forceHeight (#347).
* Fixed a regression caused by #486 breaking IE 8 (#494).
* Added support for animating attributes (#204).

0.6.23 (2014-04-18)
-------------------

**note**: This particular version is broken in IE!

* Experimental support for emitting events when the scrolling passes a keyframe (check out the docs for `keyframe` option/event).
* When using `refresh`, make sure elements which do not longer have keyframes get properly cleaned up (#486).
* Fixed `refresh` not accepting `NodeList`s (#435).
* Expose the status of mobile mode as `isMobile()` function (#488).

0.6.22 (2014-02-21)
-------------------

* Experimental AMD support (#409). Please read the documentation about it.

0.6.21 (2014-01-06)
-------------------

* Disabled mobile mode on Windows Phone, since it's not needed there (#408).

0.6.20 (2014-01-03)
-------------------

* Fixed broken percentage constants.

0.6.19 (2014-01-02)
-------------------

* Constants can now be defined as functions or percentage offsets (#148, #404).

**breaking**: When using a constant of value `100` together with percentage offsets like `data-_foo-75p`,
the value was implicitly handled as percentage value `100p`. Starting with this version you need to explcitly use `100p` if you want percentage constants.
On the plus side, you can now mix an absolute constant with a percentage keyframe or a percentage constant with an absolute keyframe.

0.6.18 (2013-12-18)
-------------------

* Fixed scrolling on input elements (#397).

0.6.17 (2013-10-19)
------

* Fixed keyboard not appearing on some mobile browsers when an input was focused (#349).

0.6.16 (2013-10-18)
------

* Fixed `z-index:auto;` not working because it was always coerced to an integer (#351).

0.6.15 (2013-10-03)
------

* Fixed clicking on links (and other elements) on mobile (#263, #303, #338).
* Added `getMaxScrollTop` method (#238).

0.6.14 (2013-10-03)
------

* Fixed the `direction` parameter that's passed to the render events (#339).

0.6.13 (2013-09-29)
-----

* Added support for percentage offsets (#185).

0.6.12 (2013-09-17)
-----

* Added `destroy` method (#109).

0.6.11 (2013-08-13)
-----

* Made the mobile deceleration configurable and lowered the default (#222, #229).

0.6.10 (2013-07-30)
-----

* Fixed bug which caused IE to perform an endless loop (#271).

0.6.9 (2013-07-01)
-----

* Improved overall performance for mobile (#249).

0.6.8 (2013-06-17)
-----

* Added a new option `smoothScrollingDuration`.

0.6.7 (2013-06-17)
-----

* Changed the default value of `edgeStrategy` from `ease` to `set`. There are too many cases where `ease` was not wanted and unexpected.

0.6.6 (2013-06-05)
-----

* Fixed IE plugin not working. This was caused by assigning `skrollr.setStyle` to a local variable inside the skrollr core. Since the IE plugin monkey-patches the skrollr.setStyle function, the core didn't notice the change (#199 comment 18986949).

0.6.5 (2013-05-22)
-----

* Fixed crash in IE < 9 because the detected prefix was `null` (#220).

0.6.4 (2013-05-21)
-----

* Fixed that some elements got the `skrollable-before` **and** `skrollable-after` class at the same time.

0.6.3 (2013-05-19)
-----

* When resizing the browser, the scroll position was reset to 0 (#217)

0.6.2 (2013-05-18)
-----

* When resizing the browser, `forceHeight` was colliding with the already forced height (#216).

0.6.1 (2013-05-18)
-----

* Allow numbers inside of easing function names (#152).

0.6.0 (2013-05-18)
-----

**Expect things to break when coming from 0.5! Read through the changelog. Migration is not hard.**

* **[breaking]** There's no more `skrollr.mobile.js` file. You only need `skrollr.js`. You no longer need to conditionally include `skrollr.mobile.js`.
* You can configure how skrollr detects mobile browsers using the `mobileCheck` option (check out the documentation).
* **[possibly breaking]** The meaning of the `#skrollr-body` element changed. Put all static elements inside of it and all absolute/fixed elements outside. It doesn't need to be the first child of the body anymore.
* **[breaking]** The `rendered` and `unrendered` classes where renamed because they were confusing and wrong. They're now called `skrollable-before` and `skrollable-after`, because that's their meaning (the element with these classes is before/after the first/last keyframe).
	* Added a new class `skrollable-between`, because symmetry. That's why.
* Easing functions are now applied when exactly at a keyframe (#132).
* **[possibly breaking]** The behavior changed for the case when the scroll position is before/after the first/last keyframe (I'm just gonna use "before first" from now on, because "after last" is analog). In 0.5 the behavior was not exactly specified and buggy (see item above regarding #132). Skrollr was applying the styles of the first keyframe to the element for all scroll position that were before the first keyframe. E.g. when `data-100="top:200px;"` was the first keyframe, the element had `top:200px;` at all scroll positions before (all from `0` to `99`). From now on you can specify the behavior you want (see `edgeStrategy` option for details, set it to `set` for old behavior). **Note: 0.6.7 and up use `set` as default.**


0.5.14
-----

* Add a `skrollr-mobile` class to the html element when the mobile script is included.

0.5.13 (2013-02-08)
-----

* #131: Use a cross browser approach for getting the body scroll-height.
* #133: Use the maximum of document height or the max keyframe for edge cases where absolute keyframes are used in a relative-mode-like document and `data-end` was calculated wrong.

0.5.12 (2013-02-08)
-----

* #121: Fixed prefix detection in Safari.

0.5.11 (2013-01-18)
-----

* #126: When calling refresh(), force rerendering, even if the scrollbar didn't move.

0.5.10
-----

* #104: Fixed the most annoying bug on mobile. There was a large blank space at the bottom of the page.

0.5.9
-----

* #118: Fixed broken prefix detection. Was broken all the time, but worked before Firefox 18.

0.5.8 (2013-01-12)
-----

* #116 + #117: SVG support was broken for relative mode.

0.5.7
-----

* #103: skrollr no longer depends on being added to the bottom of the document.

0.5.6
-----

* #105: Fixed inconsistent behaviour for adding `rendered` and `unrendered` class on page load

0.5.5
-----

* #100: Fixed relative-mode not working correctly in IE < 9 due to crippled getBoundingClientRect

0.5.4 (2012-11-18)
-----

* #80: When resizing the browser window the calculation of relative mode was wrong when the element's vertical position was changed before.

0.5.3
-----

* #66: Make IE 7 support a light version of `data-anchor-target` by mapping `querySelector` to `getElementById`.

0.5.2
-----

* #78: Fixed that new parser didn't allowed omitting the last semicolon in a keyframe property list.

0.5.1 (2012-10-29)
-----

* Fixed `setScrollTop` and `animateTo` not working because iScroll uses negative offset.

0.5.0 (2012-10-09)
-----

* *breaking* the `plugin` api has been removed (the IE plugin has been updated to a new, hidden api).
* Full mobile support using iscroll.
* #73: Fixed parser to not mess up colons inside URLs
* #74: Fixed parser to not treat single periods as decimal numbers
* #76: Fixed dummy element overlaping the content, even though it should be unobtrusive

0.4.13
-----

* #58: `forceHeight` now handles relative mode like a boss.
* #59: Make `scale` option only affect absolute mode.

0.4.12
-----

* #64: Setting `float` property using JavaScript didn't work across browser. Now using `styleFloat` and `cssFloat` properties.

0.4.11 (2012-09-17)
-----

* The `scale` option does not affect `constants`.

0.4.10
-----

* Allow smooth scrolling on element level using `data-smooth-scrolling`

0.4.9
-----

* Added experimental smooth scrolling (no more CSS transitions. WORKS IN IE.).

0.4.8
-----

* Added `stopAnimateTo` method.

0.4.7
-----

* Updated the requestAnimationFrame polyfill for smoother animations
* Updated the way requestAnimationFrame is used for even smoother animations

0.4.6
-----

* New method `relativeToAbsolute` which was formerly private
* New method `isAnimatingTo` to check if an animation caused by `animateTo` is running
* Added `sqrt` easing function

0.4.5
-----

* Experimental mobile support using https://github.com/zynga/scroller

0.4.4
-----

* A `skrollr` class is added to the HTML element and a `no-skrollr` class is removed when `init` is called. Useful for fallback styling.

0.4.3 (2012-08-02)
-----

* Added new feature "constants".

0.4.2 (2012-07-26)
-----

* Added new feature "anchor-target" which allows elements to react to other elements leaving/entering the viewport.

0.4.1 (2012-07-25)
-----

* Fixed a bug which broke skrollr in IE caused by wrong regular expression behavior

0.4.0 (2012-07-22)
-----

* *breaking* the `data-end-[offset]` syntax changed. It's now `data-[offset]-end`.
* Fixed a bug where white spaces between style declarations were not ignored.
* Added support for anchors. Animations can now be specified relative to the elements position within the viewport.
* Added support for SVG elements.
* Added new method `refresh()`.