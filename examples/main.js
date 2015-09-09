/*global ko, examples*/
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

    var viewModel = {
        keywords: keywords,
        multiComplete: new examples.MultiCompleteModel(keywords),
        levenshtein: new examples.LevenshteinModel(keywords),
        flashWord: ko.observable(),
        timeComplete: new examples.TimeComplete()
    };

    viewModel.flashWord.subscribe(function (newValue) {
        setTimeout(function () {
            if (viewModel.flashWord() === newValue) {
                viewModel.flashWord('');
            }
        }, 1000);
    });

    ko.applyBindings(viewModel, document.getElementById('application'));
}());
