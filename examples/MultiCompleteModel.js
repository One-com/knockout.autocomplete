var examples = examples || {};
(function () {
    var backspace = 8;

    function select(items) {
        var that = this;
        items.forEach(function (item) {
            that.completed.push(item);
        });
        return '';
    }

    function keyDown(date, event) {
        if (this.value().length === 0 && event.which === backspace) {
            this.completed.pop();
        }
        return true;
    }

    function focusInput() {
        this.focused(true);
    }

    function removeItem(index) {
        this.completed.splice(index, 1);
    }

    function MultiCompleteModel(data) {
        this.completed = ko.observableArray();
        this.items = ko.observableArray(data);
        this.value = ko.observable('');
        this.focused = ko.observable(false);
        this.select = select.bind(this);
        this.keyDown = keyDown.bind(this);
        this.focusInput = focusInput.bind(this);
        this.removeItem = removeItem.bind(this);

        MultiCompleteModel.prototype.inputSize = ko.computed(function () {
            return Math.max(1, this.value().length);
        }, this, { deferEvaluation: true });
    }

    examples.MultiCompleteModel = MultiCompleteModel;
}());