/*global ko*/
var examples = examples || {};
(function () {
    var times = [];
    Array(24).join(',').split(',').forEach(function (_, index) {
        var hour = index;
        if (hour < 10) {
            hour = '0' + hour;
        }
        times.push(hour + ':00');
        times.push(hour + ':30');
    });

    function normalizeTime(text) {
        return text.replace(/^0([1-9])/, '$1');
    }

    function TimeComplete() {
        var that = this;
        this.timeQuery = ko.observable('');
        this.timeData = ko.computed(function () {
            return times.filter(function (time) {
                var query = normalizeTime(this.timeQuery());
                return query === normalizeTime(time).substring(0, query.length);
            }, this);
        }, this);
        this.visible = ko.observable(false);
        this.focused = ko.observable(false);
        this.visible.subscribe(function (value) {
            if (value) {
                this.focused(true);
            }
        }, this);
    }

    TimeComplete.prototype.hide = function (viewModel) {
        viewModel.visible(false);
    };

    TimeComplete.prototype.toggleVisible = function (viewModel, event) {
        if (event.button === 0) {
            viewModel.visible(!viewModel.visible());
        }
    };


    examples.TimeComplete = TimeComplete;
}());
