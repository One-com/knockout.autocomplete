/*global ko*/
var examples = examples || {};
(function () {
    var backspace = 8;

    function ItemModel(parent, item) {
        var that = this;
        this.parent = parent;
        this.item = item;
        this.value = ko.observable(item);
        this.editing = ko.observable(false);
        this.inputSize = ko.computed(function () {
            return Math.max(1, this.value().length);
        }, this);
        this.edit = function () {
            that.editing(true);
        };
        this.select = function (items) {
            var selected = that.parent.selected;
            var index = selected.indexOf(that.item);
            setTimeout(function () {
                var args = [index, 1].concat(items);
                ko.observableArray.fn.splice.apply(selected, args);
            }, 10);
            that.editing(false);
            that.parent.focusInput();
        };
    }

    function select(items) {
        var that = this;
        items.forEach(function (item) {
            that.selected.push(item);
        });
        return '';
    }

    function removeLast(data, event) {
        if (this.value().length === 0) {
            this.selected.pop();
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
        this.selected.splice(index, 1);
    }

    function MultiCompleteModel(data) {
        var that = this;
        this.selected = ko.observableArray();
        this.completed = ko.computed(function () {
            return that.selected().map(function (item) {
                return new ItemModel(that, item);
            });
        });
        this.items = ko.observableArray(data);
        this.value = ko.observable('');
        this.focused = ko.observable(false);
        this.select = select.bind(this);
        this.removeLast = removeLast.bind(this);
        this.focusInput = focusInput.bind(this);
        this.removeItem = removeItem.bind(this);

        this.inputSize = ko.computed(function () {
            return Math.max(1, that.value().length);
        });
    }

    examples.MultiCompleteModel = MultiCompleteModel;
}());
