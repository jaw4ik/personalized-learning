define(['_', 'entities/Question'], function (_, Question) {

    var ctor = function(id, title, type, isSurvey, answers) {
        var that = this,
            _protected = {
                answer: answer,
                restoreProgress: restoreProgress,
                getProgress: getProgress
            };

        Question.call(that, id, title, type, _protected, isSurvey);

        that.answers = answers;
        var checkedAnswers = null;
        function answer(userAnswers) {
            checkedAnswers = userAnswers;
            that.score = _.every(that.answers, function (answer) {
                var userAnswer = _.find(userAnswers, function(statement) {
                    return answer.id == statement.id;
                });
                answer.userAnswer = userAnswer.state;
                return answer.isCorrect === userAnswer.state;
            }) ? 100 : 0;
        };
        function restoreProgress(progress) {
            _.each(that.answers, function(answer) {
                answer.isChecked = null;
                if (progress!=100){
                    var progressValue = _.find(progress, function(progressItem) {
                        return progressItem.id == answer.id;
                    });
                    answer.isChecked = progressValue.state;
                }
                if (progress == 100) {
                    answer.isChecked = answer.isCorrect;
                    that.score = 100;
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

});