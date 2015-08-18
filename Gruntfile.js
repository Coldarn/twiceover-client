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
                        'server.json',
                        'install.reg',
                        'uninstall.reg',
                        'bin/**',
                        'test/**',
                        'app/**'
                    ],
                    dest: 'build/resources/app'
                }]
            }
        },
        'create-windows-installer': {
            x64: {
                appDirectory: 'build',
                outputDirectory: 'install/64',
                iconUrl: 'https://raw.githubusercontent.com/Coldarn/twiceover-client/master/media/favicon.ico',
                setupIcon: 'media/favicon.ico',
                exe: 'TwiceOver.exe'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-electron-installer');
    
    grunt.registerTask('exemeta', 'Replace electron.exe metadata', function () {
        var version = grunt.file.readJSON('package.json').version;
        require('child_process').execFileSync('node_modules/rcedit/bin/rcedit.exe', [
            'build/TwiceOver.exe',
            '--set-icon', 'media/favicon.ico',
            '--set-file-version', version,
            '--set-product-version', version,
            '--set-version-string', 'FileDescription', 'Twice-Over',
            '--set-version-string', 'OriginalFilename', 'TwiceOver.exe',
            '--set-version-string', 'ProductName', 'Twice-Over Client',
            '--set-version-string', 'LegalCopyright', 'Copyright (C) 2015 Collin Arnold. All rights reserved.'
        ]);
    });
    
    grunt.registerTask('build', ['clean', 'copy', 'exemeta']);
    grunt.registerTask('default', ['build', 'create-windows-installer']);
};