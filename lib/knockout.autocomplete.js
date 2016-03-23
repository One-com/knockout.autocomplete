/*global ko, jQuery, define, document, window*/
// Copyright 2012 Sune Simonsen
// https://github.com/One-com/knockout.autocomplete
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

    ko.bindingHandlers.autocomplete = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            var options = unwrapObservable(value);

            var subscriptions = [];

            var $element = $(element);
            var $window = $(window);

            var $dropdown = $('<ul class="knockout-autocomplete menu scrollable popup-container"></ul>');
            if (options.className) {
                $dropdown.addClass(options.className);
            }
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

            ko.utils.domData.set($dropdown[0], 'anchor', {
                $element: $element,
                $popupHolder: $dropdown
            });

            var format = options.format || defaultOptions.format;
            var maxItems = options.maxItems || defaultOptions.maxItems;
            var minLength = typeof options.minLength === 'number' ? options.minLength : defaultOptions.minLength;
            var separators = options.separators || defaultOptions.separators;
            separators = separators && new RegExp('[' + separators + ']');

            var floatingMenu = !options.target;
            $dropdown.toggleClass('floating-menu', floatingMenu);

            options.onSelect = options.onSelect || function (item) {
                return item.toString();
            };

            function fireOnSelect() {
                var newValue = options.onSelect.apply(null, arguments) || '';
                element.value = newValue;
                triggerEvent(element, 'change');
                query(newValue);
                menuShown(false);
            }

            var query = ko.isObservable(options.query) ? options.query : ko.observable('');

            var selectedIndex = -1;

            var suggestions = ko.computed(function () {
                var data = unwrapObservable(options.data);
                var queryText = (unwrapObservable(query) || '').trim().toLowerCase();
                if (queryText.length < minLength) {
                    return [];
                } else {
                    var matches;
                    if (options.noFilter) {
                        matches = data;
                    } else {
                        matches = utils.arrayFilter(data, function (item) {
                            var label = format(item).toLowerCase();
                            var offset = label.indexOf(queryText);
                            return offset !== -1;
                        }).slice(0, maxItems);
                    }
                    return arrayMap(matches, function (item) {
                        var label = format(item);
                        var suggestion = {
                            item: item,
                            query: queryText,
                            label: label
                        };
                        return suggestion;
                    });
                }
            });
            subscriptions.push(suggestions);

            var renderSuggestion = typeof options.renderSuggestion === 'function' ?
                function (completionItem, index) {
                    var $result = $('<li>').append(options.renderSuggestion(completionItem));
                    $result.attr('data-index', index);
                    return $result;
                } :
                function (completionItem, index) {
                var offset = completionItem.label.toLowerCase().indexOf(completionItem.query);
                var before = completionItem.label.substring(0, offset);
                var match = completionItem.label.substring(offset, offset + completionItem.query.length);
                var after = completionItem.label.substring(offset + completionItem.query.length);
                var $result = $(
                    '<li>' +
                    '<span class="before"></span>' +
                    '<strong class="match"></strong>' +
                    '<span class="after"></span>' +
                    '</li>'
                );

                $result.attr('data-index', index);
                $('.before', $result).text(before);
                $('.match', $result).text(match);
                $('.after', $result).text(after);

                return $result;
            };

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
                if (!menuShown()) {
                    menuShown(true);
                    if (selectedIndex === 0) {
                        moveSelection(selectedIndex, suggestions().length - 1);
                    }
                } else if (selectedIndex !== -1) {
                    var i = selectedIndex;
                    moveSelection(i, i - 1);
                }
                return false;
            }

            function selectNext() {
                if (!menuShown()) {
                    menuShown(true);
                } else if (selectedIndex !== -1) {
                    var i = selectedIndex;
                    return moveSelection(i, i + 1);
                }

                return false;
            }

            function selectSuggestion(index) {
                return moveSelection(selectedIndex, index);
            }

            function renderSuggestions($target, suggestions) {
                return suggestions.map(renderSuggestion);
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
                fireOnSelect(texts, justPasted);
            }

            function selectItem(item) {
                fireOnSelect(separators ? [item] : item);
                if (options.target) {
                    setTimeout(function () {
                        element.scrollIntoView(false);
                    }, 1);
                }
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
                if (e.preventDefault) { e.preventDefault(); }
                return false;
            }

            var justPasted = false;
            $element.on("paste", function (e) {
                if (window.clipboardData) {
                    // IE
                    var clipped = window.clipboardData.getData('Text');
                    clipped = clipped.replace(/(\r\n|\n|\r)/gm, " "); //replace newlines with spaces
                    $(this).val(clipped);
                    return false; //cancel the pasting event
                }
                justPasted = true;
            });

            var keyClose = false;

            $element.on("keydown", function (e) {
                if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
                    // This is a modified key event. Don't react to those.
                    return true;
                }
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
                    var isMenuShown = menuShown();
                    var bubble = !isMenuShown || preventDefault(e);
                    if (isMenuShown) {
                        menuShown(false);
                    } else {
                        keyClose = true;
                        $element.blur();
                    }
                    return bubble;
                }
                return true;
            });

            $element.on("keyup", function (e) {
                keyClose = false;
                if (justPasted || (separators && separators.test(element.value))) {
                    freeTextSelect();
                    justPasted = false;
                    return;
                }

                var inputKey = Object.keys(keys).every(function (key) {
                    return e.which !== keys[key];
                });

                if (inputKey) {
                    var text = element.value;
                    query(text);
                }
            });

            var mouseInDropdown = false;

            function mouseEnterDropdown() {
                mouseInDropdown = true;
            }

            function mouseLeaveDropdown() {
                mouseInDropdown = false;
            }

            var menuShown = ko.computed({
                read: function () {
                    return this.state();
                },
                write: function (value) {
                    if (value) {
                        if (suggestions().length) {
                            if (!this.state()) {
                                $dropdown.on('mouseenter', mouseEnterDropdown)
                                         .on('mouseleave', mouseLeaveDropdown);
                             }
                            this.state(true);
                            updateVisibilityOption(true);
                        }
                    } else {
                        if (!options.target || options.minLength > 0) {
                            this.state(false);
                            updateVisibilityOption(false);
                            $dropdown.off('mouseenter', mouseEnterDropdown)
                                     .off('mouseleave', mouseLeaveDropdown);
                        }
                    }
                }
            }, { state: ko.observable(false) });

            function updateVisibilityOption(value) {
                if (ko.isObservable(options.visible) &&
                    options.visible.peek() !== value) {
                    options.visible(value);
                }
            }

            if (ko.isObservable(options.visible)) {
                menuShown(options.visible());
                subscriptions.push(options.visible.subscribe(function (visible) {
                    if (visible && query() !== '') {
                        var currentSuggestion = suggestions();
                        var currentSelectedIndex = selectedIndex;
                        query('');
                        if (currentSuggestion.length > 0) {
                            var allSuggestions = suggestions();
                            var newSelectedIndex = arrayMap(allSuggestions, function (suggestion) {
                                return suggestion.label;
                            }).indexOf(currentSuggestion[0].label);
                            moveSelection(currentSelectedIndex, newSelectedIndex);
                        }
                    }
                    menuShown(visible);
                }));
            }

            subscriptions.push(menuShown.subscribe(function (value) {
                if (value) {
                    $dropdown.show();
                    $container.show();
                    if (floatingMenu) {
                        positionMenu();
                    }
                } else {
                    $container.hide();
                    $dropdown.hide();
                }
            }));

            $window.on('scroll.autocomplete', positionMenu);
            $window.on('resize.autocomplete', positionMenu);
            $dropdown.on('scroll.autocomplete', positionMenu);

            $element.on('blur.autocomplete', function (e) {
                if (menuShown() && mouseInDropdown && !keyClose) {
                    // IE blurs the $element when clicking on the scroll bar.
                    // To ensure the dropdown does not close, we refocus the
                    // $element, when not closed intentionally by key press.
                    e.preventDefault();
                    $element.focus();
                    return false;
                }
                menuShown(false);
                mouseInDropdown = false;
                if (query() !== '') {
                    setTimeout(function () {
                        $(':focus').first().each(function (i, el) {
                            if ($dropdown.has(el).length > 0) {
                                el.scrollIntoView(false);
                            }
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
                $dropdown.on('mouseenter', 'li', function (e) {
                    var index = $(this).data('index');
                    moveSelection(selectedIndex, index);
                });

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

                if ((mobileSafari && spaceBelow < 600) || (dropdownHeight > spaceBelow)) {
                    // Place above
                    top = offset.top - dropdownHeight - 5;
                }

                if (right > $window.width()) {
                    left = Math.max($window.width() - dropdownWidth, 0);
                } else {
                    left -= document.body.scrollLeft;
                }

                // Constrain the menu to the viewport
                if (top < document.body.scrollTop) {
                    // constrained by bottom
                    top = document.body.scrollTop;
                    bottom = $window.height() - (offset.top - 5);
                } else {
                    top -= document.body.scrollTop;
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

            subscriptions.push(suggestions.subscribe(function (newValue) {
                selectedIndex = -1;
                $dropdown.empty();
                if (newValue.length) {
                    $dropdown.append(renderSuggestions($dropdown, newValue));
                    selectSuggestion(0);
                    positionMenu();
                    menuShown(true);
                } else {
                    menuShown(false);
                }
            }));

            if (suggestions().length) {
                $dropdown.append(renderSuggestions($dropdown, suggestions()));
                selectSuggestion(0);
            }

            if (options.target && options.minLength === 0) {
                menuShown(true);
            }

            utils.domNodeDisposal.addDisposeCallback(element, function () {
                $window.off('scroll.autocomplete', positionMenu);
                $window.off('resize.autocomplete', positionMenu);
                $dropdown.off('scroll.autocomplete', positionMenu);

                query('');
                $dropdown.remove();
                subscriptions.forEach(function (subscription) {
                    subscription.dispose();
                });
            });

        }
    };
});
