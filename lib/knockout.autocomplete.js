/*global ko, jQuery, define, document, window*/
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

(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(["knockout", "jquery"], factory);
    } else {
        // <script> tag: use the global `ko` and `jQuery`
        factory(ko, jQuery);
    }
})(function (ko, $) {
    // Safari mobile detection
    var ua = navigator.userAgent;
    var safari = /safari/i.test(ua);
    var iphone = /\(iphone;/i.test(ua);
    var ipad = /\(ipad;/i.test(ua);
    var mobileSafari = safari && (ipad  || iphone);

    var utils = ko.utils;
    var triggerEvent = utils.triggerEvent;
    var unwrapObservable = utils.unwrapObservable;
    var arrayMap = utils.arrayMap;
    var arrayFilter = utils.arrayFilter;

    var keys = {
        escape: 27,
        up: 38,
        down: 40,
        pageUp: 33,
        pageDown: 34,
        enter: 13,
        tab: 9
    };

    var defaultOptions = {
        minLength: 1,
        maxItems: 8,
        separators: null,
        format: function (item) {
            return item.toString();
        }
    };

    function ScrollPane(container) {
        this.container = $(container);
    }

    function top(element) {
        return $(element).offset().top;
    }

    function bottom(element) {
        return top(element) + $(element).outerHeight();
    }

    ScrollPane.prototype.alignWithTop = function (element) {
        this.container.scrollTop(this.container.scrollTop() +
                                 top(element) -
                                 top(this.container));
    };

    ScrollPane.prototype.alignWithBottom = function (element) {
        this.container.scrollTop(this.container.scrollTop() +
                                 bottom(element) -
                                 bottom(this.container));
    };

    ScrollPane.prototype.isAboveScrollArea = function (element) {
        return top(element) < top(this.container);
    };

    ScrollPane.prototype.isBelowScrollArea = function (element) {
        return bottom(element) > bottom(this.container);
    };

    ScrollPane.prototype.scrollIntoView = function (element) {
        if (this.isAboveScrollArea(element)) {
            this.alignWithTop(element);
        } else if (this.isBelowScrollArea(element)) {
            this.alignWithBottom(element);
        }
    };

    var templateElement = document.createElement('div');
    var template = ko.utils.parseHtmlFragment(
        '<div>' +
            '<li data-bind="css: { selected: selected }">' +
            '<span data-bind="text: before"></span>' +
            '<strong data-bind="text: match"></strong>' +
            '<span data-bind="text: after"></span>' +
            '</li>' +
        '</div>')[0];
    new ko.templateSources.anonymousTemplate(templateElement).nodes(template);

    ko.bindingHandlers.autocomplete = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            var options = unwrapObservable(value);
            var allBindings = allBindingsAccessor();

            var $element = $(element);
            var $window = $(window);

            var $dropdown = $('<ul class="knockout-autocomplete menu scrollable"></ul>');
            var $container;
            if (options.target) {
                $container = $('#' + options.target);
                $dropdown.appendTo($container);
            } else {
                $container = $dropdown;
                $dropdown.appendTo('body');
            }
            $container.hide();
            $dropdown.hide();

            var format = options.format || defaultOptions.format;
            var maxItems = options.maxItems || defaultOptions.maxItems;
            var minLength = options.minLength || defaultOptions.minLength;
            var separators = options.separators || defaultOptions.separators;
            separators = separators && new RegExp('[' + separators + ']');

            var floatingMenu = $dropdown.css('position') === 'fixed';

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
                        return offset !== -1;
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
                    toIndex = wrapIndex(toIndex);
                    items[fromIndex].selected(false);
                    items[toIndex].selected(true);

                    var scrollPane = new ScrollPane($dropdown);
                    scrollPane.scrollIntoView($dropdown.children()[toIndex]);
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

            function clearQuery() {
                query('');
            }

            function freeTextSelect() {
                var value = element.value;
                var texts = value ? value.split(separators) : [];
                texts = arrayMap(texts, function (text) {
                    return text.trim();
                });
                texts = arrayFilter(texts, function (text) {
                    return text.length > 0;
                });
                element.value = options.onSelect(texts) || '';
                triggerEvent(element, 'change');
                clearQuery();
            }

            function selectItem(item) {
                element.value = options.onSelect(separators ? [item] : item) || '';
                triggerEvent(element, 'change');
                clearQuery();
                setTimeout(function () {
                    element.scrollIntoView(false);
                }, 1);
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

            function preventDefault(e) {
                if (e.preventDefault) e.preventDefault();
                return false;
            }

            $element.on("paste", function (e) {
                if (window.clipboardData) {
                    // IE
                    var clipped = window.clipboardData.getData('Text');
                    clipped = clipped.replace(/(\r\n|\n|\r)/gm, " "); //replace newlines with spaces
                    $(this).val(clipped);
                    return false; //cancel the pasting event
                }
            });

            $element.on("keydown", function (e) {
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
                case keys.tab:
                    select();
                    break;
                case keys.escape:
                    query('');
                    return preventDefault(e);
                }
                return true;
            });

            $element.on("keyup", function (e) {
                if (separators && separators.test(element.value)) {
                    freeTextSelect();
                    return;
                }

                if (e.which !== keys.escape && e.which !== keys.enter) {
                    var text = element.value;
                    query(text);
                }
            });

            var visible = ko.computed(function () {
                return suggestions().length > 0;
            });

            var visibleSubscrition = visible.subscribe(function (value) {
                if (value) {
                    setTimeout(function () {
                        $dropdown.show();
                        $container.show();
                        if (floatingMenu) {
                            positionMenu();
                        }
                    }, 1);
                } else {
                    $container.hide();
                    $dropdown.hide();
                }
            });

            $element.on('blur.autocomplete', function (e) {
                if (query() !== '') {
                    clearQuery();
                    setTimeout(function () {
                        $(':focus').first().each(function (i, el) {
                            el.scrollIntoView(false);
                        });
                    }, 10);
                }
            });

            var touchSupport = 'ontouchstart' in document.documentElement;
            if (touchSupport) {
                var $highlightedElements;
                var moves;
                $dropdown.on('mousedown', false);
                $dropdown.on('touchstart', 'li', function (e) {
                    moves = 0;
                    var $target = $(e.target);
                    $highlightedElements = $target.closest('li');
                    $('li', $dropdown).removeClass('touching');
                    setTimeout(function () {
                        if ($highlightedElements) {
                            $highlightedElements.addClass('touching');
                        }
                    }, 50);
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    return true;
                });
                $dropdown.on('touchmove', 'li', function (e) {
                    moves += 1;
                    $highlightedElements.removeClass('touching');

                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }

                    return true;
                });
                $dropdown.on('touchend', 'li', function (e) {
                    setTimeout(function () {
                        $highlightedElements.removeClass('touching');
                        $highlightedElements = null;
                    }, 300);

                    if (moves > 1) {
                        return true;
                    }

                    var item = ko.dataFor(e.target);
                    selectItem(item.item);

                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }

                    return preventDefault(e);
                });
            } else {
                $dropdown.on('mousedown', 'li', function (e) {
                    if (e.type === 'mousedown' && e.which !== 1) {
                        return false;
                    }

                    var item = ko.dataFor(e.target);
                    selectItem(item.item);
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    return preventDefault(e);
                });
            }

            function positionMenu() {
                var offset = $element.offset();
                var elementHeight = $element.outerHeight();
                var elementBottom = offset.top + elementHeight;

                var windowHeight = $window.height();
                var spaceAbove = offset.top;
                var spaceBelow = windowHeight - elementBottom;

                $dropdown.css('bottom', 'auto');
                var dropdownHeight = $dropdown.outerHeight();
                var dropdownWidth = $dropdown.outerWidth();
                var top = elementHeight + offset.top;
                var left = offset.left;
                var right = left + dropdownWidth;
                var bottom = null;

                if ((mobileSafari && spaceBelow < 600) || spaceAbove > spaceBelow) {
                    // Place above
                    top = offset.top - dropdownHeight - 5;
                }

                if (right > $window.width()) {
                    left = $window.width() - dropdownWidth;
                }

                // Constrain the menu to the viewport
                if (top < document.body.scrollTop) {
                    // constrained by bottom
                    top = document.body.scrollTop;
                    bottom = $window.height() - (offset.top - 5);
                }

                if (top + dropdownHeight > windowHeight) {
                    // constrained by bottom
                    bottom = 0;
                }

                $dropdown.css('top', top + 'px');
                $dropdown.css('left', left + 'px');
                if (bottom !== null) {
                    $dropdown.css('overflow', 'auto');
                    $dropdown.css('bottom', bottom + 'px');
                }
            }

            var templateOptions = {
                templateEngine: ko.nativeTemplateEngine.instance
            };

            ko.renderTemplateForEach(templateElement, suggestions, { }, $dropdown[0], bindingContext);

            utils.domNodeDisposal.addDisposeCallback(element, function () {
                query('');
                $dropdown.remove();
                visibleSubscrition.dispose();
            });

        }
    };
});
