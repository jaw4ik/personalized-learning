define(['durandal/system', 'durandal/app', 'translation', 'eventManager', 'entities/course', 'userContext'], function (system, app, translation, eventManager, course, userContext) {
    var
       self = {
           storage: null,
           progress: {
               _v: 1,
               answers: {},
               url: null,
               user: null,
               attemptId: system.guid()
           }
       },
       context = {
           save: save,
           get: get,
           remove: remove,

           use: use,
           ready: ready,
       }
    ;

    return context;

    function authenticated(user) {
        self.progress.user = user;
        save();
    }

    function authenticationSkipped() {
        self.progress.user = 0;
        save();
    }

    function questionAnswered(question) {
        try {
            self.progress.answers[question.question.shortId] = question.question.progress();
            save();
        } catch (e) {
            console.error(e);
        }
    }

    function save(url) {
        if (!self.storage || !_.isObject(self.progress)) {
            return;
        }
        if (url) {
            self.progress.url = url;
        }
        self.storage.saveProgress(self.progress);
    }

    function remove() {
        if (!self.storage) {
            return;
        }
        if (_.isFunction(self.storage.removeProgress)) {
            self.storage.removeProgress();
        }
    }

    function use(storage) {
        if (!_.isFunction(storage.getProgress) || !_.isFunction(storage.saveProgress)) {
            throw 'Cannot use this storage';
        }

        var user = null;
        if (_.isObject(userContext) && _.isFunction(userContext.getCurrentUser)) {
            user = userContext.getCurrentUser();
        }
        self.progress._v = course.createdOn.getTime();
        self.storage = storage;
        var progress = storage.getProgress();
        if (_.isObject(user) && user.username && user.email) {
            if (!_.isEmpty(progress) && !_.isEmpty(progress.user) && progress.user.username === user.username && progress.user.email === user.email) {
                self.progress = progress;
            }
            else {
                self.progress.user = {
                    username: user.username,
                    email: user.email
                }
                if(user.account) {
                    self.progress.user.account = user.account;
                }
                self.progress.answers = {};
            }
        }
        else {
            if (!_.isEmpty(progress) && _.isString(progress.attemptId)) {
                self.progress = progress;
            }
        }
        eventManager.subscribeForEvent(eventManager.events.questionAnswered).then(questionAnswered);
        app.on('user:authenticated').then(authenticated);
        app.on('user:authentication-skipped').then(authenticationSkipped);
        app.on('view:changed').then(save);
        app.on('course:finished').then(remove);
        app.on('progress:error').then(showStorageError);

    }

    function showStorageError() {
        window.onbeforeunload = function () {
            return translation.getTextByKey('[progress cannot be saved]');
        };
    }

    function get() {
        return self.progress;
    }

    function ready() {
        return !!self.storage;
    }
});