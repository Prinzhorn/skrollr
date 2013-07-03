[![Build Status](https://secure.travis-ci.org/Prinzhorn/skrollr.png)](http://travis-ci.org/Prinzhorn/skrollr)

skrollr 0.6.9
=====

Stand-alone **parallax scrolling** JavaScript library for **mobile (Android, iOS, etc.) and desktop** in just over **9.6k** (minified) or **4.5k** (minified + gzipped).

Designer friendly. No JavaScript skills needed. Just plain CSS and HTML.

_Actually, skrollr is much more than "just" **parallax scrolling**. It's a full-fledged scrolling animation library. In fact, you can use it and still have no parallax scrolling at all. But I wanted to sound hip and use some buzz-words. By the way, skrollr leverages HTML5 and CSS3 ;-)_

Resources
=====

Official plugins
-----

* [skrollr-menu](https://github.com/Prinzhorn/skrollr-menu) - Hash navigation
* [skrollr-ie](https://github.com/Prinzhorn/skrollr-ie) - IE < 9 CSS fixes
* [skrollr-stylesheets](https://github.com/Prinzhorn/skrollr-stylesheets) - Keyframes inside CSS files

In the wild
-----

* http://hypervenom.nike.com/
* http://www.photo-mark.com/funhouse/chess/
* http://www.entropy-thegame.com/
* http://nclud.com/welcome/
* http://moto.oakley.com/
* http://pixeljuice.ru/en
* http://everylastdrop.co.uk/
* http://erfgenaam.submarinechannel.com/en/
* http://www.guardian.co.uk/world/interactive/2012/dec/21/2012-america-year-review
* http://www.guardian.co.uk/world/interactive/2012/nov/06/america-elect-graphic-novel
* http://www.officeline.se/kampanj/
* http://www.direct.tv/thekingsroadmap/
* http://www.evanshalshaw.com/bondcars/
* http://www.edel-und-stein.com/
* http://erikreyna.com/ofthestreet/index.html
* https://squareup.com/careers/creative
* http://happy.is
* http://www.futuremylove.com/
* http://jonnyacevedo.com/

Further resources (tutorials etc.)
-----

* http://www.guardian.co.uk/info/developer-blog/2012/nov/20/how-we-built-america-elect-graphic-novel-interactive
* http://webdesign.tutsplus.com/tutorials/htmlcss-tutorials/jazz-up-a-static-webpage-with-subtle-parallax/
* http://pepsized.com/merry-scrolling-with-skrollr-js/
* https://rubygems.org/gems/skrollr-rails
* https://gist.github.com/Prinzhorn/5796546

_Want to get added? Just fork & pull request or tweet me [@Prinzhorn](https://twitter.com/Prinzhorn)_


Documentation
=====

First of all: look at the [examples and read the source ;-)](https://github.com/Prinzhorn/skrollr/tree/master/examples). This might give you a feeling of how stuff works and you can see how some patterns can be implemented.

Abstract
------

skrollr allows you to animate any CSS property of any element depending on the horizontal scrollbar position. All you need to do is define key frames for each element at certain points in top scroll offset.

Other libraries require you to write JavaScript in order to define your animations. This introduces two main problems:

* Animation and element are not at one place. In order to find out if any animations are defined for a given element, you have to scroll through many (sometimes thousands) of lines of JavaScript.
* You have to learn a new syntax which is often very verbose and limited at the same time.

With skrollr, you put the definition of your key frames right where they belong (to the element) using a syntax you already know (plain CSS).

If you rather want the keyframes inside a separate file, take a look at [skrollr-stylesheets](https://github.com/Prinzhorn/skrollr-stylesheets).

Let's get serious
------

If you're familiar with CSS, you already know the `style` attribute. In order to create an animation you would need several, at least two, of them. That's what skrollr does. You use the HTML5 `data-` attributes to define multiple sets of styles (we call each of them **keyframe**) and skrollr interpolates between them.

#### Let's change the background-color of a `div` starting at `#00f` when the scrollbar is at the top and ending with `#f00` when the user scrolled 500 pixels down

```html
<div data-0="background-color:rgb(0,0,255);" data-500="background-color:rgb(255,0,0);">WOOOT</div>
```
[View in browser](http://prinzhorn.github.io/skrollr/examples/docu/1.html)

##### Lessons learned

* Skrollr ensures that you can actually scroll down 500 pixels or more, even if there's not enough content. You can suppress this using the `forceHeight` option
* You can't use `#00f` or `#0000ff`. You need to use `rgb` or `hsl` and explicitly decide which color space you want because they result in different animations (HSL is much cooler most of the time). Don't worry, the IE plugin teaches IE < 9 to display `rgb` and `hsl` correctly.

#### Now let's do a barrel roll at the same time

```html
<div data-0="background-color:rgb(0,0,255);transform:rotate(0deg);" data-500="background-color:rgb(255,0,0);transform:rotate(360deg);">WOOOT</div>
```
[View in browser](http://prinzhorn.github.io/skrollr/examples/docu/2.html)

##### Lessons learned

* Skrollr handles all these nasty CSS prefixes for you. Just -moz-relax and get yourself a cup of -webkit-coffee

#### Now let the rotation bounce like it were a hip-hop video

```html
<div data-0="background-color:rgb(0,0,255);transform[bounce]:rotate(0deg);" data-500="background-color:rgb(255,0,0);transform[bounce]:rotate(360deg);">WOOOT</div>
```
[View in browser](http://prinzhorn.github.io/skrollr/examples/docu/3.html)

#### Lessons learned

* Skrollr allows non-linear animations. The so called *easing functions* can be used per-property by putting them in square brakets behind the property. There's a built-in list of easing functions (see below in the [JavaScript](#javascript) section) and you can use your own functions by using the `easings` options.

Now you may have noticed that using `500` as a keyframe position is kind of random and the look depends on your browser size.

#### Let's have the animation end when the top of the element reaches the top of the viewport (element leaves the viewport)

```html
<div data-0="background-color:rgb(0,0,255);transform[bounce]:rotate(0deg);" data-top="background-color:rgb(255,0,0);transform[bounce]:rotate(360deg);">WOOOT</div>
```
[View in browser](http://prinzhorn.github.io/skrollr/examples/docu/4.html)

##### Lessons learned

* Skrollr keyframes can either be [absolute](#absolute-mode-or-document-mode) or [relative](#relative-mode-or-viewport-mode).

That's the end of this short intro. The following sections will explain some more things in detail.

If you're not a fan of `data-attributes` or if you're planning a big website where you want a better and more flexible structure, take a look at [skrollr-stylesheets](https://github.com/Prinzhorn/skrollr-stylesheets).

Mobile support
-----
Starting with version 0.5.0 skrollr officially supports mobile browsers including Android and iOS. And mobile support has been rewritten from scratch for skrollr 0.6.0.

### The Problem with mobile and the solution

(If you're not interested in the details, just scroll down a bit to see what you need to do for mobile support)

Some words on why this is an important milestone and why others failed: Mobile browsers try to save battery wherever they can. That's why mobile browsers delay the execution of JavaScript while you are scrolling. iOS in particular does this very aggressively and completely stops JavaScript. And in short that's the reason why many scrolling libraries either don't work on mobile devices or they come with their own scrollbar which is a usability nightmare on desktop. It was an important requirement while I developed skrollr that I don't force you to scroll the way I want it. skrollr on desktop uses a native scrollbar and you can scroll the way you want to (keyboard, mouse, etc.).

You just told me it doesn't work on mobile, but why does it? The answer is simple. When using skrollr on mobile you don't actually scroll. When detecting a mobile browser skrollr disables native scrolling and instead listens for touch events and moves the content (more specific the `#skrollr-body` element) using CSS transforms.

### What you need in order to support mobile browsers

Starting with skrollr 0.6.0 there's just one thing you need to do: Include an element on your page with the id `skrollr-body`. That's the element we move in order to fake scrolling. The only case were you don't need a `#skrollr-body` is when using `position:fixed` exlusively. In fact the skrollr website doesn't include a `#skrollr-body` element. If you need both fixed and non-fixed (i.e. static) elements, put the static ones inside the `#skrollr-body` element.

Absolute vs relative mode
-----

Being only able to define key frames in absolute values is simply insufficient for some cases. For example if you don't know where an element will exactly be in the document. That's why there are two modes for key frames, namely `absolute` and `relative` mode.

### absolute mode (or document mode)

The key frames are defined as absolute values describing how much the **document** has been scrolled down.

The syntax is `data-[offset]-[anchor]`, where `offset` can be any integer (0 is default) and `anchor` can be either `start` (default) or `end`. Either `offset` or `anchor` can be ommited in some situations. Here are some examples of key frames and their meaning.

* `data-0` = `data-start` = `data-0-start`: When the scroll top is 0.
* `data-100` = `data-100-start`: When the scroll top is 100.
* `data--100` = `data--100-start`: When the scroll top is -100 (sounds like nonsense, but keep in mind that interpolation will be relative to this point).
* `data-end` = `data-0-end`: When offset is 0, but counting from the bottom of the document instead of from the top. In short: when you reach the bottom of the page.
* `data-100-end`: 100px before we reach the bottom.
* `data--100-end`: 100px after we reach the bottom (again, it's up to you whether you need it).

### relative mode (or viewport mode)

Instead of defining key frames relative to the **document** (i.e. absolute), we are able to define them depending on the position of any element in relation to the **viewport**.

The syntax is `data-[offset]-(viewport-anchor)-[element-anchor]`, where `offset` can again be any integer and defaults to 0. Both `viewport-anchor` (mandatory) and `element-anchor` (optional) can be one of `top`, `center` or `bottom`. If `element-anchor` is ommitted, the value of `viewport-anchor` will be taken (just like with background-position). Here are some examples of key frames and their meaning.

* `data-top` = `data-0-top` = `data-top-top` = `data-0-top-top`: When the element's top is aligned with the top of the viewport.
* `data-100-top` = `data-100-top-top`: When the element's top is 100px above the top of the viewport.
* `data--100-top` = `data--100-top-top`: When the element's top is 100px below the top of the viewport.
* `data-top-bottom `= `data-0-top-bottom`: When the bottom of the element is at the top of the viewport (it's just not visible).
* `data-center-center` = `data-0-center-center`: When the element is at the center of the viewport.
* `data-bottom-center` = `data-0-bottom-center`: When the element's center is at the bottom of the viewport, thuss the upper half of the element is visible.

By default the element is the element where the key frames are defined on (self), but can be any element on the page. You can optionally specify which element you want by using the `data-anchor-target` and any CSS selector. The first element on the page matching the selector will be used. `data-anchor-target` requires IE 8 or greater.

Examples: `data-anchor-target="#foo"` or `data-anchor-target=".bar:not(.bacon) ~ span > a[href]"`

**Note**: If you need to support IE 7, then you may only use IDs as `anchor-target`s, i.e. `#foo`. The IE plugin maps `querySelector` to `getElementById`.

Here's an infographic for better understanding of anchors (click to open PDF):

[![Anchors Guide](https://raw.github.com/Prinzhorn/skrollr/master/guide/anchor-position-guide.png)](https://raw.github.com/Prinzhorn/skrollr/master/guide/anchor-position-guide.pdf)

**Important**: All those values will be calculated up-front and transformed to `absolute` mode. So if either the element's box height changes (height, padding, border) or the elements position within the document, you probably need to call `refresh()` (see documentation in JavaScript section below). **Window resizing is handled by skrollr.**

Hash navigation
-----

Check out the [skrollr-menu](https://github.com/Prinzhorn/skrollr-menu) plugin.

Working with constants
-----

I was lying to you. The syntax for absolute mode is not `data-[offset]-[anchor]` and for relative mode it's not `data-[offset]-(viewport-anchor)-[element-anchor]`. In both cases `offset` can be preceeded by a constant which can be passed to the `ìnit` method. The name of the constant needs to be preceeded with an underscore.

Example:

```js
skrollr.init({
	constants: {
		foobar: 1337
	}
});
```

```html
<div data-_foobar="left:0%;" data-_foobar--100="left:50%;" data-_foobar-100="left:100%;"></div>

<!--Equal to-->

<div data-1337="left:0%;" data-1237="left:50%;" data-1437="left:100%;"></div>
```

Valid characters for a constant are `[a-z0-9_]`.

CSS classes
-----

skrollr will add a `skrollr` class to the `HTML` element when calling `init` and will remove a `no-skrollr` class if present. Additionally it will add a `skrollr-desktop` or `skrollr-mobile` class depending on which it detects. This allows fallback CSS rules to create a good user experience on unsupported devices or when JavaScript or skrollr are disabled.

All elements under skrollr's control (elements with appropriate data-attributes) will get the `skrollable` class. In addition we add either the `skrollable-before`, `skrollable-between` **or** `skrollable-after` class, depending on whether the current scroll position is before, between or after the first/last (smallest/largest) keyframe of an element.

Filling missing values
-----

Imagine the following animation

```html
<div data-100="left:0%;" data-200="top:0%;" data-300="left:50%;" data-400="top:50%;"></div>
```

One could expect `left` to have a value of `25%` at keyframe `200`. That is **not** the case. By design skrollr only interpolates values between key frames which are direct **neighbors**. What actually happens is that skrollr internally fills out all holes once from left and then from right. So the above is equivalent to

```html
<div data-100="left:0%;top:0%;" data-200="left:0%;top:0%;" data-300="left:50%;top:0%;" data-400="left:50%;top:50%;"></div>
```

Preventing interpolation
-----

The reason why skrollr is so lightweight and powerfull is because it literally interpolates **every** number it can find. If you want to prevent some side effect, you can suppress interpolation for a specific value by prepending an exclamation point.

Example:
```html
<!-- This will get your image url f***** up because there's no "kitten1.4561799.jpg" and the like -->
<div data-0="background-image:url(kitten1.jpg);" data-100="background-image:url(kitten2.jpg)"></div>

<!-- Better -->
<div data-0="background-image:!url(kitten1.jpg);" data-100="background-image:!url(kitten2.jpg)"></div>
```

**Note:** The values for both keyframes (at least the if they contain a number) need to be prefixed if you want to avoid skrollr throwing an exception at you!

Limitations
-----

There are some limitations of skrollr you should be aware of.

* All numeric values have to have the same unit. It's not possible to animate from `0%` to `100px`. skrollr won't complain, but results are undefined.
* Animations between values which are composed of multiple numeric values like `margin:0 0 0 0;` are only possible for the same number of values. `margin:0px 0px 0px 0px;` to `margin:0px 100px 50px 3px;` is fine, but not `margin:10px;` to `margin:5px 10px;`.
* Animations between CSS transforms only work when they use the same functions in same order. From `rotate(0deg) scale(1)` to `rotate(1000deg) scale(5)` is fine.
* Color animations don't support named values like "red" or hex values like "#ff0000". Instead, you have to use `rgb()`, `rgba()`, `hsl()` and `hsla()`. Don't worry, there's a skrollr plugin for IE < 9 to support `hsl()` (without "a"!) and to fall rgba back to rgb.
* Color animations only work for same color functions. `hsl()` to `hsl()` or `hsla()` is fine, but not `rgb()` to `hsl()`. Which makes sense, because animating from the same colors in rgb space and in hsl space results in different animations (hsl gives you the nice rainbow stuff).

But feel free to send in a pull request to fix any of them. Just keep in mind that keeping skrollr as lightweight as possible has high priority.

JavaScript
====

On the JavaScript part there's not much to do (you can, if you want to!). So if you only know CSS and HTML, perfect.

skrollr.init([options])
-----

All there is to do is to call `skrollr.init([options]);` which returns an instance of the singleton skrollr class. Subsequent calls to `init()` will just return the same skrollr instance again.

Possible options for `init()` are

### smoothScrolling=true

Smooth scrolling smoothens your animations. When you scroll down 50 pixel the animations will transition instead of jumping to the new position.

The global setting can be overridden per element by setting `data-smooth-scrolling` to `on` or `off`.

### smoothScrollingDuration=200

The number of milliseconds the animations run after the scroll position changed the last time.

### constants={}

An object containing integers as values. The keys can contain `[a-z0-9_]`. They *do not* need a leading underscore.

Example: `data-_myconst-200` and `skrollr.init({constants: {myconst: 300}})` result in `data-500`.

### scale=1

By default skrollr uses the largest key frame and makes document height + viewport height this high, thus the max possible scroll top offset. If your animation runs too fast or too slow, just adjust the scale value.

When `forceHeight` is set to false, `scale` is ignored.

`scale` affects `constants` as well.

`scale` does only affect key frames in absolute mode, e.g. `data-500` but not `data-top`.

###forceHeight=true

`true`: Make sure the document is high enough that all key frames fit inside. Example: You use `data-1000`, but the content only makes the document 500px high. skrollr will ensure that you can scroll down the whole 1000px. Or if you use relative mode, e.g. `data-top-bottom`, skrollr will make sure the bottom of the element can actually reach the top of the viewport.

`false`: Don't manipulate the document and just keep the natural scrollbar.

###mobileCheck=function() {...}

This option allows you to pass a function to skrollr overwriting the check for mobile devices. The function should return `true` when mobile scrolling should be used and `false` if not.

The default looks like this

```js
function() {
	return (/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera);
}
```

### edgeStrategy='set'

This option specifies how to handle animations when the scroll position is outside the range on the keyframes (i.e. before the first or after the last keyframe).

One of three options are possible

* `set` _(default)_: When before/after the first/last keyframe, apply the styles of the first/last keyframe to the element.
* `ease`: Same as set, but the values will be transformed using the given easing function.
* `reset`: When before/after the first/last keyframe, apply the styles which the element had before skrollr did anything. This means resetting the class attribute as well as removing all styles which have been applied to the `style` property. This means the element won't have any `skrollable-*` CSS classes.

Example:

Given the following element with two keyframes

```html
<div data-1000="left:0%;top:0%;" data-2000="left:50%;top:100%;" style="left:-100%;" class="section"></div>
```

and the following easing function which always returns `0.5` (I know it's pointless, but it's just an example. A real world example would be an easing function that represents a curve and starts somewhere between `0` and `1`, but not at `1`)

```js
function(p) {
	return 0.5;
}
```

and imagine the scrollbar is at `237`, which is below the first keyframe which is at `1000`.

* `set` will result in `<div style="left:0%;top:0%;" class="section skrollable skrollable-before"></div>` which is plain `data-1000`.
* `ease` will result in `<div style="left:25%;top:50%;" class="section skrollable skrollable-before"></div>` which is `0.5 * data-1000`.
* `reset` will result in `<div style="left:-100%;" class="section"></div>` which is what the element originally had. Note how `top` is missing.


### beforerender

A listener function getting called each time right before we render everything. The function will be passed an object with the following properties:

```js
{
	curTop: 10, //the current scroll top offset
	lastTop: 0, //the top value of last time
	maxTop: 100, //the max value you can scroll to. curTop/maxTop will give you the current progress.
	direction: 'down' //either up or down
}
```

Returning `false` will prevent rendering.

### render

A listener function getting called right after we finished rendering everything. The function will be passed the same parameters as `beforerender`

### easing

An object defining new easing functions or overwriting existing ones. Easing functions get just one argument, which is a value between 0 and 1 (the percentage of how much of the animation is done). The function should return a value between 0 and 1 as well, but for some easings a value less than 0 or greater than 1 is just fine.

An easing function basically transforms the timeline for an animation. When the animation should be 50% done, you can transform it to be 90% done or whatever your function does.

Example:

```js
skrollr.init({
	easing: {
		//This easing will sure drive you crazy
		wtf: Math.random,
		inverted: function(p) {
			return 1 - p;
		}
	}
});
```

You can now use the easing functions like any other.

skrollr ships with some built in functions:

* linear: The default. Doesn't need to be specified.
* quadratic: To the power of two. So 50% looks like 25%.
* cubic: To the power of three. So 50% looks like 12.5%
* begin/end: They always return 0 or 1 respectively. No animation.
* swing: Slow at the beginning and accelerates at the end. So 25% -> 14.6%, 50% -> 50%, 75% -> 85.3%
* sqrt: Square root. Starts fast, slows down at the end.
* easeOutCubic
* bounce: Bounces like a ball. See https://www.desmos.com/calculator/tbr20s8vd2 for a graphical representation.

skrollr.get()
-----

Returns the skrollr instance if `init()` has been called before or `undefined`.

Public API
-----

Calling `init()` returns an instance of skrollr which exposes a public api.

### refresh([elements])

Reparses all given `elements`. You can pass a single element or an array-like element (Array, NodeList, jQuery object)

Useful when

* elements in `relative` mode change and need to be updated
* data-attributes are manipulated dynamically
* new elements are added to the DOM and should be controlled by skrollr

When no `elements` are given, all elements in the document will be parsed again. In fact, when calling `skrollr.init()` skrollr uses `refresh()` without parameters internally.

Time consuming operation, should not be called on every rendering.

### relativeToAbsolute(element, viewportAnchor, elementAnchor)

returns an integer which represents the absolute scroll position which correlates to the relative anchor.

`element` must be a DOM element.

`viewportAnchor` and `elementAnchor` must be one of `top`, `center` or `bottom`

Example:

```js
var offset = s.relativeToAbsolute(document.getElementById('foo'), 'top', 'bottom');

//offset contains the scroll position at which #foo's bottom is at the top of the viewport.
//If you now use setScrollTop(offset) or animateTo(offset) #foo's bottom will be perfectly aligned with the top of the viewport. Yay.
```

### getScrollTop()

Returns the current scroll offset in pixels. Normalizes different browser quirks and handles mobile scrolling.
### setScrollTop(top[, force = false])

Sets the top offset using `window.scrollTo(0, top)` on dektop or updating the internal state in case of mobile scrolling.

When `force` is set to `true`, skrollr will jump to the new position without any kind of transition. By default the global `smoothScrolling` setting applies.

### animateTo(top[, options])

Animates the scroll position from current position to `top`. Possible `options` are

#### duration

How long the animation should run in milliseconds. The default is `1000` or one second.

#### easing

The name of an easing function. The same functions can be used as for property animations. Default is `linear` .

#### done

A function to be called after the animation finished. When you pass a `top` value, which is the same as the current, then the function will be called immediately. The function gets a boolean argument `interrupted` which indicates if the animation was iterrupted by `stopAnimateTo` or finished to the end.

### stopAnimateTo()

Stops the animation and calls the `done` callback passing `true` as `interrupted` arguments.

### isAnimatingTo()

Returns if an animation caused by animateTo is running.

### on(name, fn)

Set a listener function for one of the events described in the options section (beforerender, render). Only one listener can be attached at a given time. This method overwrites the current listener, if any.

### off(name)

Removes the listener for the given event.

Changelog
=====

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

Contributors
=====

* [Alexander Prinzhorn, repo owner, main contributor](https://github.com/Prinzhorn)
* [Ali Karbassi](https://github.com/karbassi)
* [Tri Nguyen](https://github.com/idlesysop)
* [Charles J Hardy](https://github.com/ChuckJHardy)
* [Oscar Otero](https://github.com/oscarotero)
* [Jim Osborn](https://github.com/ThinkTherefore)
* [Dowon Kang](https://github.com/dowonkang)
* [rbeitra](https://github.com/rbeitra)
* Everyone giving feedback on Twitter and through other channels.

Special thanks to [cubiq](https://github.com/cubiq) for creating [iScroll](https://github.com/cubiq/iscroll) which powered mobile support prior to skrollr 0.6.