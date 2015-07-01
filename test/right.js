                // Opens the given combo dropdown and clicks the item with the given text
                function clickCombo(comboComp, itemText, description) {
                    return function (next) {
                        t.chain({
                            click: comboComp,
                            desc: description
                        }, function () {
                            // Combo boundlist items aren't components and don't have useful attributes on them, we have to scan through
                            // every item and look for the one with the expected text content
                            var items = Array.prototype.slice.call(comboComp.getPicker().el.dom.querySelectorAll('.x-boundlist'))
                                .filter(function (item) {
                                    return item.innerText === itemText;
                                });
                            if (items.length !== 1) {
                                t.fail('Failed to find item "' + itemText + '" in the combo box!');
                            }
                            t.click(items[0], next);
							
							console.log('foooo!');
                        });
                    };
                }