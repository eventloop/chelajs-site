module.exports = function(grunt) {
  grunt.initConfig({
    stylus: {
      dev: {
        files: {
          'public/css/main.css': 'public/stylus/main.styl',
          'public/css/admin.css': 'public/stylus/admin.styl',
        }
      }
    },
    watch: {
      options: {
        livereload: true
      },
      stylus: {
        files: ['public/stylus/**/*.styl'],
        tasks: ['stylus:dev']
      }
    }
  })
  grunt.loadNpmTasks('grunt-contrib-stylus')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('styles', ['stylus:dev', 'watch'])
}