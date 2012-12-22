var examples = examples || {};
(function () {
    var backspace = 8;

    function ItemModel(item) {
        this.value = ko.observable(item);
        this.editing = ko.observable(false);
        this.inputSize = ko.computed(function () {
            return Math.max(1, this.value().length);
        }, this, { deferEvaluation: true });
    }

    function select(items) {
        var that = this;
        items.forEach(function (item) {
            that.completed.push(new ItemModel(item));
        });
        return '';
    }

    function removeLast(data, event) {
        if (this.value().length === 0) {
            this.completed.pop();
        }
    }

    function focusInput() {
        var editing = this.completed().some(function (item) {
            return item.editing();
        });

        if (!editing) {
            this.focused(true);
        }
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
        this.removeLast = removeLast.bind(this);
        this.focusInput = focusInput.bind(this);
        this.removeItem = removeItem.bind(this);

        this.inputSize = ko.computed(function () {
            return Math.max(1, this.value().length);
        }, this, { deferEvaluation: true });
    }

    examples.MultiCompleteModel = MultiCompleteModel;
}());
