'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			js: {
				files: ['*.js'],
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			},
		},
		jshint: {
			all: {
				src: ['*.js'],
				options: {
					jshintrc: true,
				}
			}
		}
	});

	// Load NPM tasks
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-env');

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	// Basic Tasks.
	grunt.registerTask('default', ['jshint', 'watch']); // Development.
};
