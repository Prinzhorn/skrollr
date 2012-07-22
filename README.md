skrollr (v 0.4.0-alpha)
======

Stand-alone **Parallax\* scrolling** lib with **zero dependencies** (seriously, you **don't** need jQuery) in just under **6.4k minified** (3k gzipped).

Designer friendly. No JavaScript skills needed. Just plain CSS.

\**Actually, skrollr is much more. It's a full-fledged scrolling animation library. In fact, you can use it and still have no parallax scrolling at all. But calling it "parallax" is part of my ongoing effort to play buzzword bingo as often as possible. By the way, skrollr leverages HTML5 and CSS3 ;-)*

[Examples](https://github.com/Prinzhorn/skrollr/tree/master/examples)


Documentation
======

Abstract
------

skrollr allows you to animate any CSS property of any element depending on the horizontal scrollbar position. All you need to do is define key frames for each element at certain points in top scroll offset.

Other libraries require you to write JavaScript in order to define your animations. This introduces two main problems:

* Animation and element are not at one place. In order to find out if any animations are defined for a given element, you have to scroll through many (sometimes thousands) of lines of JavaScript.
* You have to learn a new syntax which is often very verbose and limited at the same time.

With skrollr, you put the definition of your key frames right where they belong (to the element) using a syntax you already know (plain CSS).

Let's get serious
------

Simple animation of one property

```html
<div data-0="padding:0px;" data-1000="padding:300px;">WOOOT</div>
```

That was easy, right?

We are using the HTML5 data attributes to attach key frames to DOM elements. The numbers represent the key frame position (the top scroll offset in pixel). The highest key frame found in the document will be used to set the the max top scroll offset.

You can set multiple properties, just like with the ```style``` attribute.

```html
<div data-0="padding:0px;color:hsl(0,50%,50%);" data-1000="padding:300px;color:hsl(360,50%,50%);">WOOOT</div>
```

And you can specify easing functions for each property using square brackets. That is an extension to the default CSS syntax.

```html
<div data-0="padding[bounce]:0px;color[cubic]:hsl(0,50%,50%);" data-1000="padding:300px;color:hsl(360,50%,50%);">WOOOT</div>
```

skrollr automatically **sets the prefixed properties for you**. You not just don't have to use prefixed properties, it's even wrong to do so. The following will rotate an element in every browser that supports transform, no matter if they call it "-moz-transform" or "-webkit-transform".

```html
<div data-0="transform:rotate(0deg);" data-1000="transform:rotate(180deg);">Look ma, I'm rotating!</div>
```

### CSS classes

All elements under skrollr's control (elements with appropriate data-attributes) will get the ```skrollable``` class.

In addition we add the ```rendered``` **or** ```unrendered``` class, depending on whether an element is currently being styled by skrollr, that means the current scroll offset is in between the key frames of that element, or not.

### Using anchors

Now it gets really exciting. Being only able to define key frames in absolute values is simply insufficient for some cases. For example if you don't know where an element will exactly be in the document. That's why there are two modes for key frames, namely ```absolute``` and ```relative``` move.

**Note**: You probably don't want to mix both modes on the same element.

#### absolute mode (or document mode)

Absolute mode is what you already know about. The key frames are in absolute values, so how much the **document** has been scrolled down.

The syntax is ```data-[offset]-[anchor]```, where ```offset``` can be any integer (0 is default) and ```anchor``` can be either ```start``` (default) or ```end```. Either ```offset``` or ```anchor``` can be ommited in some situations. Here are some examples of key frames and their meaning.

* ```data-0``` = ```data-start``` = ```data-0-start```: When the scroll top is 0.
* ```data-100``` = ```data-100-start```: When the scroll top is 100.
* ```data--100``` = ```data--100-start```: When the scroll top is -100 (sounds like nonsense, but keep in mind that interpolation will be relative to this point).
* ```data-end``` = ```data-0-end```: When offset is 0, but counting from the bottom of the document instead of from the top. In short: when you reach the bottom of the page.
* ```data-100-end```: 100px before we reach the bottom.
* ```data--100-end```: 100px after we reach the bottom (again, it's up to you whether you need it).

#### relative mode (or viewport mode)

Relative mode is something which has not been mentioned yet, even though it's very powerful. Instead of defining key frames relative to the **document**, we are able to define them depending on the position of the element in relation to the **viewport**.

The syntax is ```data-[offset]-(viewport-anchor)-[element-anchor]```, where ```offset``` can again be any integer and defaults to 0. Both ```viewport-anchor``` (mandatory) and ```element-anchor``` (optional) can be one of ```top```, ```center``` or ```bottom```. If ```element-anchor``` is ommitted, the value of ```viewport-anchor``` will be taken (just like with background-position). Here are some examples of key frames and their meaning.

* ```data-top``` = ```data-0-top``` = ```data-top-top``` = ```data-0-top-top```: When the element's top is aligned with the top of the viewport.
* ```data-100-top``` = ```data-100-top-top```: When the element's top is 100px above the top of the viewport.
* ```data--100-top``` = ```data--100-top-top```: When the element's top is 100px below the top of the viewport.
* ```data-top-bottom ```= ```data-0-top-bottom```: When the bottom of the element is at the top of the viewport (it's just not visible).
* ```data-center-center``` = ```data-0-center-center```: When the element is at the center of the viewport.
* ```data-bottom-center``` = ```data-0-bottom-center```: When the element's center is at the bottom of the viewport, thuss the upper half of the element is visible.

I guess you get the point ;-)

Here's an infographic for better understanding of anchors:
[![Anchors Guide](https://raw.github.com/Prinzhorn/skrollr/master/guide/anchor-position-guide.png)](https://raw.github.com/Prinzhorn/skrollr/master/guide/anchor-position-guide.pdf)

**Important**: All those values will be calculated up-front and transformed to ```absolute``` mode. So if either the element's box height changes (height, padding, border) or the elements position within the document, you need to call ```refresh()``` (see documentation in JavaScript section below).

### Filling missing values

Imagine the following animation

```html
<div data-100="left:0%;" data-200="top:0%;" data-300="left:50%;" data-400="top:50%;"></div>
```

One could expect ```left``` to have a value of ```25%``` at keyframe ```200```. That is **not** the case. By design skrollr only interpolates values between key frames which are direct **neighbors**. What actually happens is that skrollr internally fills out all holes once from left and then from right. So the above is equivalent to

```html
<div data-100="left:0%;top:0%;" data-200="left:0%;top:0%;" data-300="left:50%;top:0%;" data-400="left:50%;top:50%;"></div>
```

### Preventing interpolation

The reason why skrollr is so lightweight and powerfull is because it literally interpolates **any** numbers it can find. If you want to prevent some side effect, you can supress interpolation for a specific value by prepending an exclamation point.

Example:
```html
<!-- This will get your image url f***** up because there's no "kitten0.4561799.jpg" and the like -->
<div data-0="background-image:url(kitten1.jpg);" data-100="background-image:url(kitten2.jpg)"></div>

<!-- Better -->
<div data-0="background-image:!url(kitten1.jpg);" data-100="background-image:!url(kitten2.jpg)"></div>
```

**Note:** The values for both keyframes (at least the if they contain a number) need to be prefixed if you want to avoid skrollr throwing an exception at you!

### skrollr.css

skrollr comes with a file called ```skrollr.css```. This file contains a small set of CSS rules to get you started with skrollr. Every element with a "data-[number]" attribute will automatically get the "skrollable" class. This file is by no means complete or even mandatory. The default rules do make sense for desktop development, where it's not a problem to position elements "fixed". If you just want to do some lightweight stuff, maybe just scroll the background at a different speed then the rest of your page, just throw ```skrollr.css``` away an add your data- attributes to the body element.

### Limitations

Now that we just talked about CSS transforms, there are some limitations of skrollr you should be aware of.

* All numeric values have to have the same unit. It's not possible to animate from ```0%``` to ```100px```. skrollr won't complain, but results are undefined.
* Animations between values which are composed of multiple numeric values like ```margin:0 0 0 0;``` are only possible for the same number of values. ```margin:0px 0px 0px 0px;``` to ```margin:0px 100px 50px 3px;``` is fine, but not ```margin:10px;``` to ```margin:5px 10px;```.
* Animations between CSS transforms only work when they use the same functions in same order. From ```rotate(0deg) scale(1)``` to ```rotate(1000deg) scale(5)``` is fine.
* Color animations don't support named values like "red" or hex values like "#ff0000". Instead, you have to use ```rgb()```, ```rgba()```, ```hsl()``` and ```hsla```. Don't worry, there's a skrollr plugin for IE < 9 to support ```hsl()``` (without "a"!) and to fall rgba back to rgb.
* Color animations only work for same color functions. ```hsl()``` to ```hsl()``` or ```hsla()``` is fine, but not ```rgb()``` to ```hsl()```. Which makes sense, because animating from the same colors in rgb space and in hsl space results in different animations (hsl gives you the nice rainbow stuff).

But feel free to send in a pull request to fix any of them. Just keep in mind that keeping skrollr as lightweight as possible has high priority.

JavaScript
------

On the JavaScript part there's not much to do (you can, if you want to!). So if you only know CSS and HTML, perfect.

All there is to do is to call ```skrollr.init([options]);```. Subsequent calls to ```init()``` will just return the same skrollr instance again.

### options

Possible options include

#### scale=1

By default skrollr uses the largest key frame and makes document height + viewport height this high, thus the max possible scroll top offset. If your animation runs too fast or too slow, just adjust the scale value.

When ```forceHeight``` is set to false, ```scale``` is ignored.

####forceHeight=true

```true```: Make sure the document is high enough that all key frames fit inside. Example: You use ```data-1000```, but the content only makes the document 500px high. skrollr will ensure that you can scroll down the whole 1000px.

```false```: Don't manipulate the document and just keep the natural scrollbar. Tip: Use ```data-end``` to create nice effects on usual content-driven websites.

#### beforerender

A listener function getting called each time right before we render everything. The function will be passed an object with the following properties:

```js
{
	curTop: 10, //the current scroll top offset
	lastTop: 0, //the top value of last time
	maxTop: 100, //the max value you can scroll to. curTop/maxTop will give you the current progress.
	direction: 'down' //either up or down
}
```

Returning ```false``` will prevent rendering.

#### render

A listener function getting called right after we finished rendering everything. The function will be passed the same parameters as ```beforerender```

#### easing

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
* bounce: Bounces like a ball. See https://www.desmos.com/calculator/tbr20s8vd2 for a graphical representation.

**Note**: Your easing functions should return 1 for input of 1. After the keyframe is passed, skrollr sets the values to the values of this keyframe. So if you function returns .8 for input of 1, your elements will jump at the end. But you can also use this on purpose, like the "inverted" function in the above example. The element will do everything in reverse, but at end the jumps to the end position.

### Public API

Calling ```init()``` returns an instance of skrollr which exposes a public api.

#### refresh([elements])

Reparses all given elements. Useful when

* elements in ```relative``` mode change and need to be updated
* data-attributes are manipulated dynamically
* new elements are added to the DOM and should be controlled by skrollr

When no elements are given, all elements under control of skrollr will be parsed again.

Time consuming operation, should not be called on every rendering.

#### setScrollTop(top)

Sets the top offset using window.scroll(0, top)

#### animateTo(top[, options])

Animates the scroll position from current position to ```top```. Possible Options include

##### duration

How long the animation should run in milliseconds. The default is ```1000``` or one second.

##### easing

The name of an easing function. The same functions can be used as for property animations. Default is ```linear``` .

##### done

A function to be called after the animation finished. When you pass a ```top``` value, which is the same as the current, then the function will be called immediately.

#### on(name, fn)

Set a listener function for one of the events described in the options section (beforerender, render). Only one listener can be attachet at a given time. This method overwrites the current listener, if any.

#### off(name)

Removes the listener for the given event.

### plugins

Currently there's only a simple api for plugins. Just call ```window.skrollr.plugin('setStyle', /* your function */)``` to hook into the setStyle method. Your function will get three parameters: The DOM element, the CSS property (camel cased) and the value. If you need more plugin hooks, just add them and submit them with your pull request for the plugin itself.

Release notes
------

### 0.4.0

* *breaking* the ```data-end-[offset]``` syntax changed. It's now ```data-[offset]-end```.
* Fixed a bug where white spaces between style declarations were not ignored.
* Added support for anchors. Animations can now be specified relative to the elements position within the viewport.
* Added support for SVG elements.
* Added new method ```refresh()```.

In the wild
------

* http://www.futuremylove.com/
* http://jonnyacevedo.com/

Contributors
------

* [Alexander Prinzhorn, repo owner, main contributor](https://github.com/Prinzhorn)
* [Ali Karbassi](https://github.com/karbassi)
* [Tri Nguyen](https://github.com/idlesysop)
* [Charles J Hardy](https://github.com/ChuckJHardy)
* [Oscar Otero](https://github.com/oscarotero)
* Everyone giving feedback on Twitter and through other channels.
