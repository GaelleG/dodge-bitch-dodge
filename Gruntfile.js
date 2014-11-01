module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['js/vertex.js', 'js/abstract-viewport.js', 'js/server.js'],
        dest: 'js/server-complete.js',
      },
    },
    jshint: {
      all: [
        'Gruntfile.js',
        'js/vertex.js',
        'js/abstract-viewport.js',
        'js/game.js',
        'js/webgl.js',
        'js/server.js',
        'js/server-complete.js'
      ]
    },
    uglify: {
      dynamic_mappings: {
        files: [
          {
            expand: true,
            cwd: 'js/',
            src: [
              'vertex.js',
              'abstract-viewport.js',
              'game.js',
              'webgl.js',
              'server.js',
              'server-complete.js'
            ],
            dest: 'js/',
            ext: '.min.js',
            extDot: 'first'
          },
        ],
      },
    },
    watch: {
      concat: {
        files: ['js/vertex.js', 'js/abstract-viewport.js', 'js/server.js'],
        tasks: ['concat'],
        options: {
          interrupt: true,
        },
      },
      jshint: {
        files: [
          'Gruntfile.js',
          'js/vertex.js',
          'js/abstract-viewport.js',
          'js/game.js',
          'js/webgl.js',
          'js/server.js',
          'js/server-complete.js',
        ],
        tasks: ['jshint'],
        options: {
          interrupt: true,
        },
      },
      uglify: {
        files: [
          'js/vertex.js',
          'js/abstract-viewport.js',
          'js/game.js',
          'js/webgl.js',
          'js/server-complete.js',
        ],
        tasks: ['uglify'],
        options: {
          interrupt: true,
        },
      },
    }
  });
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['concat', 'jshint', 'uglify']);
};