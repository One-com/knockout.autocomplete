## knockout.autocompletion

An auto completion binding for Knockout.

[![Build Status](https://travis-ci.org/One-com/knockout.autocomplete.svg?branch=master)](https://travis-ci.org/One-com/knockout.autocomplete)

### Usage

```js
var viewModel = {
    keywords: ko.observableArray([
        'abstract', 'add', 'alias', 'as', 'ascending',
        'async', 'await', 'base', 'bool', 'break'
    ])
};
ko.applyBindings(viewModel);
```

```html
<input data-bind="autocomplete: { data: keywords, maxItems: 6 }" value=""/>
```

### API

You can use the following options to configure the behavior of the auto
completion.

#### data (required)

An array or an observable array of completion candidates.

#### maxItems (default 8)

The number of items that the auto completion binding should maximally show.

#### minLength (default 1)

The min lenght of the query before showing the completion suggestions. 

#### format (default toString)

A function that will format the items for displaying as suggestions to the user.
The function should return a string.

#### onSelect (default toString)

The function that will be called when a completion suggestion has been chosen by
the user. You can return a string from the function to update the value of the
input field.

#### query (default ko.observable(''))

An observable the contain the text query the items should be filtered by.

#### className

A css class that will be applied to the menu element. 

#### visible

An observable that decides whether the completion menu is shown.

#### noFilter (default false)

Use this flag to disable automatically filtering of the data items.

#### separators (default null)

A string of characters that will trigger a completion. See the examples for how
to complete on comma or semicolon.

#### renderSuggestion (default function that highlights the match)

Here is a rendering function the item without highlighting the match:

```js
function (completionItem) {
    return  '<li>' + completionItem.label + '</li>';
};
```

### Examples

[Click here to see an example](https://cdn.rawgit.com/One-com/knockout.autocomplete/master/examples/index.html)

# Licence

```
Copyright 2012 Sune Simonsen
https://github.com/One-com/knockout.autocomplete

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
