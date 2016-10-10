define(['knockout', 'durandal/app', 'xApi/configuration/settings', 'xApi/initializer', 'eventManager', 'templateSettings', 'userContext', 'constants', 'limitAccess/accessLimiter'],
    function (ko, app, settingsModule, initializer, eventManager, templateSettings, userContext, constants, accessLimiter) {
        "use strict";

        var viewModel = {
            username: (function () {
                var value = ko.observable();
                value.trim = function () {
                    value(ko.utils.unwrapObservable(value).trim());
                };

                value.isValid = ko.computed(function () {
                    return value() && value().length;
                });

                return value;
            })(),
            email: (function () {
                var value = ko.observable();
                value.trim = function () {
                    value(ko.utils.unwrapObservable(value).trim());
                };

                value.isValid = ko.computed(function () {
                    return value() && constants.patterns.email.test(value());
                });

                return value;
            })(),
            account: null,
            showError: ko.observable(false),
            reportRequired: ko.observable(false),
            callback: null,
            justStart: justStart,
            login: login,
            activate: activate
        };

        var xApiEnabled = templateSettings.xApi && templateSettings.xApi.enabled;

        return viewModel;

        function activate() {
            viewModel.reportRequired(xApiEnabled ? templateSettings.xApi.required : false);
            var user = userContext.getCurrentUser();
            if (user) {
                viewModel.account = user.account;
                viewModel.username(user.username);
                viewModel.email(user.email);
                viewModel.showError(true);
            }
        }

        function justStart() {
            if (viewModel.reportRequired()) {
                return;
            }

            app.trigger('user:authentication-skipped');
        }

        function login() {
            if (viewModel.username.isValid() && (viewModel.email.isValid() || viewModel.account)) {
                userContext.user.email = viewModel.email();
                userContext.user.username = viewModel.username();

                if (xApiEnabled && accessLimiter.userHasAccess(userContext.user)) {
                    settingsModule.settings.actor.name = viewModel.username();
                    settingsModule.settings.actor.email = viewModel.email();
                    settingsModule.settings.actor.account = viewModel.account;

                    initializer.initialize().then(function () {
                        return eventManager.courseStarted();
                    }).then(function () {
                        var user = {
                            username: viewModel.username(),
                            email: viewModel.email() || viewModel.account.name
                        };
                        if (viewModel.account) {
                            user.account = viewModel.account;
                        }
                        app.trigger('user:authenticated', user);
                    });
                } else {
                    if (accessLimiter.userHasAccess(userContext.user)) {
                        eventManager.courseStarted();
                    }

                    app.trigger('user:authenticated',
                       {
                           username: viewModel.username(),
                           email: viewModel.email()
                       });
                }
            } else {
                viewModel.showError(true);
            }

        }
    })