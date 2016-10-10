define(['userContext', 'durandal/app'], function (userContext, app) {

    "use strict";

    return {
        backToSignin: function () {
            userContext.clear();
            app.trigger('user:navigatedToLogin');
        }
    };
});