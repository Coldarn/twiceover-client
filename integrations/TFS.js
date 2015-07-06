define([
    'App'
], function (App) {
    'use strict';
    
    var path = require('path'),
        child_process = require('child_process'),
        fs = require('fs');
    
    var self = {
        getChanges: function (logStatus, newIteration) {
            return new Promise(function (resolve, reject) {
                var tfPath = getTfPath();

                if (!tfPath) {
                    reject('Visual Studio not found on the system! Visual Studio 2015, 2013, 2012, or 2010 is required to get changes from TFS.');
                }
                
                logStatus('Disovering TFS workspaces...');

                getWorkspaces(tfPath).then(function (workspaces) {
                    if (!workspaces.length) {
                        resolve('No changes detected');
                        return;
                    }
                    
                    resolve(workspaces.join('<br/>'));
                }, reject);
            });
        }
    };
    
    // Looks for an install of Visual Studio and returns the path to tf.exe if found
    function getTfPath() {
        var varsToCheck = ['VS130COMNTOOLS', 'VS120COMNTOOLS', 'VS110COMNTOOLS', 'VS100COMNTOOLS'],
            potentialPath;
        
        for (const varName of varsToCheck) {
            if (process.env[varName]) {
                potentialPath = path.normalize(process.env[varName] + '../IDE/tf.exe');
                try {
                    if (fs.statSync(potentialPath).isFile()) {
                        return potentialPath;
                    }
                } catch(e) { }
            }
        }
    }
    
    // Retrieves the list of active workspaces from TFS that we need to grab file diffs
    function getWorkspaces(tfPath) {
        return new Promise(function (resolve, reject) {
            if (App.TEST_MODE) {
                setTimeout(function () {
                    var sampleOutput = fs.readFileSync('test/tf-workspaces.txt').toString();
                    resolve(parseWorkspaces(sampleOutput));
                }, 1000);
            } else {
                var ls = child_process.execFile(tfPath, ['workspaces'], function (err, stdout, stderr) {
                    if (err || stderr) {
                        reject(err || stderr);
                    } else {
                        resolve(parseWorkspaces(stdout));
                    }
                });
            }
        });
    }
    
    // Parses TFS workspace names out of the `tf workspaces` command output
    function parseWorkspaces(tfOutput) {
        var workspaceNames = [],
            nameEndIndex;
        
        for (const line of tfOutput.replace('\r\n', '\n').split('\n')) {
            if (!nameEndIndex) {
                if (line.startsWith('---')) {
                    nameEndIndex = line.indexOf('- -') + 1;
                }
            } else {
                if (line) {
                    workspaceNames.push(line.substring(0, nameEndIndex));
                }
            }
        }
        return workspaceNames;
    }
    
    return self;
});