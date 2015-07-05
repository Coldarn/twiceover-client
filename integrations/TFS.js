define(function () {
    var path = require('path'),
        child_process = require('child_process'),
        fs = require('fs');
    
    // Looks for an install of Visual Studio and returns the path to tf.exe if found
    function getTfPath() {
        var varsToCheck = ['VS130COMNTOOLS', 'VS120COMNTOOLS', 'VS110COMNTOOLS', 'VS100COMNTOOLS'],
            potentialPath;
        
        for (var varName of varsToCheck) {
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
    
    var self = {
        getChanges: function (statusEl, newIteration) {
            return new Promise(function (resolve, reject) {
                var tfPath = getTfPath();

                if (!tfPath) {
                    reject('ERROR: Visual Studio not found on the system! Visual Studio 2015, 2013, 2012, or 2010 is required to get changes from TFS.');
                }

                resolve(tfPath);
            });
        }
    };
    
    return self;
});