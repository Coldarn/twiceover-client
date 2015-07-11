define(function () {
    'use strict';
    
    const Util = {
        union: function (left, right) {
            var merged = left.slice(),
                rightKeys = right.reduce(function (map, entry) {
                    map[entry] = true;
                    return map;
                }, {});

            left.forEach(function (entry) {
                delete rightKeys[entry];
            });

            merged.push.apply(merged, Object.keys(rightKeys));
            merged.sort();
            return merged;
        },
        
        toArray: function (obj) {
            return Array.prototype.slice.call(obj);
        },
        
        find: function (array, checkCallback) {
            for (let i in array) {
                if (checkCallback(array[i])) {
                    return array[i];
                }
            }
        },
        
        collapseCommonPaths: function (filePaths) {
            const root = [];
            
            filePaths.forEach(function (file) {
                file.parsedPath = file.iterationPath.replace(/\\/g, '/').split('/');
            });
            
            filePaths.forEach(function (file) {
                let parentList = root;
                file.parsedPath.forEach(function (chunk, i) {
                    let node = Util.find(parentList, function (n) { return n.name === chunk; });
                    if (!node) {
                        if (i < file.parsedPath.length - 1) {
                            parentList.push({
                                name: chunk,
                                children: parentList = []
                            });
                        } else {
                            parentList.push(file);
                        }
                    } else {
                        parentList = node.children;
                    }
                });
            });
            
            let nodeList = root.slice();
            while (nodeList.length) {
                const node = nodeList.shift();
                if (node.children && node.children.length === 1 && node.children[0].children) {
                    const child = node.children[0];
                    node.name = `${node.name}/${child.name}`; 
                    node.children = child.children;
                    nodeList.push(node);
                } else {
                    nodeList.push.apply(nodeList, node.children);
                }
            }
            
            return root;
        }
    };
    
    return Util;
});
