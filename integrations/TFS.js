define([
    'App'
], function (App) {
    'use strict';
    
    var path = require('path'),
        child_process = require('child_process'),
        fs = require('fs'),
        tfPath = getTfPath();
    
    var self = {
        getChanges: function (logStatus, newIteration) {
            logStatus('Retrieving TFS workspaces...');
            return new Promise(function (resolve, reject) {
                if (!tfPath) {
                    reject('Visual Studio not found on the system! Visual Studio 2015, 2013, 2012, or 2010 is required to get changes from TFS.');
                } else {
                    resolve(getWorkspaces());
                }
            }).then(function (workspaces) {
                if (!workspaces.length) {
                    throw 'No TFS workspaces found';
                }

                logStatus('Disovering changes...');
                return Promise.all(workspaces.map(function (workspaceName) {
                    return getChangesForWorkspace(workspaceName);
                }));
            }).then(function (values) {
                values.sort(function (left, right) {
                    return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
                });
                return values;
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
    function getWorkspaces() {
        return new Promise(function (resolve, reject) {
            if (App.TEST_MODE) {
                setTimeout(function () {
                    var sampleOutput = fs.readFileSync('test/tf-workspaces.txt').toString();
                    resolve(parseWorkspaces(sampleOutput));
                }, 500);
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
                    workspaceNames.push(line.substring(0, nameEndIndex).trim());
                }
            }
        }
        return workspaceNames;
    }
    
    // Returns change information for the given workspace
    function getChangesForWorkspace(workspaceName) {
        return new Promise(function (resolve, reject) {
            if (App.TEST_MODE) {
                setTimeout(function () {
                    var sampleOutput = fs.readFileSync('test/tf-changes.txt').toString();
                    resolve(parseChanges(sampleOutput, workspaceName));
                }, 500);
            } else {
                var ls = child_process.execFile(tfPath, ['status', `/workspace:${workspaceName}`], function (err, stdout, stderr) {
                    if (err || stderr) {
                        reject(err || stderr);
                    } else {
                        resolve(parseChanges(stdout, workspaceName));
                    }
                });
            }
        });
    }
    
    // Parses file changes out of the `tf status` command output
    function parseChanges(tfOutput, workspaceName) {
        var changes = [],
            nameEndIndex,
            pathStartIndex,
            activeNode;
        
        for (const line of tfOutput.replace(/\r\n/g, '\n').split('\n')) {
            if (line.startsWith('---')) {
                if (!nameEndIndex) {
                    nameEndIndex = line.indexOf('- -') + 1;
                    pathStartIndex = line.lastIndexOf('- -') + 2;
                }
            } else if (line) {
                if (line.startsWith('$/')) {
                    changes.push(activeNode = {
                        name: line.trim(),
                        children: []
                    });
                } else {
                    if (line.startsWith('File name') || line.startsWith('Detected Changes:') || /\d+ change\(s\),/.test(line)) {
                        continue;
                    }
                    
                    const name = line.substring(0, nameEndIndex).trim(),
                          tfsPath = `${activeNode.name}/${name}`;
                    
                    if (!name) {
                        continue;
                    }
                        
                    activeNode.children.push({
                        name: name,
                        basePath: tfsPath,
                        iterationPath: line.substring(pathStartIndex),
                        displayPath: tfsPath
                    });
                }
            }
        }
        
        return {
            name: workspaceName,
            children: changes
        };
    }
    
    return self;
});