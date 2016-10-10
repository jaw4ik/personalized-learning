define([], function () {

    "use strict";

    var accessLimitation = { enabled: false };

    function accessLimitationEnabled() {
        return accessLimitation.enabled;
    }
    function userHasAccess(user) {
        if (!accessLimitationEnabled())
            return true;

        return _.some(accessLimitation.allowedUsers, function(item) {
            return _.isString(item.email) && (item.email.trim().toLowerCase() === user.email.trim().toLowerCase());
        });
    }
    function initialize(accessLimitationSettings, isLmsModuleIncluded) {
        if (!accessLimitationSettings || isLmsModuleIncluded)
            return;

        accessLimitation = accessLimitationSettings;
    }

    return {
        userHasAccess: userHasAccess,
        accessLimitationEnabled: accessLimitationEnabled,
        initialize: initialize
    };
});