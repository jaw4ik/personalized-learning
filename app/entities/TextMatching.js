﻿define(['_', 'entities/Question'], function (_, Question) {

    var TextMatching = function (id, title, type, answers) {
        var that = this,
            _protected = {
                answer: answer,
                restoreProgress: restoreProgress,
                getProgress: getProgress
            };

        Question.call(that, id, title, type, _protected);
        that.answers = answers;
        var checkedAnswers = null;

        function answer(pairs) {
            checkedAnswers = pairs;
            var correct = 0;
            _.each(that.answers, function (answer) {
                if (_.find(pairs, function (pair) {
                    return pair.id == answer.id && pair.value == answer.value;
                })) {
                    correct++;
                }

            });
            that.score = correct == that.answers.length ? 100 : 0;

        }

        function restoreProgress(progress) {
            if (progress == 100) {
                _.each(that.answers, function (answer) {
                    answer.attemptedValue = answer.value;
                    that.score = 100;
                });
                return;
            }
            _.each(progress, function(progressItem, index) {
                that.answers[index].attemptedValue = progressItem.value;
            });
        }
        function getProgress() {
            if (this.score == 100) {
                return 100;
            } else {
                return checkedAnswers;
            }
        }
    };


    return TextMatching;

})