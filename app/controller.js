define(['durandal/app', 'durandal/activator', 'knockout', 'loader', 'templateSettings', 'entities/course', 'userContext', 'xApi/initializer', 'eventManager', 'progressContext', 'constants', 'limitAccess/accessLimiter'],
function (app, activator, ko, loader, templateSettings, course, userContext, xApiInitializer, eventManager, progressContext, constants, accessLimiter) {

    "use strict";

    var self = {
        lifecycle: ['preassessment/viewmodels/index', 'studying/viewmodels/index', 'summary/viewmodels/index']
    };

    var controller = {
        activate: activate

    };

    controller.activeItem = ko.observable();
    controller.activeItem.activationData = ko.observable();
    controller.activeItem.isComposing = ko.observable(true);
    controller.activeItem.id = ko.observable();

    controller.activeItem.compositionComplete = function () {
        controller.activeItem.isComposing(false);
    };
    controller.finish = function () {
        if (controller.activeItem() && controller.activeItem().__moduleId__ === 'preassessment/viewmodels/index') {
            controller.activeItem().answerQuestions();
        }
        self.lifecycle = ['summary/viewmodels/index'];
        return loadModuleAndActivate();
    }

    controller.inProgress = ko.observable(false);
    controller.authenticationSkipped = false;

    return controller;

    function activate() {
        app.on('user:authenticated').then(loadModuleAndActivate);
        app.on('user:navigatedToLogin').then(navigateToLogin);
        app.on('user:authentication-skipped').then(authenticationSkipped);
        app.on('introduction:completed').then(loadModuleAndActivate).then(viewChanged);
        app.on('preassessment:completed').then(loadModuleAndActivate).then(viewChanged);;
        app.on('studying:completed').then(loadModuleAndActivate).then(viewChanged);
        app.on('studying:stop-reading').then(stoppedReading);
        var progress = progressContext.get();
        if (course.content) {
            self.lifecycle.unshift('introduction/viewmodels/index');
        }

        var user = userContext.getCurrentUser(),
            xApiEnabled = templateSettings.xApi && templateSettings.xApi.enabled;

        if (xApiEnabled || accessLimiter.accessLimitationEnabled()) {
            if (user && user.username && (constants.patterns.email.test(user.email) || user.account)) {
                if (_.isObject(progress) && progress.url && progress.user.username === user.username && progress.user.email === user.email) {
                    setLifecycle(progress.url);
                }
                else {
                    if (xApiEnabled) {
                        return xApiInitializer.initialize(user.username, user.email, user.account).then(function() {
                            return eventManager.courseStarted();
                        }).then(function() {
                            return loadModuleAndActivate();
                        });
                    }

                    return loadModuleAndActivate();
                }
            }
            if (_.isObject(progress.user)) {
                setupProgressUser(progress);
                if (xApiEnabled) {
                    xApiInitializer.initialize(progress.user.username, progress.user.email, progress.user.account);
                }
            }
            else {
                self.lifecycle.unshift('login/login');
            }
        }

        if (_.isObject(progress) && progress.url) {
            setLifecycle(progress.url);
        }

        return loadModuleAndActivate();
    }

    function setupProgressUser(progress) {
        if (_.isObject(progress) && progress.user) {
            userContext.user.email = progress.user.email;
            userContext.user.username = progress.user.username;
        }
    }

    function setLifecycle(progressUrl) {
        if (_.isObject(progressUrl)) {
            self.lifecycle = ['studying/viewmodels/index', 'summary/viewmodels/index'];
        }
        var index = _.indexOf(self.lifecycle, progressUrl) + 1;
        self.lifecycle = _.rest(self.lifecycle, index);
    }

    function loadModuleAndActivate() {
        var user = userContext.getCurrentUser();
        controller.activeItem.isComposing(true);

        if (accessLimiter.accessLimitationEnabled() && ((controller.authenticationSkipped && !user) || (user && !accessLimiter.userHasAccess(user)))) {
            return loader.loadModule('limitAccess/noAccess').then(function (module) {
                controller.activeItem(module);
            });
        }

        var path = self.lifecycle.shift();
        var progress = progressContext.get();
        controller.activeItem.activationData.call(null, _.isObject(progress.url) ? _.values(progress.url) : progress.url);

        return loader.loadModule(path).then(function (module) {
            controller.activeItem(module);
            controller.inProgress([
                'preassessment/viewmodels/index',
                'studying/viewmodels/index'
            ].indexOf(module.__moduleId__) > -1);
        });
    }

    function viewChanged() {
        var url = controller.activeItem().__moduleId__;
        app.trigger('view:changed', url);
    }

    function stoppedReading() {
        app.trigger('view:changed', 'preassessment/viewmodels/index');
    }

    function navigateToLogin() {
        controller.authenticationSkipped = false;
        self.lifecycle.unshift('login/login');
        return loadModuleAndActivate();
    }

    function authenticationSkipped() {
        controller.authenticationSkipped = true;
        return loadModuleAndActivate();
    }

});