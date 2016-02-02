module.exports = function(grunt) {

  // require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    sass: {
      dist: {
        options: {
          sourcemap: 'none',
          style: 'compressed'
        },
        files: [{
          expand: true,
          cwd: './assets/scss',
          src: ['*.scss'],
          dest: 'public/css',
          ext: '.css'
        }]
      }
    },
    watch: {
      css: {
        files: 'assets/scss/**/*.scss',
        tasks: ['sass'],
        options: {
          livereload: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadTasks(__dirname+'/tasks/meetup')

  grunt.registerTask('sass:watch', ['watch']);
};
