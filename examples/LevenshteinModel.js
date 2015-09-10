/*global ko*/
var examples = examples || {};
(function () {
    function LevenshteinModel(keywords) {
        this.query = ko.observable();
        this.noFilter = true;
        this.maxItems = 8;
        this.minLength = 3;
        this.data = ko.computed(function () {
            var query = this.query();
            if (!query || query.length < this.minLength) {
                return [];
            }

            return keywords.map(function (keyword) {
                return { keyword: keyword, score: Levenshtein.get(keyword, query) };
            }).sort(function (a, b) {
                return a.score - b.score;
            }).slice(0, this.maxItems).map(function (scoredKeyword) {
                return scoredKeyword.keyword;
            });
        }, this);
        this.renderSuggestion = function (completionItem) {
            return document.createTextNode(completionItem.label);
        };
    }

    examples.LevenshteinModel = LevenshteinModel;
}());
