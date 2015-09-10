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
});
