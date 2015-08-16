define(function () {
    'use strict';
    
    const htmlEscapeEl = document.createElement('div');
    const textEscapeEl = document.createTextNode('');
    
    const b58alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    const base58 = b58alphabet.length;
    
    const highResTimeBase = Date.now() - performance.now();
    
    htmlEscapeEl.appendChild(textEscapeEl);
    
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
        
        isElement: function (el) {
            return el.nodeType === 1 && typeof el.nodeName === "string";
        },
        
        find: function (array, checkFn) {
            for (let i in array) {
                if (checkFn(array[i])) {
                    return array[i];
                }
            }
        },
        
        findIndex: function (array, checkFn) {
            for (let i in array) {
                if (checkFn(array[i])) {
                    return i;
                }
            }
            return -1;
        },
        
        // Uses a bisect search algorithm to find a record in a sorted array.
        // compareFn must return negative or positive integers indicating search direction.
        bisectSearch: function (array, compareFn) {
            let leftIndex = 0;
            let rightIndex = array.length - 1;
            
            if (rightIndex - leftIndex < 0) {
                return -1;
            }
            
            do {
                const checkIndex = Math.ceil((rightIndex + leftIndex) / 2);
                const comparison = compareFn(array[checkIndex]);
                if (comparison > 0) {
                    leftIndex = checkIndex + 1;
                } else if (comparison < 0) {
                    rightIndex = checkIndex - 1;
                } else {
                    return checkIndex;
                }
            } while (rightIndex >= leftIndex);
            
            return -1;
        },
        
        countLines: function (str) {
            let count = -1,
                lastIndex = -1;
            do {
                count += 1
                lastIndex = str.indexOf('\n', lastIndex + 1);
            } while (lastIndex >= 0);
            return count;
        },
        
        zpad: function (num, digits) {
            const numStr = String(num);
            if (numStr.length >= digits) {
                return numStr;
            }
            return ('0'.repeat(digits - 1) + numStr).slice(-digits);
        },
        
        escapeHtml: function (html) {
            textEscapeEl.nodeValue = html;
            return htmlEscapeEl.innerHTML;
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
        },
        
        // Returns a base58-encoded UUID (to save space/bandwidth)
        randomID: function () {
            var encoded = new Array(22);
            for (var i = encoded.length; i >= 0; i--) {
                encoded[i] = b58alphabet[Math.random() * base58 | 0];
            }
            return encoded.join('');
        },
        
        highResTime: function () {
            return highResTimeBase + performance.now();
        }
    };
    
    return Util;
});
