(function (ko) {
    function specialKeyHandler(key) {
        return {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                var handler = ko.utils.unwrapObservable(valueAccessor());
                var options = {
                    keydown: function (data, event) {
                        if (event.which === key) {
                            handler(data, event);
                        }
                        return true;
                    }
                };

                function optionsAccessor() {
                    return options;
                }
                ko.bindingHandlers.event.init(element, optionsAccessor, allBindingsAccessor, viewModel);
            }
        };
    }
    
    ko.bindingHandlers.onBackspace = specialKeyHandler(8);
    ko.bindingHandlers.onEnter = specialKeyHandler(13);
}(ko));
