skrollr (v 0.3.11)
======

**Parallax\* scrolling** lib with **zero dependencies** (seriously, you **don't** need jQuery) in just under **5.5k minified** (2.6k gzipped). No JavaScript skills needed.

\**Actually, skrollr is much more. It's a full-fledged scrolling animation library. In fact, you can use it and still have no parallax scrolling at all. But calling it "parallax" is part of my ongoing effort to play buzzword bingo as often as possible. By the way, skrollr leverages HTML5 and CSS3 ;-)*

[Examples](https://github.com/Prinzhorn/skrollr/tree/master/examples)


Documentation
======

Abstract
------

skrollr allows you to animate any CSS property of any element depending on the horizontal scrollbar position. All you need to do is define key frames for each element at certain points in top offset.

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

### more details

Now that you know how to set up simple animations, it's time for some details.

Imagine the following animation

```html
<div data-100="left:0%;" data-200="top:0%;" data-300="left:50%;" data-400="top:50%;"></div>
```

The first thing you need to know: The element won't be rendered for frames 0 to 99. If you wan't to make an element visible without defining any properties, you can use an empty attribute like ```data-50=""```. The key-frame will then interhit all properties from his right neighbors (see next paragraph).

One could expect "left" to have a value of "25%" at keyframe 200. That is **not** the case, by design skrollr only interpolates values between key frames which are direct **neighbors**. What actually happens is that skrollr internally fills out all holes once from left and then from right. So the above is equivalent to

```html
<div data-100="left:0%;top:0%;" data-200="left:0%;top:0%;" data-300="left:50%;top:0%;" data-400="left:50%;top:50%;"></div>
```

### data-end-[offset], doing it from behind

Imagine you have 100 elements with different key frames and you want to add the 101th element with an animation which runs for the last 200 pixels. It's hard to find which of the 100 elements has the biggest key frame and it would be a pain to later adjust all values because you need more room to add some animations in between.

That's why it's possible to add key frames **counting from the end**. It's best practice to add the actual key frame value to elements, which sure will be there for the whole time like backgrounds and
then use data-end to synchronize others with this element.

Example

```html
<div data-0="background:rgb(0,100,0);" data-1000="background:rgb(100,100,255);">
	I will change color for the whole 1000 pixels of scrolling
</div>

<div data-end-200="top:0px;" data-end="top:100px;">
	I will appear 200 pixels before we reach the bottom and move for the last 200 pixels
</div>
```

Even better, you can use both notations on the same element

```html
<!-- In this example data-end-100 is equal to data-900 -->
<div data-0="left:0px;" data-end-100="left:100px;top:0px;" data-1000="top:100px;">
	I will move 100 pixels from the left for 900 pixels of scrolling
	and then I will move down for the last 100 pixels of scrolling.
</div>
```

**heads up:** In the above example ```data-end-100``` is equal to ```data-900```, because there's no other element on the page. data-end is the **global** max key frame, not for the element it is on. If there would be another element with ```data-5000```, when ```data-end-100``` would equal ```data-4900```.

### peventing interpolation

The reason why skrollr is so lightweight and powerfull is because it literally interpolates **any** numbers it can find. If you want to prevent some side effect, you can supress interpolation for a specific value by prepending an exclamation point.

Example:
```html
<!-- This will get your image url f***** up because there's no "kitten0.4561799.jpg" and the like -->
<div data-0="background-image:url(kitten1.jpg);" data-100="background-image:url(kitten2.jpg)"></div>

<!-- Better -->
<div data-0="background-image:!url(kitten1.jpg);" data-100="background-image:!url(kitten2.jpg)"></div>
```

**Note:** The values for both keyframes need to be prefixed if you want to avoid skrollr throwing an exception at you!

### skrollr.css

skrollr comes with a file called ```skrollr.css```. This file contains a small set of CSS rules to get you started with skrollr. Every element with a "data-[number]" attribute will automatically get the "skrollable" class. This file is by no means complete or even mandatory. The default rules do make sense for desktop development, where it's not a problem to position elements "fixed". If you just want to do some lightweight stuff, maybe just scroll the background at a different speed then the rest of your page, just throw ```skrollr.css``` away an add your data- attributes to the body element.

### CSS prefixes

skrollr automatically **sets the prefixed properties for you**. You not just don't have to use prefixed properties, it's even wrong to do so. The following will rotate an element in every browser that supports transform, no matter if they call it "-moz-transform" or "-webkit-transform".

```html
<div data-0="transform:rotate(0deg);" data-1000="transform:rotate(180deg);">Look ma, I'm rotating!</div>
```

### limitations

Now that we just talked about CSS transforms, there are some limitations of skrollr you should be aware of.

* All numeric values have to have the same unit. It's not possible to animate from "0%" to "100px". skrollr won't complain, but results are undefined.
* Animations between values which are composed of multiple numeric values like "margin:0 0 0 0;" are only possible for the same number of values. "margin:0px 0px 0px 0px;" to "margin:0px 100px 50px 3px;" is fine, but not "margin:10px;" to "margin:5px 10px;".
* "matrix()" is not *really* supported for CSS transforms. skrollr will just interpolate all the numbers, no matter if it makes sense. May result in some funny effects :-D
* Animations between CSS transforms only work when they use the same functions in same order. From "rotate(0deg) scale(1)" to "rotate(1000deg) scale(5)" is fine.
* Color animations don't support named values like "red" or hex values like "#ff0000". Instead, you have to use "rgb", "rgba", "hsl" and "hsla". Don't worry, there's a skrollr plugin for IE < 9 to support "hsl" (without "a"!) and to fall rgba back to rgb.
* Color animations only work for same color functions. "hsl" to "hsl" or "hsla" is fine, but not "rgb" to "hsl". Which makes sense, because animating from the same colors in rgb space and in hsl space results in different animations (hsl gives you the nice rainbow stuff).

But feel free to send in a pull request to fix any of them. Just keep in mind that keeping skrollr as lightweight as possible has high priority.

JavaScript
------

On the JavaScript part there's not much to do (you can, if you want to!). So if you only know CSS and HTML, perfect.

All there is to do is to call ```skrollr.init([options]);```.

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

In the wild
------

* http://www.futuremylove.com/
* http://jonnyacevedo.com/

Contributors
------

* [Alexander Prinzhorn, repo owner, main contributor](https://github.com/Prinzhorn)
* [Ali Karbassi](https://github.com/karbassi)
* [Tri Nguyen](https://github.com/idlesysop)
