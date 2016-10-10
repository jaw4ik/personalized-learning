define([], function () {
    "use strict";

    var ctor = function (id, title) {
        this.id = id;
        this.title = title;
        this.questions = [];

        this.score = function () {
            var questionsThatAffectTheProgress = 0;
            var sum = _.reduce(this.questions, function (memo, question) {
                if(!question.affectProgress){
                    return memo;
                }
                questionsThatAffectTheProgress++;
                if (question.score == 100) {
                    return memo + question.score;
                }
                return memo;
            }, 0);
            
            if(questionsThatAffectTheProgress === 0){
                return 100;
            }
            return Math.ceil(sum / questionsThatAffectTheProgress);
        };

        this.isCompleted = function () {
            return this.score() >= 100;
        };
    };

    return ctor;

});