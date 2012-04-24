skrollr (v 0.2.0)
======

**Parallax scrolling** lib with **zero dependencies** in just over **7k minified** (3k gzipped). No JavaScript skills needed.


Documentation
======

Abstract
------

skrollr allows you to animate any css property of any element depending on the horizontal scrollbar position.

All you need to do is define key frames for each element at certain points in ~~time~~ top offset. Each key frame consists of one or multiple css properties and values.


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

The numbers represent the key frame position (the top scroll offset in pixel). The highest key frame found in the document will be used to set the the max top scroll offset. There's one special key frame called "end" (i.e. "**data-end**=") which is the same as setting the largest value on each element. This makes it easier to have animations stop at the same time on the end.

You can set multiple properties.

```html
<div data-0="padding:0px;color[cubic]:hsl(0,50%,50%);" data-1000="padding:300px;color:hsl(360,50%,50%);">WOOOT</div>
```

And you can specify easing functions for each property using square brackets.

```html
<div data-0="padding[cubic]:0px;color:hsl(0,50%,50%);" data-1000="padding:300px;color:hsl(360,50%,50%);">WOOOT</div>
```

JavaScript
------

On the JavaScript part there's not much to do (you can, if you want to). So if you only know CSS and HTML, perfect.

All there is to do is to call ```skrollr.init([options]);```.

### options

Possible options include

#### scale=1

By default skrollr uses the largest key frame and makes document height + viewport height this high, thus the max possible scroll top offset. If your animation runs too fast or too slow, just adjust the scale value.

#### scroll

A listener function getting called each time **before** the internal state of skrollr changes because of a native scroll event. The function will be passed an object with the following properties:

```js
{
	curTop: 10, //the current scroll top offset
	lastTop: 0, //the top value of last time
	maxTop: 100, //the max value you can scroll to. curTop/maxTop will give you the current progress.
	direction: 'down' //either up or down
}
```

Returning ```false``` will prevent rendering.

**Note:** the event fires as often as the native event does, but rendering is async using requestAnimationFrame in order to guarantee smooth transitions.

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
