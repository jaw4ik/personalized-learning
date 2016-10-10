define(['eventManager'], function (eventManager) {
    "use strict";
    var index = 0;

    var ctor = function (id, title, type, _protected, isSurvey) {
        var that = this;
        that.shortId = index++;
        that.id = id;
        that.title = title;
        that.type = type;
        that.score = 0;
        that.isCompleted = false;
        that.affectProgress = true;

        if(!_.isNull(isSurvey) && !_.isUndefined(isSurvey)){
            that.isSurvey = !!isSurvey;
            that.affectProgress = !that.isSurvey;
        }

        that.answer = function () {
            var preventSendingParentProgress = [].splice.call(arguments, 0, 1)[0];
            if(that.hasOwnProperty('isSurvey') && that.isSurvey){
                that.score = 100;
            } else {
                _protected.answer.apply(that, arguments);
            }
            eventManager.questionAnswered({
                question: that,
                answer: arguments[0]
            }, preventSendingParentProgress);
        };

        that.progress = function (data, url) {
            if (data) {
                _protected.restoreProgress(data);
                if (_.isObject(url) && url.question === that.id) {
                    that.isCompleted = true;
                }

            } else {
                return _protected.getProgress.call(that);
            }
        };

    }

    return ctor;
});