define(function () {
    return {
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
        }
    };
});
