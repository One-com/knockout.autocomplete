/*global useTestElement, ko, $*/

var keywords = [
    'abstract', 'add', 'alias', 'as', 'ascending', 'async', 'await', 'base',
    'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class',
    'const', 'continue', 'decimal', 'default', 'delegate', 'descending', 'do',
    'double', 'dynamic', 'else', 'enum', 'event', 'explicit', 'extern', 'false',
    'finally', 'fixed', 'float', 'for', 'foreach', 'from', 'get', 'global',
    'goto', 'group', 'if', 'implicit', 'in', 'int', 'interface', 'internal',
    'into', 'is', 'join', 'let', 'lock', 'long', 'namespace', 'new', 'null',
    'object', 'operator', 'orderby', 'out', 'override', 'params', 'partial',
    'private', 'protected', 'public', 'readonly', 'ref', 'remove', 'return',
    'sbyte', 'sealed', 'select', 'set', 'short', 'sizeof', 'stackalloc',
    'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try',
    'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using',
    'value', 'var', 'virtual', 'void', 'volatile', 'where', 'while', 'yield'
];

describe('knockout.autocomplete', function () {
    var $testElement;
    var viewModel;

    afterEach(function () {
        clearTestElement();
    });

    describe('simple completion', function () {
        beforeEach(function () {
            $testElement = useTestElement('<input data-bind="autocomplete: { data: keywords, maxItems: 6 }" value="">');
            viewModel = {
                data: ko.observable(keywords)
            };
            ko.applyBindings(viewModel, $testElement[0]);
        });

        describe('with a query that have matches', function () {
            beforeEach(function () {
                $testElement.val('pr').trigger('change');
                keyUp($testElement);
            });

            it('should render the floating menu correctly', function () {
                expect(getMenu(), 'to satisfy', {
                    attributes: {
                        style: { display: 'block' },
                        'class': ['knockout-autocomplete', 'floating-menu']
                    },
                    children: [
                        {
                            attributes:  { 'data-index': '0', 'class': 'selected' },
                            children: [
                                { attributes: { 'class': 'before' }, textContent: '' },
                                { attributes: { 'class': 'match' }, textContent: 'pr'  },
                                { attributes: { 'class': 'after' }, textContent: 'ivate' }
                            ]
                        },
                        {
                            attributes:  { 'data-index': '1', 'class': undefined },
                            children: [
                                { attributes: { 'class': 'before' }, textContent: '' },
                                { attributes: { 'class': 'match' }, textContent: 'pr' },
                                { attributes: { 'class': 'after' }, textContent: 'otected' }
                            ]
                        }
                    ]
                });
            });
        });

        describe('with a query that does not have any matches', function () {
            beforeEach(function () {
                $testElement.val('foobar').trigger('change');
                keyUp($testElement);
            });

            it('the menu should be hidden', function () {
                expect(getMenu(), 'to satisfy', {
                    attributes: {
                        style: { display: 'none' },
                        'class': ['knockout-autocomplete', 'floating-menu']
                    },
                    children: []
                });
            });
        });
    });

    describe('blurring autocomplete element', function () {
        beforeEach(function () {
            $testElement = useTestElement('<input data-bind="autocomplete: { data: keywords, minLength: 0 }" value="">');
            viewModel = {
                data: ko.observable(keywords)
            };
            ko.applyBindings(viewModel, $testElement[0]);
        });

        describe('floating menu closed', function () {
            beforeEach(function () {
                $testElement.focus();
            });

            afterEach(function () {
                keyUp($testElement);
            });

            it('should blur correctly on esc close', function () {
                keyDown($testElement, { which: 27 }); // 27 = escape key

                expect(document.activeElement, 'not to equal', $testElement[0]);
            });

            it('should blur correctly when mouse is away from element and floating menu', function () {
                $('#mocha').trigger('mouseenter');
                $testElement.blur();

                expect(document.activeElement, 'not to equal', $testElement[0]);
            });
        });

        describe('floating menu open', function () {
            beforeEach(function () {
                $testElement.val('pr').trigger('change');
                keyUp($testElement);
            });

            afterEach(function () {
                keyUp($testElement);
            });

            it('should blur correctly on esc close', function () {
                keyDown($testElement, { which: 27 }); // 27 = escape key

                expect(document.activeElement, 'not to equal', $testElement[0]);
            });

            it('should blur correctly when mouse is away from element and floating menu', function () {
                $('#mocha').trigger('mouseenter');
                $testElement.blur();

                expect(document.activeElement, 'not to equal', $testElement[0]);
            });

            it('should not blur when mouse is over floating menu', function () {
                $('.floating-menu').trigger('mouseenter');
                $testElement.blur();

                expect(document.activeElement, 'to equal', $testElement[0]);
            });
        });
    });

    describe('tracking when the mouse is over the floating menu', function () {
        beforeEach(function () {
            $testElement = useTestElement('<input data-bind="autocomplete: { data: keywords, minLength: 0 }" value="">');
            viewModel = {
                data: ko.observable(keywords)
            };
            ko.applyBindings(viewModel, $testElement[0]);
        });

        describe('attaching enter/leave event to the dropdown', function () {
            describe('when changing the query phase', function () {
                var beforeOverEvents;
                var beforeOutEvents;
                beforeEach(function () {
                    var menuEvents = $._data( $('.floating-menu')[0], 'events');
                    beforeOverEvents = menuEvents.mouseover && menuEvents.mouseover.length || 0;
                    beforeOutEvents = menuEvents.mouseout && menuEvents.mouseout.length || 0;

                    $testElement.val('fi').trigger('change');
                    keyUp($testElement);

                    $testElement.val('fin').trigger('change');
                    keyUp($testElement);

                    $testElement.val('fina').trigger('change');
                    keyUp($testElement);

                    $testElement.val('final').trigger('change');
                    keyUp($testElement);
                });

                it('should only have add one enter event', function () {
                    var menuEvents = $._data( $('.floating-menu')[0], 'events');

                    expect(menuEvents.mouseover.length - beforeOverEvents, 'to equal', 1);
                });

                it('should only have add one leave event', function () {
                    var menuEvents = $._data( $('.floating-menu')[0], 'events');

                    expect(menuEvents.mouseout.length - beforeOutEvents, 'to equal', 1);
                });

            });
        });
    });

    describe('Update position events', function () {
        beforeEach(function () {
            $testElement = useTestElement('<input data-bind="autocomplete: { data: keywords, minLength: 0 }" value="">');
            viewModel = {
                data: ko.observable(keywords)
            };
            ko.applyBindings(viewModel, $testElement[0]);
        });

        describe('added autocomplete element', function () {
            it('should have scroll event on window', function () {
                var events = $._data(window, 'events');
                expect(events.scroll.length, 'to be', 1);
            });
            it('should have scroll event on dropdown container', function () {
                var events = $._data(getMenu(), 'events');
                expect(events.scroll.length, 'to be', 1);
            });
            it('should have resize event on window', function () {
                var events = $._data(window, 'events');
                expect(events.resize.length, 'to be', 1);
            });

            describe('after removing autocomplete element', function () {
                beforeEach(function () {
                    clearTestElement();
                });

                it('should not have events on window', function () {
                    var events = $._data(window, 'events');
                    expect(events, 'to be falsy');
                });
            });
        });
    });
});
