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

    var times = [];
    Array(24).join(',').split(',').forEach(function (_, index) {
        var hour = index;
        if (hour < 10) {
            hour = '0' + hour;
        }
        times.push(hour + ':00');
        times.push(hour + ':30');
    });

    var timeQuery = ko.observable('');
    var timeData = ko.computed(function () {
        return times.filter(function (time) {
            var query = timeQuery();
            return query === time.substring(0, query.length);
        });
    });

    var viewModel = {
        keywords: keywords,
        multiComplete: new examples.MultiCompleteModel(keywords),
        levenshtein: new examples.LevenshteinModel(keywords),
        flashWord: ko.observable(),
        timeQuery: timeQuery,
        timeData: timeData
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
