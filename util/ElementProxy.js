define([
    'util/Util'
], function (Util) {
    'use strict';

    const proto = {
        __proto__: Array.prototype,

        on: function (eventName, handler, allowNoElements) {
            this.throwIfNoElements(allowNoElements);
            this.forEach(function (el) {
                el.addEventListener(eventName, handler);
            });
            return this;
        },

        setVisible: function (visible) {
            this.throwIfNoElements();
            this.forEach(function (el) {
                el.style.display = visible ? null : 'none';
            });
            return this;
        },

        setClass: function (name, add) {
            this.forEach(function (el) {
                el.classList.toggle(name, add);
            });
            return this;
        },

        setAttribute: function (name, value) {
            this.forEach(function (el) {
                if (value === null) {
                    el.removeAttribute(name);
                } else {
                    el.setAttribute(name, value);
                }
            });
            return this;
        },

        remove: function () {
            this.forEach(function (el) {
                el.remove();
            });
            return this;
        },

        first: function () {
            return ElementProxy(this[0]);
        },

        query: function (selector) {
            this.throwIfNotSingleElement();
            return ElementProxy(this[0].querySelector(selector));
        },

        queryAll: function (selector) {
            this.throwIfNotSingleElement();
            return ElementProxy(this[0].querySelectorAll(selector || '*'));
        },



        throwIfNotSingleElement: function () {
            if (this.length !== 1) {
                throw new Error('Expected a single element!');
            }
        },

        throwIfNoElements: function (allowNoElements) {
            if (this.length < 1 && !allowNoElements) {
                throw new Error('Expected at least one element!');
            }
        }
    };

    function ElementProxy(nodeList) {
        const obj = Object.create(proto);
        if (typeof nodeList.length === 'number') {
            obj.push.apply(obj, nodeList);
        } else {
            obj.push(nodeList);
        }
        return obj;
    };

    return ElementProxy;
});
