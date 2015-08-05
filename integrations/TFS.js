define([
    'App'
], function (App) {
    'use strict';
    
    var path = require('path'),
        child_process = require('child_process'),
        fs = require('fs'),
        tfPath = getTfPath();
    
    var self = {
        getWorkspace: function () {
            return new Promise(function (resolve, reject) {
                if (!tfPath) {
                    reject('Visual Studio not found on the system! Visual Studio 2015, 2013, 2012, or 2010 is required to get changes from TFS.');
                } else {
                    resolve(getWorkspaces());
                }
            });
        },
        
        getChanges: function (workspaceName) {
            return getChangesForWorkspace(workspaceName);
        },
        
        getChangeFiles: function (workspaceName, changeRecord, localFilesOnly) {
            if (App.TEST_MODE) {
                const choices = ['test/left.js', 'test/right.js', 'test/csharp1.cs', 'test/csharp2.cs', ''];
                return Promise.all([
                    localFilesOnly ? undefined : getLocalFile(choices[(choices.length * Math.random()) | 0]),
                    getLocalFile(choices[(choices.length * Math.random()) | 0])
                ]);
            }
            return Promise.all([
                localFilesOnly ? undefined : getFileFromTfs(workspaceName, changeRecord.basePath),
                getLocalFile(changeRecord.iterationPath)
            ]);
        }
    };
    
    // Looks for an install of Visual Studio and returns the path to tf.exe if found
    function getTfPath() {
        var varsToCheck = ['VS140COMNTOOLS', 'VS120COMNTOOLS', 'VS110COMNTOOLS', 'VS100COMNTOOLS'],
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
                    resolve(parseChanges(sampleOutput));
                }, 500);
            } else {
                child_process.execFile(tfPath, ['status', `/workspace:${workspaceName}`],
                    { maxBuffer: 20*1024*1024 },
                    function (err, stdout, stderr) {
                        if (err || stderr) {
                            reject(err || stderr);
                        } else {
                            resolve(parseChanges(stdout));
                        }
                    });
            }
        });
    }
    
    // Parses file changes out of the `tf status` command output
    function parseChanges(tfOutput) {
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
        
        function flatten(fileList, node) {
            if (node.children) {
                node.children.reduce(flatten, fileList);
            } else {
                fileList.push(node);
            }
            return fileList;
        }
        
        return changes.reduce(flatten, []);
    }
    
    function getLocalFile(localPath) {
        return new Promise(function (resolve, reject) {
            function returnContents() {
                fs.readFile(localPath, function (err, data) {
                    if (err) {
                        if (err.message.startsWith('ENOENT: no such file or directory, open')) {
                            resolve(null);
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(data.toString());
                    }
                });
            }
            
            if (App.TEST_MODE) {
                setTimeout(function () {
                    returnContents();
                }, Math.random() * 3000);
            } else {
                returnContents();
            }
        });
    }
    
    // Returns change information for the given workspace
    function getFileFromTfs(workspaceName, tfsPath) {
        return new Promise(function (resolve, reject) {
            child_process.execFile(tfPath, ['view', `${tfsPath};W${workspaceName}`, '/console'],
                { maxBuffer: 1024*1024 },
                function (err, stdout, stderr) {
                    if (err || stderr) {
                        if (stderr.indexOf(': No file matches.') > -1) {
                            resolve(null);
                        } else if (err.message === "stdout maxBuffer exceeded.") {
                            resolve('*** File too large to display! ***');
                        } else {
                            reject(stderr || err);
                        }
                    } else {
                        resolve(stdout);
                    }
                });
        });
    }
    
    return self;
});