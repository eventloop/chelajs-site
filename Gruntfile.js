module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    sass: {
      dest: 'public/css/',
      options: {
        sourceMap: false
      }
    }
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
  grunt.loadTasks('./tasks');
  grunt.loadTasks('./tasks/meetup');

  grunt.registerTask('styles', ['watch']);
};
