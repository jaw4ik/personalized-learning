define(['knockout', 'durandal/app', '../configuration/settings', '../initializer', 'eventManager', 'templateSettings', 'userContext', 'constants'], function (ko, app, settingsModule, initializer, eventManager, templateSettings, userContext, constants) {
    "use strict";

    var viewModel = {
        username: (function () {
            var value = ko.observable();
			value.trim = function() {
                value(ko.utils.unwrapObservable(value).trim());
            };
			
            value.isValid = ko.computed(function () {
                return value() && value().length;
            });

            return value;
        })(),
        email: (function () {
            var value = ko.observable();
			value.trim = function() {
                value(ko.utils.unwrapObservable(value).trim());
            };
			
            value.isValid = ko.computed(function () {
                return value() && constants.patterns.email.test(value());
            });

            return value;
        })(),
        account: null,
        showError: ko.observable(false),
        reportRequired: templateSettings.xApi.required,

        callback: null,
        justStart: justStart,
        report: report,
        activate: activate
    };

    return viewModel;

    function activate() {
        var user = userContext.getCurrentUser();
        if (user) {
            viewModel.username(user.username);
            viewModel.email(user.email);
            viewModel.account = user.account;
            viewModel.showError(true);
        }
    }

    function justStart() {
        if (viewModel.reportRequired) {
            return;
        }

        app.trigger('xApi:authentication-skipped');
    }

    function report() {
        if (viewModel.username.isValid() && (viewModel.email.isValid() || viewModel.account)) {

            settingsModule.settings.actor.name = viewModel.username();
            settingsModule.settings.actor.email = viewModel.email();
            settingsModule.settings.actor.account = viewModel.account;

            initializer.initialize().then(function () {
                return eventManager.courseStarted();
            }).then(function () {
                var user = {
                    username:viewModel.username(),
                    email:viewModel.email() || viewModel.account.name
                };
                if(viewModel.account) {
                    user.account = viewModel.account;
                }
                app.trigger('xApi:authenticated', user);
            });
        } else {
            viewModel.showError(true);
        }

    }
})