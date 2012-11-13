/*global ko, $*/
// Copyright 2012 Sune Simonsen
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO remove jQuery dependency
(function () {
    var keys = {
        escape: 27,
        up: 38,
        down: 40,
        pageUp: 33,
        pageDown: 34,
        enter: 13
    };

    function createElement(name, attributes) {
        var element = document.createElement(name);
        if (attributes) {
            for (var prop in attributes) {
                if (attributes.hasOwnProperty(prop)) {
                    element.setAttribute(prop, attributes[prop]);
                }
            }
        }
        return element;
    }

    var defaultOptions = {
        minLength: 1,
        maxItems: 8,
        separators: null,
        format: function (item) {
            return item.toString();
        }
    };

    ko.bindingHandlers.autocomplete = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            var options = ko.utils.unwrapObservable(value);
            var allBindings = allBindingsAccessor();

            var $element = $(element);
            var $window = $(window);

            var format = options.format || defaultOptions.format;
            var maxItems = options.maxItems || defaultOptions.maxItems;
            var minLength = options.minLength || defaultOptions.minLength;
            var separators = options.separators || defaultOptions.separators;
            separators = separators && new RegExp('[' + separators + ']');

            options.validate = options.validate || function (item) {
                return !!item;
            };

            function validate(text) {
                var items = text ? ko.utils.stringTrim(text).split(separators) : [];
                if (items.length === 0) {
                    return false;
                }
                for (var i = 0; i < items.length; i += 1) {
                    if (!options.validate(items[i])) {
                        return false;
                    }
                }
                return true;
            }

            options.onSelect = options.onSelect || function (item) {
                return item.toString();
            };

            var dropdown = createElement('ul', {
                'class': 'knockout-autocomplete menu',
                'data-bind': 'foreach: items, visible: visible'
            });
            var $dropdown = $(dropdown);
            dropdown.appendChild((function () {
                var li = createElement('li', {'data-bind': 'css: {selected: selected}'});
                li.appendChild(createElement('span', {'data-bind': 'text: before'}));
                li.appendChild(createElement('strong', {'data-bind': 'text: match'}));
                li.appendChild(createElement('span', {'data-bind': 'text: after'}));
                return li;
            }()));

            document.body.appendChild(dropdown);


            var query = ko.observable('');

            var suggestions = ko.computed(function () {
                var data = ko.utils.unwrapObservable(options.data);
                var queryText = (ko.utils.unwrapObservable(query) || '').toLowerCase();
                if (queryText.length < minLength) {
                    return [];
                } else {
                    var matches = ko.utils.arrayFilter(data, function (item) {
                        var label = format(item).toLowerCase();
                        var offset = label.indexOf(queryText);
                        return offset !== -1 && label !== queryText;
                    }).slice(0, maxItems);

                    var first = true;
                    return ko.utils.arrayMap(matches, function (item) {
                        var label = format(item);
                        var offset = label.toLowerCase().indexOf(queryText);
                        var suggestion = {
                            item: item,
                            before: label.substring(0, offset),
                            match: label.substring(offset, offset + queryText.length),
                            after: label.substring(offset + queryText.length),
                            selected: ko.observable(first)
                        };
                        first = false;
                        return suggestion;
                    });
                }
            });

            function findSelectedIndex() {
                var items = suggestions();
                for (var i = 0; i < items.length; i += 1) {
                    if (items[i].selected()) {
                        return i;
                    }
                }
                return -1;
            }
            function wrapIndex(index, length) {
                if (index < 0) {
                    return Math.max(0, suggestions().length - 1);
                }
                if (suggestions().length <= index) {
                    return 0;
                }
                return index;
            }

            function selectPrevious() {
                var items = suggestions();
                var i = findSelectedIndex();
                var hasSelection = i !== -1;
                if (hasSelection) {
                    items[i].selected(false);
                    items[wrapIndex(i - 1)].selected(true);
                }
                return hasSelection;
            }

            function selectNext() {
                var items = suggestions();
                var i = findSelectedIndex();
                var hasSelection = i !== -1;
                if (hasSelection) {
                    items[i].selected(false);
                    items[wrapIndex(i + 1)].selected(true);
                    return true;
                }
                return hasSelection;
            }

            function findItem(query) {
                var items = suggestions();
                for (var i = 0; i < items.length; i += 1) {
                    var item = items[i].item;
                    var label = format(item).toLowerCase();
                    if (label === query.toLowerCase()) {
                        return item;
                    }
                }
                return null;
            }

            function freeTextSelect() {
                var value = element.value;
                var texts = value ? value.split(separators) : [];
                var items = ko.utils.arrayMap(texts, function (text) {
                    return findItem(text) || text;
                });
                element.value = options.onSelect(items) || '';
                ko.utils.triggerEvent(element, 'change');
                query('');
            }

            function selectItem(item) {
                element.value = options.onSelect(separators ? [item] : item) || '';
                ko.utils.triggerEvent(element, 'change');
                query('');
            }

            function select() {
                var items = suggestions();
                var i = findSelectedIndex();
                var hasSelection = i !== -1;
                if (hasSelection) {
                    selectItem(items[i].item);
                    return true;
                } else if (separators && validate(element.value)) {
                    freeTextSelect();
                    return true;
                }
            }

            ko.utils.registerEventHandler(element, 'blur', function (e) {
                if (separators && validate(element.value)) {
                    freeTextSelect();
                }
            });

            ko.utils.registerEventHandler(element, "keydown", function (e) {
                switch (e.which) {
                case keys.up:
                    if (selectPrevious()) {
                        if (e.preventDefault) e.preventDefault();
                        return false;
                    }
                    break;
                case keys.down:
                    if (selectNext()) {
                        if (e.preventDefault) e.preventDefault();
                        return false;
                    }
                    break;
                case keys.enter:
                    if (select()) {
                        if (e.preventDefault) e.preventDefault();
                        return false;
                    }
                    break;
                }
                return true;
            });

            function positionMenu() {
                var offset = $element.offset();
                var elementHeight = $element.outerHeight();
                var elementWidth = $element.outerWidth();
                var dropdownHeight = $dropdown.outerHeight();
                var dropdownWidth = $dropdown.outerWidth();
                var top = elementHeight + offset.top;
                var left = offset.left;
                var right = left + dropdownWidth;
                var bottom = top + dropdownHeight;
                if (right > $window.width()) {
                    left = $window.width() - dropdownWidth;
                }
                if (bottom > $window.height()) {
                    top = offset.top - dropdownHeight - 5;
                }

                dropdown.style.top = top + 'px';
                dropdown.style.left = left + 'px';
            }

            ko.utils.registerEventHandler(element, "keypress", function (e) {
                if (separators && validate(element.value)) {
                    var isCharSeparator = separators.test(String.fromCharCode(e.which));
                    if (isCharSeparator) {
                        freeTextSelect();
                        if (e.preventDefault) e.preventDefault();
                        return false;
                    }
                }
                return true;
            });

            ko.utils.registerEventHandler(element, "keyup", function (e) {
                if (keys.escape === e.which) {
                    query('');
                } else {
                    var text = element.value;
                    query(text);
                }
            });

            var visible = ko.computed(function () {
                return suggestions().length > 0;
            }).extend({ throttle: 10 });

            visible.subscribe(function (value) {
                if (value) {
                    positionMenu();
                }
            });

            ko.applyBindings({
                items: suggestions,
                visible: visible
            }, dropdown);
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        }
    };
}());