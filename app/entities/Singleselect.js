define(['_', 'entities/Question'], function (_, Question) {

    var ctor = function (id, title, type, isSurvey, answers) {
        var that = this,
            _protected = {
                answer: answer,
                restoreProgress: restoreProgress,
                getProgress: getProgress
            };

        Question.call(that, id, title, type, _protected, isSurvey);

        that.answers = answers;
        var checkedAnswers = null;

        function answer(answerIds) {
            checkedAnswers = answerIds;
            var correctAnswers = _.filter(that.answers, function (answer) {
                return answer.isCorrect === true;
            });

            var correctAnswerIds = _.map(correctAnswers, function (answer) {
                return answer.id;
            });

            if (_.difference(correctAnswerIds, answerIds).length === 0 && _.difference(answerIds, correctAnswerIds).length === 0) {
                that.score = 100;
            } else {
                that.score = 0;
            }
        };

        function restoreProgress(progress) {
            _.each(that.answers, function (answer) {
                if (answer.isCorrect && progress == 100) {
                    that.score = 100;
                    answer.isChecked = true;
                } else {
                    if (_.find(progress, function (progressItem) {
                        return progressItem == answer.id;
                    })) {
                        answer.isChecked = true;
                    };
                }
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

    return ctor;

})