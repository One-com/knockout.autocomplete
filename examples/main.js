/*global ko*/
(function () {
    var keywords = [
        'abstract', 'add', 'alias', 'as', 'ascending', 'async', 'await', 'base', 'bool', 'break',
        'byte', 'case', 'catch', 'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate',
        'descending', 'do', 'double', 'dynamic', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally',
        'fixed', 'float', 'for', 'foreach', 'from', 'get', 'global', 'goto', 'group', 'if', 'implicit',
        'in', 'int', 'interface', 'internal', 'into', 'is', 'join', 'let', 'lock', 'long', 'namespace',
        'new', 'null', 'object', 'operator', 'orderby', 'out', 'override', 'params', 'partial', 'private', 'protected',
        'public', 'readonly', 'ref', 'remove', 'return', 'sbyte', 'sealed', 'select', 'set', 'short', 'sizeof',
        'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint',
        'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'value', 'var', 'virtual', 'void', 'volatile', 'where',
        'while', 'yield'
    ];

    var backspace = 8;
    var singleComplete = {
        items: ko.observableArray(keywords)
    };

    var multiComplete = {
        completed: ko.observableArray(),
        items: ko.observableArray(keywords),
        select: function (item) {
            multiComplete.completed.push(item);
            return '';
        },
        value: ko.observable(''),
        keyDown: function (date, event) {
            if (multiComplete.value().length === 0 && event.which === backspace) {
                multiComplete.completed.pop();
            }
            return true;
        },
        focused: ko.observable(true),
        focusInput: function () {
            multiComplete.focused(true);
        },
        removeItem: function (index) {
            multiComplete.completed.splice(index, 1);
        }
    };

    var viewModel = {
        keywords: keywords,
        singleComplete: singleComplete,
        multiComplete: multiComplete
    };
    ko.applyBindings(viewModel, document.getElementById('application'));
}());
