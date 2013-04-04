module.exports = function(grunt) {
	//Configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json') ,
		jshint: {
			options: {
				smarttabs: false
			},
			all: ['Gruntfile.js', 'test/test.js', 'src/skrollr.js', 'src/plugins/skrollr.ie.js', 'src/plugins/skrollr.menu.js', 'src/mobile/skrollr.mobile.js']
		},
		qunit: {
			all: ['test/index.html']
		},
		uglify: {
			options: {
				banner: '/*! skrollr <%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) | Alexander Prinzhorn - https://github.com/Prinzhorn/skrollr | Free to use under terms of MIT license */\n'
			},

			all: {
				files: {
					'dist/skrollr.min.js': ['src/skrollr.js'],
					'dist/skrollr.mobile.min.js': ['src/mobile/iscroll.js', 'src/mobile/skrollr.mobile.js'],
					'dist/skrollr.ie.min.js': ['src/plugins/skrollr.ie.js'],
					'dist/skrollr.menu.min.js': ['src/plugins/skrollr.menu.js']
				}
			},

			mobile: {
				options: {
					banner:
						'/*! skrollr <%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) | Alexander Prinzhorn - https://github.com/Prinzhorn/skrollr | Free to use under terms of MIT license */\n' +
						'/*! contains iScroll  */\n' +
						'/*! iScroll v4.2.4 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org Released under MIT license, http://cubiq.org/license */\n'
				},

				files: {
					'dist/skrollr.mobile.min.js': ['src/mobile/iscroll.js', 'src/mobile/skrollr.mobile.js']
				}
			}
		}
	});

	//Dependencies.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	//Tasks.
	grunt.registerTask('default', ['jshint', 'qunit', 'uglify']);
	grunt.registerTask('travis', ['jshint', 'qunit']);
};