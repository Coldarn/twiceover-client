var path = require('path');

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: [
            'build',
            'install'
        ],
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'node_modules/electron-prebuilt/dist/',
                    src: ['**'],
                    dest: 'build/',
                    rename: function(dest, matchedSrcPath, options) {
                        var elecBinaryIndex = matchedSrcPath.lastIndexOf('electron.exe');
                        if (elecBinaryIndex >= 0) {
                            return path.join(dest, matchedSrcPath.substring(0, elecBinaryIndex) + 'TwiceOver.exe');
                        }
                        return path.join(dest, matchedSrcPath);
                    }
                }, {
                    expand: true,
                    src: [
                        'main.js',
                        'package.json',
                        'app/**'
                    ],
                    dest: 'build/resources/app'
                }, {
                    expand: true,
                    src: ['server-url.dat'],
                    dest: 'build/'
                }]
            }
        },
        'create-windows-installer': {
            x64: {
                appDirectory: 'build',
                outputDirectory: 'install/64',
                exe: 'TwiceOver.exe'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-electron-installer');

    // Default task(s).
    grunt.registerTask('default', ['clean', 'copy', 'create-windows-installer']);
};