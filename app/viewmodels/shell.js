﻿define(['knockout', 'durandal/app', 'controller', 'loader', 'templateSettings', 'background', 'entities/course', 'modulesInitializer', 'progressContext'], function (ko, app, controller, loader, templateSettings, background, course, modulesInitializer, progressContext) {
    "use strict";

    var viewModel = {
        title: course.title,
        moduleToInitialize: ko.observable(),
        activate: activate,
        logoUrl: ko.observable(),

        activeItem: controller.activeItem,
        compositionComplete: compositionComplete
    };


    viewModel.hasLogo = ko.computed(function () {
        return !_.isEmpty(viewModel.logoUrl());
    });

    return viewModel;

    function activate() {
        return modulesInitializer.init().then(function () {
            viewModel.logoUrl(templateSettings.logoUrl ? templateSettings.logoUrl : '');
            if (progressContext.ready()) {
                viewModel.isProgressDirty = ko.observable(true);

                viewModel.saveProgress = function () {
                    if (viewModel.isProgressDirty()) {
                        progressContext.save();
                    }
                }
                app.on('progressContext:dirty:changed').then(function (isProgressDirty) {
                    viewModel.isProgressDirty(isProgressDirty);
                });

                var progress = progressContext.get();

                if (_.isObject(progress)) {

                    if (_.isObject(progress.answers)) {
                        _.each(course.objectives, function (objective) {
                            _.each(objective.questions, function (question) {
                                if (!_.isNull(progress.answers[question.shortId]) && !_.isUndefined(progress.answers[question.shortId])) {
                                    question.progress(progress.answers[question.shortId], progress.url);
                                }
                            });
                        });
                    }
                }
            }

            return controller.activate();


        });
    }

    function compositionComplete() {
        background.apply(templateSettings.background);

    }

});