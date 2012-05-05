skrollr (v 0.3.0)
======

**Parallax\* scrolling** lib with **zero dependencies** (seriously, you **don't** need jQuery) in just over **5.2k minified** (2.3k gzipped). No JavaScript skills needed.

\**Actually, skrollr is much more. It's a full-fledged scrolling animation library. In fact, you can use it and still have no parallax scrolling at all. But calling it "parallax" is part of my ongoing effort to play buzzword bingo as often as possible. By the way, skrollr leverages HTML5 and CSS3 ;-)*

[Examples](https://github.com/Prinzhorn/skrollr/tree/master/examples)


Documentation
======

Abstract
------

skrollr allows you to animate any CSS property of any element depending on the horizontal scrollbar position.

All you need to do is define key frames for each element at certain points in top offset. Each key frame consists of one or multiple CSS properties and values.


HTML Markup
------

### Quick start shim

```html
<!DOCTYPE html>
<html>
<head>
	<title>Your title</title>

	<link href="skrollr.css" rel="stylesheet" type="text/css" />
</head>

<body>
	<!-- Your elements go here -->

	<script type="text/javascript" src="skrollr.js"></script>
	<!--[if lt IE 9]>
	<script type="text/javascript" src="plugins/skrollr.ie.js"></script>
	<![endif]-->
	<script type="text/javascript">
	skrollr.init();

	//OR you may call the init-function at some other point. you could for example use an image preloader.
	//window.onload = function() {
	//	skrollr.init();
	//};
	</script>
</body>

</html>
```

You can read more about the init-function below (JavaScript-section).

### let's get serious

Any markup you are about to see now must be inside the ```<body>```.

Simple animation of one property

```html
<div data-0="padding:0px;" data-1000="padding:300px;">WOOOT</div>
```

That was easy, right?

We are using the HTML5 data attributes to attach key frames to DOM elements. The numbers represent the key frame position (the top scroll offset in pixel). The highest key frame found in the document will be used to set the the max top scroll offset.

You can set multiple properties.

```html
<div data-0="padding:0px;color:hsl(0,50%,50%);" data-1000="padding:300px;color:hsl(360,50%,50%);">WOOOT</div>
```

And you can specify easing functions for each property using square brackets.

```html
<div data-0="padding[cubic]:0px;color:hsl(0,50%,50%);" data-1000="padding:300px;color:hsl(360,50%,50%);">WOOOT</div>
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
\tI will change color for the whole 1000 pixels of scrolling
</div>

<div data-end-200="top:0px;" data-end="top:100px;">
\tI will appear 200 pixels before we reach the bottom and move for the last 200 pixels
</div>
```

Even better, you can use both notations on the same element

```html
<!-- In this example data-end-100 is equal to data-900 -->
<div data-0="left:0px;" data-end-100="left:100px;top:0px;" data-1000="top:100px;">
\tI will move 100 pixels from the left for 900 pixels of scrolling
\tand then I will move down for the last 100 pixels of scrolling.
</div>
```

**heads up:** In the above example ```data-end-100``` is equal to ```data-900```, because there's no other element on the page. data-end is the **global** max key frame, not for the element it is on. If there would be another element with ```data-5000```, when ```data-end-100``` would equal ```data-4900```.

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
* Animations between CSS transforms only work when they use the same functions in same order. From "rotate(0deg) scale(1)" to "roate(1000deg) scale(5)" is fine.
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

A listener function getting called right after before we finished rendering everything. The function will be passed the same parameters as ```beforerender```

#### easing

An object defining new easing functions or overwriting existing ones. Easing functions get just one argument, which is a value between 0 and 1 (the percentage of how much of the animation is done). The function should return a value between 0 and 1 as well, but for some easings a value less than 0 or greater than 1 is just fine.

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

### plugins

Currently there's only a simple api for plugins. Just call ```window.skrollr.plugin('setStyle', /* your function */)``` to hook into the setStyle method. Your function will get three parameters: The DOM element, the CSS property (camel cased) and the value. If you need more plugin hooks, just add them and submit them with your pull request for the plugin itself.

Contributors
------

* [Alexander Prinzhorn](https://github.com/Prinzhorn)
* [Ali Karbassi](https://github.com/karbassi)
