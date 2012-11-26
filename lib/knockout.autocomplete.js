/*global ko, $*/
// Copyright 2012 Sune Simonsen
// https://github.com/sunesimonsen/knockout.autocomplete
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
(function (document, window, ko) {
    var utils = ko.utils;
    var registerEventHandler = utils.registerEventHandler;
    var triggerEvent = utils.triggerEvent;
    var unwrapObservable = utils.unwrapObservable;
    var arrayMap = utils.arrayMap;

    var keys = {
        escape: 27,
        up: 38,
        down: 40,
        pageUp: 33,
        pageDown: 34,
        enter: 13
    };

    var defaultOptions = {
        minLength: 1,
        maxItems: 8,
        separators: null,
        format: function (item) {
            return item.toString();
        }
    };

    function createDropdownElement() {
        if (!this.dropdown) {
            var template = ko.utils.parseHtmlFragment(
                '<div>' +
                    '<li data-bind="click: $parent.select, css: { selected: selected }">' +
                    '<span data-bind="text: before"></span>' +
                    '<strong data-bind="text: match"></strong>' +
                    '<span data-bind="text: after"></span>' +
                    '</li>' +
                '</div>')[0];
            this.dropdown = ko.utils.parseHtmlFragment('<ul class="knockout-autocomplete menu" style="display:none"></ul>')[0];
            new ko.templateSources.anonymousTemplate(this.dropdown).nodes(template);
            document.body.appendChild(this.dropdown);
        }

        return this.dropdown;
    }

    ko.bindingHandlers.autocomplete = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            var options = unwrapObservable(value);
            var allBindings = allBindingsAccessor();

            var $element = $(element);
            var $window = $(window);

            var dropdown = createDropdownElement();
            var $dropdown = $(dropdown);

            var format = options.format || defaultOptions.format;
            var maxItems = options.maxItems || defaultOptions.maxItems;
            var minLength = options.minLength || defaultOptions.minLength;
            var separators = options.separators || defaultOptions.separators;
            separators = separators && new RegExp('[' + separators + ']');

            options.onSelect = options.onSelect || function (item) {
                return item.toString();
            };

            var query = ko.observable('');

            var suggestions = ko.computed(function () {
                var data = unwrapObservable(options.data);
                var queryText = (unwrapObservable(query) || '').toLowerCase();
                if (queryText.length < minLength) {
                    return [];
                } else {
                    var matches = utils.arrayFilter(data, function (item) {
                        var label = format(item).toLowerCase();
                        var offset = label.indexOf(queryText);
                        return offset !== -1 && label !== queryText;
                    }).slice(0, maxItems);

                    var first = true;
                    return arrayMap(matches, function (item) {
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

            function moveSelection(fromIndex, toIndex) {
                var items = suggestions();
                var hasSelection = fromIndex !== -1;
                if (hasSelection) {
                    items[fromIndex].selected(false);
                    items[wrapIndex(toIndex)].selected(true);
                }
                return hasSelection;
            }

            function selectPrevious() {
                var i = findSelectedIndex();
                return moveSelection(i, i - 1);
            }

            function selectNext() {
                var i = findSelectedIndex();
                return moveSelection(i, i + 1);
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
                var items = arrayMap(texts, function (text) {
                    return findItem(text) || text;
                });
                element.value = options.onSelect(items) || '';
                triggerEvent(element, 'change');
                query('');
            }

            function selectItem(item) {
                element.value = options.onSelect(separators ? [item] : item) || '';
                triggerEvent(element, 'change');
                query('');
            }

            function select() {
                var items = suggestions();
                var i = findSelectedIndex();
                var hasSelection = i !== -1;
                if (hasSelection) {
                    selectItem(items[i].item);
                    return true;
                } else if (separators) {
                    freeTextSelect();
                    return true;
                }
            }

            function preventDefault(event) {
                if (event.preventDefault) event.preventDefault();
                return false;
            }

            registerEventHandler(element, 'blur', function (e) {
                setTimeout(function () {
                    query('');
                }, 100);
            });

            registerEventHandler(element, "keydown", function (e) {
                switch (e.which) {
                case keys.up:
                    if (selectPrevious()) {
                        return preventDefault(e);
                    }
                    break;
                case keys.down:
                    if (selectNext()) {
                        return preventDefault(e);
                    }
                    break;
                case keys.enter:
                    if (select()) {
                        return preventDefault(e);
                    }
                    break;
                case keys.escape:
                    query('');
                    return preventDefault(e);
                }
                return true;
            });

            registerEventHandler(element, "keypress", function (e) {
                if (separators) {
                    var isCharSeparator = separators.test(String.fromCharCode(e.which));
                    if (isCharSeparator) {
                        freeTextSelect();
                        return preventDefault(e);
                    }
                }
                return true;
            });

            registerEventHandler(element, "keyup", function (e) {
                if (e.which !== keys.escape) {
                    var text = element.value;
                    query(text);
                }
            });

            var visible = ko.computed(function () {
                return suggestions().length > 0;
            }).extend({throttle: 1});

            var visibleSubscrition = visible.subscribe(function (value) {
                if (value) {
                    positionMenu();
                }
                ko.bindingHandlers.visible.update(dropdown, visible);
            });

            var menuViewModel = {
                select: function (item) {
                    selectItem(item.item);
                    element.focus();
                }
            };

            function positionMenu() {
                var offset = $element.offset();
                var dropdownHeight = $dropdown.outerHeight();
                var dropdownWidth = $dropdown.outerWidth();
                var top = $element.outerHeight() + offset.top;
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

            var templateOptions = {
                templateEngine: ko.nativeTemplateEngine.instance
            };
            ko.renderTemplateForEach(dropdown, suggestions, { }, dropdown, bindingContext.createChildContext(menuViewModel));

            utils.domNodeDisposal.addDisposeCallback(element, function () {
                visibleSubscrition.dispose();
            });

        }
    };
}(document, window, ko));

