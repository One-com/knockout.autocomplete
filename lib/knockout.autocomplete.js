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

    function renderSuggestion(completionItem, index) {
        var $result = $(
            '<li>' +
            '<span class="before"></span>' +
            '<strong class="match"></strong>' +
            '<span class="after"></span>' +
            '</li>'
        );

        $result.attr('data-index', index);
        $('.before', $result).text(completionItem.before);
        $('.match', $result).text(completionItem.match);
        $('.after', $result).text(completionItem.after);

        return $result;
    }

    function renderSuggestions($target, suggestions) {
        return suggestions.map(renderSuggestion);
    }

    ko.bindingHandlers.autocomplete = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            var options = unwrapObservable(value);

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

            var floatingMenu = !options.target;

            options.onSelect = options.onSelect || function (item) {
                return item.toString();
            };

            var query = ko.observable('');

            var selectedIndex = -1;

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

                    return arrayMap(matches, function (item) {
                        var label = format(item);
                        var offset = label.toLowerCase().indexOf(queryText);
                        var suggestion = {
                            item: item,
                            before: label.substring(0, offset),
                            match: label.substring(offset, offset + queryText.length),
                            after: label.substring(offset + queryText.length)
                        };
                        return suggestion;
                    });
                }
            });

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
                toIndex = wrapIndex(toIndex);
                var toElement = $dropdown.children()[toIndex];
                var hasSelection = fromIndex !== -1;
                if (hasSelection) {
                    var fromElement = $dropdown.children()[fromIndex];

                    $(fromElement).toggleClass('selected', false);
                }

                $(toElement).toggleClass('selected', true);

                selectedIndex = toIndex;

                var scrollPane = new ScrollPane($dropdown);
                scrollPane.scrollIntoView(toElement);

                return hasSelection;
            }

            function selectPrevious() {
                var i = selectedIndex;
                return moveSelection(i, i - 1);
            }

            function selectNext() {
                var i = selectedIndex;
                return moveSelection(i, i + 1);
            }

            function selectSuggestion(index) {
                return moveSelection(selectedIndex, index);
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
                var i = selectedIndex;
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
                    if ($highlightedElements) {
                        $highlightedElements.removeClass('touching');
                    }

                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }

                    return true;
                });
                $dropdown.on('touchend', 'li', function (e) {
                    setTimeout(function () {
                        if ($highlightedElements) {
                            $highlightedElements.removeClass('touching');
                            $highlightedElements = null;
                        }
                    }, 300);

                    if (moves > 1) {
                        return true;
                    }

                    var targetIndex = $(e.target).closest('li').attr('data-index');
                    var item = suggestions()[targetIndex];
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

                    var targetIndex = $(e.target).closest('li').attr('data-index');
                    var item = suggestions()[targetIndex];
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

            suggestions.subscribe(function (newValue) {
                selectedIndex = -1;
                $dropdown.empty();
                if (newValue.length) {
                    $dropdown.append(renderSuggestions($dropdown, newValue));
                    selectSuggestion(0);
                }
            });

            utils.domNodeDisposal.addDisposeCallback(element, function () {
                query('');
                $dropdown.remove();
                visibleSubscrition.dispose();
            });

        }
    };
});
