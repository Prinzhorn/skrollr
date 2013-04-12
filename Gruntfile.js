module.exports = function(grunt) {
	//Configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json') ,
		jshint: {
			options: {
				smarttabs: false,
				curly: true,
				immed: true,
				latedef: true,
				noarg: true,
				quotmark: 'single',
				undef: true,
				unused: true,
				strict: true,
				trailing: true,
				globals: {
					window: true,
					document: true,
					navigator: true
				}
			},
			all: ['src/**/*.js']
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
					'dist/skrollr.ie.min.js': ['src/plugins/skrollr.ie.js'],
					'dist/skrollr.menu.min.js': ['src/plugins/skrollr.menu.js']
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