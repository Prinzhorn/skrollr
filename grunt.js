module.exports = function(grunt) {

	//Project configuration.
	grunt.initConfig({
		lint: {
			all: ['src/skrollr.js', 'src/plugins/skrollr.ie.js', 'src/mobile/skrollr.mobile.js']
		},
		qunit: {
			index: ['test/index.html']
		},
		min: {
			core: {
				src: ['src/skrollr.js'],
				dest: 'dist/skrollr.min.js'
			},
			mobile: {
				src: ['src/mobile/iscroll.js', 'src/mobile/skrollr.mobile.js'],
				dest: 'dist/skrollr.mobile.min.js'
			},
			ie: {
				src: ['src/plugins/skrollr.ie.js'],
				dest: 'dist/skrollr.ie.min.js'
			}
		},
		//We're using concat to add the banner comments
		concat: {
			core: {
				src: ['src/banner/skrollr.txt', 'dist/skrollr.min.js'],
				dest: 'dist/skrollr.min.js'
			},
			mobile: {
				src: ['src/banner/mobile.txt', 'dist/skrollr.mobile.min.js'],
				dest: 'dist/skrollr.mobile.min.js'
			},
			ie: {
				src: ['src/banner/skrollr.txt', 'dist/skrollr.ie.min.js'],
				dest: 'dist/skrollr.ie.min.js'
			}
		},
		jshint: {
			options: {
				smarttabs: true
			}
		}
	});

	//Default task.
	grunt.registerTask('default', 'lint qunit min concat');

	grunt.registerTask('travis', 'lint qunit');
};
