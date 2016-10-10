define(['./Question'], function (Question) {

    var ctor = function (question) {
        var that = this;

        Question.call(that, question);

        that.content = question.content;
        that.statements = _.chain(question.answers)
            .sample(question.answers.length)
            .map(function (statement) {
                var isChecked = false,
                    state = null;
                if (!_.isNull(statement.isChecked) && !_.isUndefined(statement.isChecked)) {
                    isChecked = statement.isChecked;
                    state = statement.isChecked;
                    that.isAnswered(true);
                    that.isAnsweredCorrectly(question.score == 100);
                }
                return {
                    id: statement.id,
                    text: statement.text,
                    isChecked: ko.observable(isChecked),
                    state: ko.observable(state),
                    markAsTrue: function () {
                        if (that.isAnswered()) {
                            return;
                        }
                        this.state(true);
                        this.isChecked(true);
                    },
                    markAsFalse: function () {
                        if (that.isAnswered()) {
                            return;
                        }
                        this.state(false);
                        this.isChecked(true);
                    }
                };
            }).value();
        that.isDirty = ko.computed(function () {
            var count = 0;
            _.each(that.statements, function(statement) {
                if (statement.isChecked()) {
                    count++;
                }
            });
            return count === question.answers.length;
        });
        that.resetAnswer = function () {
            that.isAnswered(false);
            that.isAnsweredCorrectly(false);
            _.each(that.statements, function (statement) {
                statement.state(null);
            });
        };

        that.submit = function (preventSendingParentProgress) {
            question.answer(preventSendingParentProgress,
                _.map(that.statements, function (statement) {
                    return {
                        id: statement.id,
                        state: statement.state()
                    };
                })
            );

            that.isAnswered(true);
            that.isAnsweredCorrectly(question.score == 100);
        };
    };

    return ctor;
});