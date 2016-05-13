require.config({
	baseUrl: "../dist",
	paths: {
		'skrollr' : "skrollr.min"
	},
	waitSeconds: 15
});

require(['skrollr'], function(skrollr){
	var s = skrollr.init({
		edgeStrategy: 'set',
		easing: {
			WTF: Math.random,
			inverted: function(p) {
				return 1-p;
			}
		}
	});
});