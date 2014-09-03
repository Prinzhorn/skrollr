[![Build Status](https://secure.travis-ci.org/Prinzhorn/skrollr.png)](http://travis-ci.org/Prinzhorn/skrollr)

skrollr 0.6.26
=====

Stand-alone **parallax scrolling** JavaScript library for **mobile (Android, iOS, etc.) and desktop** in about 12k minified.

Designer friendly. No JavaScript skills needed. Just plain CSS and HTML.

_Actually, skrollr is much more than "just" **parallax scrolling**. It's a full-fledged scrolling animation library. In fact, you can use it and still have no parallax scrolling at all. But I wanted to sound hip and use some buzz-words. By the way, skrollr leverages HTML5 and CSS3 ;-)_

Resources
=====

Plugins
-----

### Official

* [skrollr-menu](https://github.com/Prinzhorn/skrollr-menu) - Hash navigation
* [skrollr-ie](https://github.com/Prinzhorn/skrollr-ie) - IE < 9 CSS fixes
* [skrollr-stylesheets](https://github.com/Prinzhorn/skrollr-stylesheets) - Keyframes inside CSS files

### Third party

* [skrollr-colors](https://github.com/FezVrasta/skrollr-colors) - Mix and match hex, rgb and hsl colors.
* [skrollr-decks](https://github.com/TrySound/skrollr-decks) - Fullpage presentation decks.

In the wild
-----

Check out the [wiki page](https://github.com/Prinzhorn/skrollr/wiki/In-the-wild) for websites using skrollr and feel free to add your own website :). You can also shamelessly add yourself to the list [here](https://github.com/Prinzhorn/skrollr/wiki/Agencies-and-freelancers) if you are offering paid skrollr support.

Further resources (tutorials etc.)
-----

Moved to the [wiki](https://github.com/Prinzhorn/skrollr/wiki/Resources).


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

If you would rather have the keyframes inside a separate file, take a look at [skrollr-stylesheets](https://github.com/Prinzhorn/skrollr-stylesheets).

If you prefer to use JavaScript to define your animations make sure to take a look at [ScrollMagic](https://github.com/janpaepke/ScrollMagic). It depends on both jQuery and the Greensock Animation Platform (GSAP) and gives you full control over every detail of your animations.

Let's get serious
------

First of all you want to include the `skrollr.min.js` file at the bottom of your document (right before the closing `</body>`) and then call `skrollr.init()`. Or you can place it inside the `<head>` if you want to, but make sure to call `init()` once the document has been loaded (e.g. jQuery's `ready` event or even `window.onload`).

```html
	<script type="text/javascript" src="skrollr.min.js"></script>
	<script type="text/javascript">
	var s = skrollr.init();
	</script>
</body>
```

If you are using require.js to structure your project, you can use skrollr as a module as well.

```javascript
require(['skrollr'], function(skrollr){
	var s = skrollr.init();
});
```

If you're familiar with CSS, you already know the `style` attribute. In order to create an animation you would need several, at least two, of them. That's what skrollr does. You use the HTML5 `data-` attributes to define multiple sets of styles (we call each of them **keyframe**) and skrollr interpolates between them.

#### Let's change the background-color of a `div` starting at `#00f` when the scrollbar is at the top and ending with `#f00` when the user scrolled 500 pixels down

```html
<div data-0="background-color:rgb(0,0,255);" data-500="background-color:rgb(255,0,0);">WOOOT</div>
```
[View in browser](http://prinzhorn.github.io/skrollr/examples/docu/1.html)

##### Lessons learned

* Skrollr ensures that you can actually scroll down 500 pixels or more, even if there's not enough content. You can suppress this by using the `forceHeight` option.
* You can't use `#00f` or `#0000ff`. You need to use `rgb` or `hsl` and explicitly decide which color space you want because they result in different animations (HSL is much cooler most of the time). Don't worry, the IE plugin teaches IE < 9 to display `rgb` and `hsl` correctly.

#### Now let's do a barrel roll at the same time

```html
<div data-0="background-color:rgb(0,0,255);transform:rotate(0deg);" data-500="background-color:rgb(255,0,0);transform:rotate(360deg);">WOOOT</div>
```
[View in browser](http://prinzhorn.github.io/skrollr/examples/docu/2.html)

##### Lessons learned

* Skrollr handles all these nasty CSS prefixes for you. Just -moz-relax and get yourself a cup of -webkit-coffee.

#### Now let the rotation bounce like it were a hip-hop video

```html
<div data-0="background-color:rgb(0,0,255);transform[bounce]:rotate(0deg);" data-500="background-color:rgb(255,0,0);transform[bounce]:rotate(360deg);">WOOOT</div>
```
[View in browser](http://prinzhorn.github.io/skrollr/examples/docu/3.html)

#### Lessons learned

* Skrollr allows non-linear animations. The so called *easing functions* can be used per-property by putting them in square brackets behind the property. There's a built-in list of easing functions (see below in the [JavaScript](#javascript) section) and you can use your own functions by using the `easings` options.

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
Starting with version 0.5.0 skrollr officially supports mobile browsers including Android and iOS. Furthermore, mobile support has been rewritten from scratch for skrollr 0.6.0.

### The Problem with mobile and the solution

(If you're not interested in the details, just scroll down a bit to see what you need to do for mobile support.)

Some words on why this is an important milestone and why others failed: Mobile browsers try to save battery wherever they can. That's why mobile browsers delay the execution of JavaScript while you are scrolling. iOS in particular does this very aggressively and completely stops JavaScript. In short, that's the reason why many scrolling libraries either don't work on mobile devices or they come with their own scrollbar which is a usability nightmare on desktop. It was an important requirement while I developed skrollr that I don't force you to scroll the way I want it. skrollr on desktop uses a native scrollbar and you can scroll the way you want to (keyboard, mouse, etc.).

You just told me it doesn't work on mobile, but why does it? The answer is simple. When using skrollr on mobile you don't actually scroll. When detecting a mobile browser, skrollr disables native scrolling and instead listens for touch events and moves the content (more specific the `#skrollr-body` element) using CSS transforms.

### What you need in order to support mobile browsers

Starting with skrollr 0.6.0 there's just one thing you need to do: Include an element on your page with the id `skrollr-body`. That's the element we move in order to fake scrolling. The only case where you don't need a `#skrollr-body` is when using `position:fixed` exclusively. In fact, the skrollr website doesn't include a `#skrollr-body` element. If you need both fixed and non-fixed (i.e. static) elements, put the static ones inside the `#skrollr-body` element.

Or to put it differently: On mobile the `skrollr-body` element is moved using CSS transforms. You can't have `position:fixed` or `background-attachment:fixed` inside elements which use CSS transforms as per CSS spec (http://meyerweb.com/eric/thoughts/2011/09/12/un-fixing-fixed-elements-with-css-transforms/). That's why those elements need to be **outside** of the `skrollr-body` element.

AMD
---

Starting with `0.6.22` there's experimental AMD support. Please note that only skrollr core has AMD support so far. We will update the plugins in the future.

```js
require(['skrollr'], function(skrollr){
	skrollr.init();
});
```

Absolute vs relative mode
-----

Being only able to define key frames in absolute values is simply insufficient for some cases. For example, if you don't know exactly where an element will be in the document. That's why there are two modes for key frames, namely `absolute` and `relative` mode.

### absolute mode (or document mode)

The key frames are defined as absolute values describing how much the **document** has been scrolled down.

The syntax is `data-[offset]-[anchor]`, where `offset` can be any integer (0 is default) and `anchor` can be either `start` (default) or `end`. Either `offset` or `anchor` can be omitted in some situations. Here are some examples of key frames and their meaning.

* `data-0` = `data-start` = `data-0-start`: When the scroll top is 0.
* `data-100` = `data-100-start`: When the scroll top is 100.
* `data--100` = `data--100-start`: When the scroll top is -100 (sounds like nonsense, but keep in mind that interpolation will be relative to this point).
* `data-end` = `data-0-end`: When offset is 0, but counting from the bottom of the document instead of from the top. In short: when you reach the bottom of the page.
* `data-100-end`: 100px before we reach the bottom.
* `data--100-end`: 100px after we reach the bottom (again, it's up to you whether you need it).

### relative mode (or viewport mode)

Instead of defining key frames relative to the **document** (i.e. absolute), we are able to define them depending on the position of any element in relation to the **viewport**.

The syntax is `data-[offset]-(viewport-anchor)-[element-anchor]`, where `offset` can again be any integer and defaults to 0. Both `viewport-anchor` (mandatory) and `element-anchor` (optional) can be one of `top`, `center` or `bottom`. If `element-anchor` is omitted, the value of `viewport-anchor` will be taken (just like with background-position). Here are some examples of key frames and their meaning.

* `data-top` = `data-0-top` = `data-top-top` = `data-0-top-top`: When the element's top is aligned with the top of the viewport.
* `data-100-top` = `data-100-top-top`: When the element's top is 100px above the top of the viewport.
* `data--100-top` = `data--100-top-top`: When the element's top is 100px below the top of the viewport.
* `data-top-bottom `= `data-0-top-bottom`: When the bottom of the element is at the top of the viewport (it's just not visible).
* `data-center-center` = `data-0-center-center`: When the element is at the center of the viewport.
* `data-bottom-center` = `data-0-bottom-center`: When the element's center is at the bottom of the viewport, thus the upper half of the element is visible.

By default the element is the element where the key frames are defined on (self), but can be any element on the page. You can optionally specify which element you want by using the `data-anchor-target` and any CSS selector. The first element on the page matching the selector will be used. `data-anchor-target` requires IE 8 or greater.

Examples: `data-anchor-target="#foo"` or `data-anchor-target=".bar:not(.bacon) ~ span > a[href]"`

**Note**: If you need to support IE 7, then you may only use IDs as `anchor-target`s, i.e. `#foo`. The IE plugin maps `querySelector` to `getElementById`.

Here's an infographic for better understanding of anchors (click to open PDF):

[![Anchors Guide](https://raw.github.com/Prinzhorn/skrollr/master/guide/anchor-position-guide.png)](https://raw.github.com/Prinzhorn/skrollr/master/guide/anchor-position-guide.pdf)

**Important**: All those values will be calculated up-front and transformed to `absolute` mode. So if either the element's box height changes (height, padding, border) or the elements position within the document, you probably need to call `refresh()` (see documentation in JavaScript section below). **Window resizing is handled by skrollr.**


Percentage offsets
------------------

All offsets shown above are given in absolute pixel values, e.g. `data-300` for `300px` from the top or `data-13-top-bottom` for a `13px` offset to the `top-bottom` anchor. As of skrollr `0.6.13` you can also have offsets as percentages of the viewport by appending a `p` to the number. For example `data-75p` for when you scrolled down `75%` of the viewport or `data-10p-center` to have a `10%` offset from the `center` anchor.


Hash navigation
-----

Check out the [skrollr-menu](https://github.com/Prinzhorn/skrollr-menu) plugin.

Working with constants
-----

I was lying to you. The syntax for absolute mode is not `data-[offset]-[anchor]` and for relative mode it's not `data-[offset]-(viewport-anchor)-[element-anchor]`. In both cases, `offset` can be preceded by a constant which can be passed to the `ìnit` method. The name of the constant needs to be preceded with an underscore.

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

Dynamic constants
-----------------

Starting with skrollr `0.6.19` the word "constants" doesn't quite fit anymore, but who cares.

You can now use functions and percentages as constants. They are automatically evaluated when the window is resized or if you call `refresh`.

```js
skrollr.init({
	constants: {
		foo: function() {
			//Note: you can access the skrollr instance with `this` for things like `this.relativeToAbsolute`
			return Math.random() * 100;//trolololol
		},
		vh: '100p'
	}
});
```

CSS classes
-----

skrollr will add a `skrollr` class to the `HTML` element when calling `init` and will remove a `no-skrollr` class if present. Additionally, it will add a `skrollr-desktop` or `skrollr-mobile` class depending on which it detects. This allows fallback CSS rules to create a good user experience on unsupported devices or when JavaScript or skrollr are disabled.

All elements under skrollr's control (elements with appropriate data-attributes) will get the `skrollable` class. In addition, we add either the `skrollable-before`, `skrollable-between` **or** `skrollable-after` class, depending on whether the current scroll position is before, between or after the first/last (smallest/largest) keyframe of an element.

Animating attributes
--------------------

Starting with skrollr 0.6.24 you can also animate attribute and not just style properties. This is especially a big thing because in the SVG world many properties are implemented as attributes and not in CSS. Animating an attribute couldn't be simplier, just prefix the property with an `@` symbol!

```html
<polygon
	points='426,720   -200,720   -200,0   955,0'
	data-0="@points:426,720   -200,720   -200,0   955,0"
	data-500="@points:380,720   -200,720   -200,0   1302,0">
</polygon>
```

Note: as always, skrollr doesn't do any magic. It doesn't understand what a polygon or points are. It's only interpolating numbers, that's it. So make sure you have the same number of numbers in your keyframes (8 in this case).

Filling missing values
-----

Imagine the following animation

```html
<div data-100="left:0%;" data-200="top:0%;" data-300="left:50%;" data-400="top:50%;"></div>
```

One could expect `left` to have a value of `25%` at keyframe `200`. That is **not** the case. By design, skrollr only interpolates values between key frames which are direct **neighbors**. What actually happens is that skrollr internally fills out all holes once from left and then from right. So the above is equivalent to

```html
<div data-100="left:0%;top:0%;" data-200="left:0%;top:0%;" data-300="left:50%;top:0%;" data-400="left:50%;top:50%;"></div>
```

Preventing interpolation
-----

The reason why skrollr is so lightweight and powerful is because it literally interpolates **every** number it can find. If you want to prevent some side effect, you can suppress interpolation for a specific value by prepending an exclamation point.

Example:
```html
<!-- This will get your image url f***** up because there's no "kitten1.4561799.jpg" and the like -->
<div data-0="background-image:url(kitten1.jpg);" data-100="background-image:url(kitten2.jpg)"></div>

<!-- Better -->
<div data-0="background-image:!url(kitten1.jpg);" data-100="background-image:!url(kitten2.jpg)"></div>
```

**Note:** The values for both keyframes (if they contain a number) need to be prefixed if you want to avoid skrollr throwing an exception at you!

Limitations
-----

There are some limitations of skrollr you should be aware of.

* All numeric values have to have the same unit, even `0` needs a unit. It's not possible to animate from `5%` to `100px`. skrollr won't complain, but results are undefined.
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

Smooth scrolling smoothens your animations. When you scroll down 50 pixels, the animations will transition instead of jumping to the new position.

The global setting can be overridden per element by setting `data-smooth-scrolling` to `on` or `off`.

### smoothScrollingDuration=200

The number of milliseconds the animations run after the scroll position changed the last time.

### constants={}

An object containing integers as values. The keys can contain `[a-z0-9_]`. They *do not* need a leading underscore.

Example: `data-_myconst-200` and `skrollr.init({constants: {myconst: 300}})` result in `data-500`.

### scale=1

By default, skrollr uses the largest key frame and makes document height + viewport height this high, thus the max possible scroll top offset. If your animation runs too fast or too slow, just adjust the scale value.

`scale` only affects keyframes in absolute mode.

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
	return (/Android|iPhone|iPad|iPod|BlackBerry/i).test(navigator.userAgent || navigator.vendor || window.opera);
}
```

### mobileDeceleration=0.004

The amount of deceleration for momentum scrolling on mobile devices. This options tells skrollr how fast or slow you want the scrolling to stop after the user lifted his finger.

Set it to `1` to disable momentum scrolling.

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

A listener function that gets called each time right before we render everything. The function will be passed an object with the following properties:

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

A listener function that gets called right after we finished rendering everything. The function will be passed with the same parameters as `beforerender`.

Example

```js
skrollr.init({
	render: function(data) {
		//Log the current scroll position.
		console.log(data.curTop);
	}
});
```

### keyframe

**Experimental**

In order to receive `keyframe` events from an element, add the `data-emit-events` attribute to the element. The keyframe function will be called with three arguments

1. The `element` that passed the keyframe.
2. The `name` of the keyframe, camel-cased (see example).
3. The `direction` the user is scrolling.

Example:

```html
<div
	data-500="..."
	data-top-bottom="..."
	data-_offset-center="..."
	data-emit-events
>
	Some content
</div>
```

```js
skrollr.init({
	keyframe: function(element, name, direction) {
		//name will be one of data500, dataTopBottom, data_offsetCenter
	}
});
```

Note: this is experimental, expect the API to change! Originally I wanted to emit the events right on the element, so you could do this

```js
//Wouldn't this be nice?
document.querySelector('#foo').addEventListener('skrollr.dataTopBottom.up', function() {
	//#foo just passed the data-top-bottom keyframe while scrolling up
}, false)
```

but IE.

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
* outCubic
* bounce: Bounces like a ball. See https://www.desmos.com/calculator/tbr20s8vd2 for a graphical representation.

skrollr.get()
-----

Returns the skrollr instance if `init()` has been called before or `undefined`.

Public API
-----

Calling `init()` returns an instance of skrollr which exposes a public api.

### refresh([elements])

Reparses all given `elements`. You can pass a single element or an array-like element (Array, NodeList or jQuery object)

Useful when

* Elements in `relative` mode change and need to be updated.
* Data-attributes are manipulated dynamically.
* New elements are added to the DOM and should be controlled by skrollr.

When no `elements` are given, all elements in the document will be parsed again. In fact, when calling `skrollr.init()` skrollr uses `refresh()` without parameters internally.

Time consuming operations, should not be called on every rendering.

### relativeToAbsolute(element, viewportAnchor, elementAnchor)

Returns an integer which represents the absolute scroll position which correlates to the relative anchor.

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

### getMaxScrollTop()

Returns the number of pixels that can be scrolled down in total. If `forceHeight` is true, that's usually the largest keyframe. Otherwise it's the height of the document minus the viewport height.

### setScrollTop(top[, force = false])

Sets the top offset using `window.scrollTo(0, top)` on desktop or updating the internal state in case of mobile scrolling.

When `force` is set to `true`, skrollr will jump to the new position without any kind of transition. By default, the global `smoothScrolling` setting applies.

### isMobile()

Returns if skrollr runs in mobile mode (see also `mobileCheck` option).

### animateTo(top[, options])

Animates the scroll position from current position to `top`. Possible `options` are

#### duration

How long the animation should run in milliseconds. The default is `1000` or one second.

#### easing

The name of an easing function. The same functions can be used as for property animations. Default is `linear` .

#### done

A function to be called after the animation finished. When you pass a `top` value, which is the same as the current, then the function will be called immediately. The function gets a boolean argument `interrupted` which indicates if the animation was interrupted by `stopAnimateTo` or finished to the end.

### stopAnimateTo()

Stops the animation and calls the `done` callback passing `true` as `interrupted` arguments.

### isAnimatingTo()

Returns if an animation caused by animateTo is running.

### on(name, fn)

Set a listener function for one of the events described in the options section (beforerender, render, keyframe). Only one listener can be attached at a given time. This method overwrites the current listener, if any.

### off(name)

Removes the listener for the given event.


### destroy()

Destroys skrollr. All `class` and `style` attributes will be set to the values they had before.

Changelog
=====

See [HISTORY.md](https://github.com/Prinzhorn/skrollr/blob/master/HISTORY.md).
